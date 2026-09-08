import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_DIR = join(process.cwd(), ".pf-data");

/**
 * P0-CODE-006/007 — persistence boundary
 *
 * Public/canonical fields on returned record:
 *   status: draft | posted | reversed
 *   durability_state: sql_committed | persist_failed | pending
 *
 * Internal transport recovery (JSON path only, never business truth):
 *   _transportState: pending | temp_written | committed | swapped
 *
 * Default: SQLite one-file DB under dataDir/personal-fi.sqlite
 * options.mode = "json" keeps crash-safe JSON prototype for tests.
 */

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS fin_operations (
  id TEXT PRIMARY KEY,
  command_hash TEXT,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','posted','reversed')),
  durability_state TEXT CHECK (durability_state IS NULL OR durability_state IN ('pending','sql_committed','persisted','persist_failed')),
  business_date TEXT,
  journal_json TEXT,
  domain_json TEXT,
  created_at TEXT NOT NULL,
  posted_at TEXT
);
CREATE TABLE IF NOT EXISTS fin_journal_entries (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id),
  business_date TEXT,
  memo TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fin_journal_lines (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES fin_journal_entries(id),
  account_id TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('debit','credit')),
  amount TEXT NOT NULL,
  currency TEXT,
  line_number INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_op_command ON fin_operations(command_hash) WHERE command_hash IS NOT NULL;
`;

function openDb(dataDir) {
  mkdirSyncSafe(dataDir);
  const dbPath = join(dataDir, "personal-fi.sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA_SQL);
  return db;
}

function mkdirSyncSafe(dir) {
  import("node:fs").then(({ mkdirSync }) => mkdirSync(dir, { recursive: true })).catch(() => {});
  try {
    const { mkdirSync } = require("node:fs");
    mkdirSync(dir, { recursive: true });
  } catch {
    // ESM — use sync via fs
  }
}

import { mkdirSync, existsSync } from "node:fs";

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Persist financial operation atomically into SQLite (canonical path).
 */
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
  const db = openDb(dir);
  const now = new Date().toISOString();
  const status = record.status || "posted";
  const businessDate = record.businessDate || now.slice(0, 10);
  const journalLines = record.journalLines || [];

  const tx = db.prepare("BEGIN IMMEDIATE");
  try {
    tx.run();
    db.prepare(
      `INSERT INTO fin_operations (id, command_hash, operation_type, status, durability_state, business_date, journal_json, domain_json, created_at, posted_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
    ).run(
      id,
      record.commandHash || null,
      record.type || "unknown",
      status,
      businessDate,
      JSON.stringify(journalLines),
      JSON.stringify(record.domainResult ?? null),
      now,
      status === "posted" ? now : null,
    );

    const entryId = randomUUID();
    db.prepare(
      `INSERT INTO fin_journal_entries (id, operation_id, business_date, memo, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(entryId, id, businessDate, record.memo || null, now);

    const insLine = db.prepare(
      `INSERT INTO fin_journal_lines (id, entry_id, account_id, side, amount, currency, line_number) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    journalLines.forEach((line, i) => {
      insLine.run(
        randomUUID(),
        entryId,
        line.accountId || line.account_id,
        line.side,
        line.amount,
        line.currency || null,
        line.line_number || i + 1,
      );
    });

    db.prepare(
      `UPDATE fin_operations SET durability_state = 'sql_committed' WHERE id = ?`,
    ).run(id);
    db.prepare("COMMIT").run();

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
      db.prepare("ROLLBACK").run();
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    db.close();
  }
}

/** JSON prototype — transport states internal only (P0-CODE-007). */
async function persistOperationJson(record, dir) {
  const id = record.operationId || randomUUID();
  const tempPath = join(dir, `${id}.tmp.json`);
  const finalPath = join(dir, `${id}.json`);

  let _transportState = "pending";
  const publicStatus = record.status || "posted";
  const body = {
    ...record,
    operationId: id,
    status: publicStatus,
    durability_state: "pending",
    _transportState,
  };
  await writeFile(tempPath, JSON.stringify(body), "utf8");
  _transportState = "temp_written";

  const committed = {
    ...body,
    durability_state: "sql_committed",
    _transportState: "committed",
  };
  await writeFile(tempPath, JSON.stringify(committed), "utf8");

  await rename(tempPath, finalPath);
  const finalBody = {
    ...committed,
    durability_state: "sql_committed",
    _transportState: "swapped",
  };
  await writeFile(finalPath, JSON.stringify(finalBody), "utf8");
  return finalBody;
}

export async function loadOperation(operationId, options = {}) {
  const dir = options.dataDir || DEFAULT_DIR;
  const mode = options.mode || "sqlite";

  if (mode === "json") {
    const finalPath = join(dir, `${operationId}.json`);
    const raw = await readFile(finalPath, "utf8");
    return JSON.parse(raw);
  }

  ensureDir(dir);
  const db = openDb(dir);
  try {
    const row = db
      .prepare(`SELECT * FROM fin_operations WHERE id = ?`)
      .get(operationId);
    if (!row) throw new Error("OP_NOT_FOUND");
    return {
      operationId: row.id,
      commandHash: row.command_hash,
      type: row.operation_type,
      status: row.status,
      durability_state: row.durability_state,
      journalLines: row.journal_json ? JSON.parse(row.journal_json) : [],
      domainResult: row.domain_json ? JSON.parse(row.domain_json) : null,
    };
  } finally {
    db.close();
  }
}

export { DEFAULT_DIR };
