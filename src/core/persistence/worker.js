import { createHash } from "node:crypto";
import { writeFile, rename, readFile } from "node:fs/promises";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
// createHash via crypto;
import { DatabaseSync } from "node:sqlite";
import { assertJournalBalanced } from "../domain/invariants/index.js";
import { assertAccountUsable } from "../accounting/chartOfAccounts.js";
import { ensureSchemaSync } from "../db/migration.js";

const DEFAULT_DIR = join(process.cwd(), ".pf-data");
const __dirname = dirname(fileURLToPath(import.meta.url));

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function resolveSchemaSql() {
  const candidates = [
    join(process.cwd(), "docs/core/db/schema.sql"),
    join(__dirname, "../../../docs/core/db/schema.sql"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, "utf8");
  }
  throw new Error("SCHEMA_SQL_MISSING:docs/core/db/schema.sql");
}

function prepareSchema(sql) {
  return sql
    .split("\n")
    .map((line) => {
      const i = line.indexOf("--");
      return i >= 0 ? line.slice(0, i) : line;
    })
    .join("\n");
}

const openDbs = new Map();

export function openDb(dataDir) {
  ensureDir(dataDir);
  const dbPath = join(dataDir, "personal-fi.sqlite");
  if (openDbs.has(dbPath)) return openDbs.get(dbPath);
  const db = new DatabaseSync(dbPath);
  // B-026: single schema entry via migration manager (sync ensure)
  ensureSchemaSync(db);
  openDbs.set(dbPath, db);
  return db;
}

export function closeAllDbs() {
  for (const db of openDbs.values()) {
    try {
      db.close();
    } catch {
      /* ignore */
    }
  }
  openDbs.clear();
}

export async function persistOperation(record, options = {}) {
  const dir = options.dataDir || DEFAULT_DIR;
  ensureDir(dir);
  const mode = options.mode || "sqlite";
  if (mode === "json") return persistOperationJson(record, dir);
  return persistOperationSqlite(record, dir);
}

