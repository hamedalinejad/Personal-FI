import { writeFile, rename, readFile } from "node:fs/promises";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { assertJournalBalanced } from "../domain/invariants/index.js";

const DEFAULT_DIR = join(process.cwd(), ".pf-data");
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * P0-001: Runtime DB applies canonical docs/core/db/schema.sql (not a second schema).
 * P0-003: status draft|posted|voided|failed
 * P0-004: command_hash NOT globally unique
 * P0-005: journal lines are SoT; journal_json optional derived only
 * P0-006: FK from canonical schema
 * P0-007: balance guard before write
 */

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

/** Strip SQL comments for exec; keep statements. */
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
  // Apply canonical schema once
  const meta = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='fin_operations'",
  ).get();
  if (!meta) {
    db.exec(prepareSchema(resolveSchemaSql()));
  }
  // P0-004: drop mistaken global unique on command_hash if present from older runtime
  try {
    db.exec("DROP INDEX IF EXISTS uq_fin_operations_command_hash");
    db.exec("DROP INDEX IF EXISTS uq_fin_op_command");
  } catch {
    /* ignore */
  }
  try {
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_fin_operations_command_hash ON fin_operations(command_hash)",
    );
  } catch {
    /* ignore */
  }
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

  if (mode === "json") {
    return persistOperationJson(record, dir);
  }
  return persistOperationSqlite(record, dir);
}

function persistOperationSqlite(record, dir) {
  const id = record.operationId || randomUUID();
  const journalLines = record.journalLines || [];

  // P0-007
  if (journalLines.length) {
    assertJournalBalanced(journalLines);
  }

  const status = record.status || "posted";
  if (!["draft", "posted", "voided", "failed"].includes(status)) {
    throw new Error(`OP_STATUS_INVALID:${status}`);
  }

  const db = openDb(dir);
  const now = new Date().toISOString();
  const businessDate = record.businessDate || now.slice(0, 10);

  try {
    db.exec("BEGIN IMMEDIATE");
    db.prepare(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, created_at, posted_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
    ).run(
      id,
      record.commandHash || null,
      record.type || "unknown",
      status,
      businessDate,
      record.baseCurrency || record.base_currency || "IRR",
      now,
      status === "posted" ? now : null,
    );

    const entryId = randomUUID();
    db.prepare(
      `INSERT INTO fin_journal_entries (id, operation_id, business_date, memo, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(entryId, id, businessDate, record.memo || null, now);

    // Ensure referenced accounts exist (bootstrap stub; production seeds chart)
    const ensureAcc = db.prepare(
      `INSERT OR IGNORE INTO fin_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at)
       VALUES (?, ?, 'asset', 'IRR', 0, ?, ?)`,
    );
    for (const line of journalLines) {
      const aid = line.accountId || line.account_id;
      ensureAcc.run(aid, aid, now, now);
    }

    const insLine = db.prepare(
      `INSERT INTO fin_journal_lines (
        id, entry_id, account_id, side, amount, currency, line_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    journalLines.forEach((line, i) => {
      insLine.run(
        randomUUID(),
        entryId,
        line.accountId || line.account_id,
        line.side,
        line.amount,
        line.currency || 'IRR',
        line.line_number || i + 1,
      );
    });

    db.prepare(
      `UPDATE fin_operations SET durability_state = 'sql_committed' WHERE id = ?`,
    ).run(id);
    db.exec("COMMIT");

    return {
      operationId: id,
      commandHash: record.commandHash,
      status,
      durability_state: "sql_committed",
      journalLines,
      domainResult: record.domainResult ?? null,
    };
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  }
}

async function persistOperationJson(record, dir) {
  const id = record.operationId || randomUUID();
  const journalLines = record.journalLines || [];
  if (journalLines.length) assertJournalBalanced(journalLines);
  const status = record.status || "posted";
  const tempPath = join(dir, `${id}.tmp.json`);
  const finalPath = join(dir, `${id}.json`);
  const body = {
    operationId: id,
    commandHash: record.commandHash,
    type: record.type,
    status,
    durability_state: "sql_committed",
    journalLines,
    domainResult: record.domainResult ?? null,
    _transportState: "swapped",
  };
  await writeFile(tempPath, JSON.stringify(body), "utf8");
  await rename(tempPath, finalPath);
  return body;
}

/** P0-005: load journal from relational tables when sqlite */
export async function loadOperation(operationId, options = {}) {
  const dir = options.dataDir || DEFAULT_DIR;
  const mode = options.mode || "sqlite";

  if (mode === "json") {
    const finalPath = join(dir, `${operationId}.json`);
    const raw = await readFile(finalPath, "utf8");
    return JSON.parse(raw);
  }

  const db = openDb(dir);
  const row = db.prepare(`SELECT * FROM fin_operations WHERE id = ?`).get(operationId);
  if (!row) throw new Error("OP_NOT_FOUND");

  const lines = db
    .prepare(
      `SELECT jl.account_id as accountId, jl.side, jl.amount, jl.currency, jl.line_number
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
    journalLines: lines,
    domainResult: null,
  };
}

export { DEFAULT_DIR };