function persistOperationSqlite(record, dir) {
  if (!record.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const id = record.operationId;
  const journalLines = record.journalLines || [];

  // P0: no implicit date/currency (before status)
  if (!record.businessDate || typeof record.businessDate !== "string") {
    throw new Error("OP_BUSINESS_DATE_REQUIRED");
  }
  if (!record.baseCurrency || typeof record.baseCurrency !== "string") {
    throw new Error("OP_BASE_CURRENCY_REQUIRED");
  }

  // P0-OP-005: no silent posted default when lines present
  let status = record.status;
  if (status == null || status === "") {
    if (journalLines.length) throw new Error("OP_STATUS_REQUIRED");
    status = "draft";
  }
  if (!["draft", "posted", "voided", "failed"].includes(status)) {
    throw new Error(`OP_STATUS_INVALID:${status}`);
  }

  const db = openDb(dir);
  const now = new Date().toISOString();
  const businessDate = record.businessDate;
  const baseCurrency = record.baseCurrency;

  // Account usability is verified inside the transaction after domain bootstrap (withinTransaction).

  const resultSnapshot = {
    operationId: id,
    commandHash: record.commandHash,
    type: record.type || "unknown",
    status,
    businessDate,
    baseCurrency,
    engineVersions: record.engineVersions || null,
    domainResult: record.domainResult ?? null,
    journalLines,
    durability_state: "sql_committed",
    // B-022: preserve request envelope for no-field-loss / replay (domain tables remain SoT for owned fields)
    payload: record.payload ?? null,
    normalizedRequest: record.normalizedRequest ?? null,
    source: record.source ?? null,
    rates: record.rates ?? null,
    settlementDate: record.settlementDate ?? null,
    eventAt: record.eventAt ?? null,
    provenance: record.provenance ?? null,
  };

  try {
    db.exec("BEGIN IMMEDIATE");

    // Existing row → idempotent semantics at DB layer
    const existing = db.prepare(`SELECT id, command_hash, result_json FROM fin_operations WHERE id = ?`).get(id);
    if (existing) {
      if (existing.command_hash !== record.commandHash) {
        db.exec("ROLLBACK");
        throw new Error("OP_IDEMPOTENCY_CONFLICT");
      }
      db.exec("ROLLBACK");
      // BUG-FINAL-017: never trust result_json alone — rebuild from relational SoT
      return loadOperationSync(db, id, true);
    }

    // P0-OP-008: insert row first as draft while durability=pending; promote after journal
    const insertStatus = status === "posted" ? "draft" : status;
    // P0-011: source_channel vs source_type vs source_reference
    const sourceChannel =
      record.sourceChannel ?? record.source_channel ?? record.source ?? null;
    const sourceType = record.sourceType ?? record.source_type ?? null;
    const sourceReference = record.sourceReference ?? record.source_reference ?? null;
    db.prepare(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, event_at, settlement_date, base_currency, engine_versions,
        source_channel, source_type, source_reference, source, created_at, posted_at, result_json
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
    ).run(
      id,
      record.commandHash || null,
      record.type || "unknown",
      insertStatus,
      businessDate,
      record.eventAt ?? null,
      record.settlementDate ?? null,
      baseCurrency,
      record.engineVersions ? JSON.stringify(record.engineVersions) : null,
      sourceChannel,
      sourceType,
      sourceReference,
      sourceChannel, // legacy alias
      now,
    );

    // Domain bootstrap + subledger (operation row already exists for FKs)
    if (typeof record.withinTransaction === "function") {
      record.withinTransaction(db, { operationId: id, businessDate, baseCurrency });
    }

    // P0-OP-009 ordered validation after bootstrap:
    // account identity/currency → FX/base → balance → domain already applied
    for (const line of journalLines) {
      const aid = line.accountId || line.account_id;
      if (!line.currency) throw new Error("JOURNAL_LINE_CURRENCY_REQUIRED");
      const lineCur = line.currency;
      const acc = assertAccountUsable(db, aid);
      if (acc.currency !== lineCur) throw new Error("ACCOUNT_CURRENCY_MISMATCH");
      // P0-OP-010: fill same-currency base; require FX path for cross-currency when posting
      if (line.amountInBase == null && line.amount_in_base == null) {
        if (lineCur === baseCurrency) {
          line.amountInBase = line.amount;
          line.exchangeRateToBase = line.exchangeRateToBase ?? "1";
        } else if (status === "posted") {
          throw new Error("INV_JOURNAL_MISSING_AMOUNT_IN_BASE");
        }
      }
      if (status === "posted" && lineCur !== baseCurrency) {
        const fx = line.exchangeRateToBase ?? line.exchange_rate_to_base;
        if (fx == null) throw new Error("INV_JOURNAL_MISSING_EXCHANGE_RATE");
        if (line.conversionPath == null && line.conversion_path == null) {
          line.conversionPath = "direct";
        }
      }
    }
    if (journalLines.length) assertJournalBalanced(journalLines);

    const entryId = randomUUID();
    const postState = status === "posted" ? "posted" : status === "voided" ? "void" : "draft";
    db.prepare(
      `INSERT INTO fin_journal_entries (id, operation_id, business_date, memo, created_at, post_state)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(entryId, id, businessDate, record.memo || null, now, postState);

    const insLine = db.prepare(
      `INSERT INTO fin_journal_lines (
        id, entry_id, account_id, side, amount, currency, line_number,
        amount_in_base, exchange_rate_to_base, conversion_path, line_kind, memo, reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    journalLines.forEach((line, i) => {
      const ln = line.line_number ?? i + 1;
      if (!Number.isInteger(ln) || ln < 1) throw new Error("JOURNAL_LINE_NUMBER_INVALID");
      const amountInBase = line.amountInBase ?? line.amount_in_base ?? null;
      const fx = line.exchangeRateToBase ?? line.exchange_rate_to_base ?? null;
      const path = line.conversionPath ?? line.conversion_path ?? null;
      const kind = line.lineKind ?? line.line_kind ?? null;
      insLine.run(
        randomUUID(),
        entryId,
        line.accountId || line.account_id,
        line.side,
        line.amount,
        line.currency,
        ln,
        amountInBase,
        fx,
        path,
        kind,
        line.memo ?? null,
        line.reference ?? null,
      );
    });

    // P0-OP-008/007: only after relational truth exists — promote status + snapshot
    resultSnapshot.durability_state = "sql_committed";
    resultSnapshot.status = status;
    const snapJson = JSON.stringify(resultSnapshot);
    const resultHash = createHash("sha256").update(snapJson).digest("hex");
    resultSnapshot.result_hash = resultHash;
    db.prepare(
      `UPDATE fin_operations SET
         status = ?,
         durability_state = 'sql_committed',
         posted_at = ?,
         result_json = ?,
         result_schema_version = ?,
         result_hash = ?,
         event_at = COALESCE(event_at, ?),
         settlement_date = COALESCE(settlement_date, ?)
       WHERE id = ?`,
    ).run(
      status,
      status === "posted" ? now : null,
      JSON.stringify(resultSnapshot),
      "1.0.0",
      resultHash,
      record.eventAt ?? null,
      record.settlementDate ?? null,
      id,
    );
    // Prefer db_meta for persistence durability (business status stays on fin_operations.status)
    db.prepare(
      `INSERT OR REPLACE INTO db_meta(key, value) VALUES (?, ?)`,
    ).run(`durability.operation.${id}`, "sql_committed");
    db.prepare(
      `INSERT OR REPLACE INTO db_meta(key, value) VALUES ('durability.last', ?)`,
    ).run("sql_committed");
    db.exec("COMMIT");

    return { ...resultSnapshot, durability_state: "sql_committed", idempotentReplay: false };
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    // Map SQLite unique to API conflict
    if (e && /UNIQUE constraint failed.*fin_operations/i.test(String(e.message || e))) {
      const existing = db.prepare(`SELECT command_hash, result_json FROM fin_operations WHERE id = ?`).get(id);
      if (existing) {
        if (existing.command_hash !== record.commandHash) throw new Error("OP_IDEMPOTENCY_CONFLICT");
        return loadOperationSync(db, id, true);
      }
      throw new Error("OP_IDEMPOTENCY_CONFLICT");
    }
    throw e;
  }
}

function loadOperationSync(db, operationId, replay = false) {
  const row = db.prepare(`SELECT * FROM fin_operations WHERE id = ?`).get(operationId);
  if (!row) throw new Error("OP_NOT_FOUND");

  if (row.result_json) {
    const snap = JSON.parse(row.result_json);
    // result_json is replay metadata only; journal always from relational tables
    const lines = db
      .prepare(
        `SELECT jl.account_id as accountId, jl.side, jl.amount, jl.currency, jl.line_number, jl.amount_in_base as amountInBase, jl.exchange_rate_to_base as exchangeRateToBase, jl.conversion_path as conversionPath, jl.line_kind as lineKind
         FROM fin_journal_lines jl
         JOIN fin_journal_entries je ON je.id = jl.entry_id
         WHERE je.operation_id = ?
         ORDER BY jl.line_number`,
      )
      .all(operationId);
    // P0-OP-007: typed columns authoritative for canonical fields
    return {
      ...snap,
      operationId: row.id,
      commandHash: row.command_hash,
      status: row.status,
      durability_state: row.durability_state,
      journalLines: lines,
      domainResult: snap.domainResult ?? null,
      engineVersions: snap.engineVersions ?? (row.engine_versions ? JSON.parse(row.engine_versions) : null),
      businessDate: row.business_date,
      baseCurrency: row.base_currency,
      settlementDate: row.settlement_date ?? snap.settlementDate ?? null,
      eventAt: row.event_at ?? snap.eventAt ?? null,
      provenance: snap.provenance ?? null,
      sourceChannel: row.source_channel ?? snap.sourceChannel ?? null,
      sourceType: row.source_type ?? snap.sourceType ?? null,
      sourceReference: row.source_reference ?? snap.sourceReference ?? null,
      result_hash: row.result_hash ?? snap.result_hash ?? null,
      idempotentReplay: replay,
      // P1-06: optional verify when both present (canonical payload excludes result_hash)
    };
  }

  const lines = db
    .prepare(
      `SELECT jl.account_id as accountId, jl.side, jl.amount, jl.currency, jl.line_number, jl.amount_in_base as amountInBase, jl.exchange_rate_to_base as exchangeRateToBase, jl.conversion_path as conversionPath, jl.line_kind as lineKind
       FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       WHERE je.operation_id = ?
       ORDER BY jl.line_number`,
    )
    .all(operationId);

  return {
    operationId: row.id,
    commandHash: row.command_hash,
    type: row.operation_type,
    status: row.status,
    durability_state: row.durability_state,
    businessDate: row.business_date,
    baseCurrency: row.base_currency,
    journalLines: lines,
    domainResult: null,
    engineVersions: row.engine_versions ? JSON.parse(row.engine_versions) : null,
    idempotentReplay: replay,
  };
}

async function persistOperationJson(record, dir) {
  // BUG-FINAL-019: shared validity gate with SQLite path
  if (!record.businessDate) throw new Error("OP_BUSINESS_DATE_REQUIRED");
  if (!record.baseCurrency) throw new Error("OP_BASE_CURRENCY_REQUIRED");
  const id = record.operationId || randomUUID();
  const journalLines = record.journalLines || [];
  if (journalLines.length) assertJournalBalanced(journalLines);
  for (const line of journalLines) {
    if (!line.currency) throw new Error("JOURNAL_LINE_CURRENCY_REQUIRED");
    if ((record.status || "posted") === "posted" && (line.amountInBase == null || line.amountInBase === "")) {
      throw new Error("INV_JOURNAL_MISSING_AMOUNT_IN_BASE");
    }
  }
  const status = record.status || "posted";
  const body = {
    operationId: id,
    commandHash: record.commandHash,
    type: record.type,
    status,
    businessDate: record.businessDate,
    baseCurrency: record.baseCurrency,
    engineVersions: record.engineVersions || null,
    domainResult: record.domainResult ?? null,
    durability_state: "persisted",
    journalLines,
    payload: record.payload ?? null,
    normalizedRequest: record.normalizedRequest ?? null,
    source: record.source ?? null,
    sourceChannel: record.sourceChannel ?? null,
    sourceType: record.sourceType ?? null,
    sourceReference: record.sourceReference ?? null,
    settlementDate: record.settlementDate ?? null,
    eventAt: record.eventAt ?? null,
    provenance: record.provenance ?? null,
    rates: record.rates ?? null,
    _transportState: "file_swapped",
  };
  const tempPath = join(dir, `${id}.tmp.json`);
  const finalPath = join(dir, `${id}.json`);
  await writeFile(tempPath, JSON.stringify(body), "utf8");
  await rename(tempPath, finalPath);
  return body;
}

export async function loadOperation(operationId, options = {}) {
  const dir = options.dataDir || DEFAULT_DIR;
  const mode = options.mode || "sqlite";
  if (mode === "json") {
    const finalPath = join(dir, `${operationId}.json`);
    const raw = await readFile(finalPath, "utf8");
    return JSON.parse(raw);
  }
  const db = openDb(dir);
  return loadOperationSync(db, operationId, false);
}

export { DEFAULT_DIR };
