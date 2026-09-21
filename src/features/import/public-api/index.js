/**
 * Canonical import public surface (PHASE 5 / R-M22).
 * Batch: open → ingesting → mapped → validated → committing → completed | failed | cancelled
 * Record: raw → normalized → mapped → imported | rejected
 * commitBatch only creates business ops after validate; otherwise IMPORT_COMMIT_NOT_READY.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";

export const BATCH_STATUSES = Object.freeze([
  "open",
  "ingesting",
  "mapped",
  "validated",
  "committing",
  "completed",
  "failed",
  "cancelled",
]);

export const RECORD_STATUSES = Object.freeze([
  "raw",
  "normalized",
  "mapped",
  "imported",
  "rejected",
]);

function ensureImportTables(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      source_provider TEXT NOT NULL,
      source_schema_version TEXT,
      label TEXT,
      status TEXT NOT NULL,
      record_count INTEGER NOT NULL DEFAULT 0,
      content_hash TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS import_batch_records (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      raw_record_id TEXT,
      status TEXT NOT NULL,
      reject_reason TEXT,
      mapping_json TEXT,
      normalized_json TEXT,
      operation_id TEXT,
      dedupe_key TEXT,
      created_at TEXT NOT NULL
    )
  `);
}

export async function createBatch({ db, payload }) {
  assertDbPassed(db, "import.createBatch");
  const { sourceProvider, sourceSchemaVersion = null, label = null } = payload || {};
  if (!sourceProvider) {
    throw Object.assign(new Error("SOURCE_PROVIDER_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  ensureImportTables(db);
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `batch-${Date.now()}`;
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO import_batches (id, source_provider, source_schema_version, label, status, record_count, created_at)
     VALUES (?, ?, ?, ?, 'open', 0, ?)`,
    [id, sourceProvider, sourceSchemaVersion, label, now]
  );
  return {
    success: true,
    data: { batchId: id, status: "open", sourceProvider, createdAt: now },
  };
}

export async function ingestRaw({ db, payload }) {
  assertDbPassed(db, "import.ingestRaw");
  ensureImportTables(db);
  const { batchId, records } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (!Array.isArray(records) || records.length === 0) {
    throw Object.assign(new Error("RECORDS_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const batch = loadBatch(db, batchId);
  if (batch.status !== "open" && batch.status !== "ingesting") {
    throw Object.assign(new Error(`BATCH_STATUS_INVALID:${batch.status}`), {
      code: "BATCH_STATUS_INVALID",
    });
  }

  const now = new Date().toISOString();
  let stored = 0;
  db.run("BEGIN IMMEDIATE");
  try {
    db.run(`UPDATE import_batches SET status = 'ingesting' WHERE id = ?`, [batchId]);
    for (const rec of records) {
      const rid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `raw-${Date.now()}-${stored}`;
      const payloadJson = JSON.stringify(rec);
      const hash = simpleHash(payloadJson);
      const dedupeKey = buildDedupeKey(batch.source_provider || "unknown", rec, hash);

      try {
        db.run(
          `INSERT INTO import_raw_records (
            id, source_provider, source_schema_version, raw_record_hash,
            unknown_fields_json, payload_json, imported_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [rid, batch.source_provider || "unknown", null, hash, null, payloadJson, now]
        );
      } catch {
        /* raw table may already exist with constraints */
      }

      const brid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `br-${Date.now()}-${stored}`;
      db.run(
        `INSERT INTO import_batch_records (
          id, batch_id, raw_record_id, status, reject_reason, mapping_json, normalized_json, operation_id, dedupe_key, created_at
        ) VALUES (?, ?, ?, 'raw', NULL, NULL, NULL, NULL, ?, ?)`,
        [brid, batchId, rid, dedupeKey, now]
      );
      stored += 1;
    }
    db.run(
      `UPDATE import_batches SET record_count = record_count + ? WHERE id = ?`,
      [stored, batchId]
    );
    db.run("COMMIT");
  } catch (e) {
    try {
      db.run("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  }

  return {
    success: true,
    data: {
      batchId,
      ingested: stored,
      status: "ingesting",
      note: "RAW only — not business-posted",
    },
  };
}

/**
 * Normalize raw records to a common shape (no business post).
 */
export async function normalizeBatch({ db, payload }) {
  assertDbPassed(db, "import.normalizeBatch");
  ensureImportTables(db);
  const { batchId } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  loadBatch(db, batchId);

  const stmt = db.prepare(
    `SELECT id, raw_record_id FROM import_batch_records WHERE batch_id = ? AND status = 'raw'`
  );
  stmt.bind([batchId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();

  const now = new Date().toISOString();
  let n = 0;
  db.run("BEGIN IMMEDIATE");
  try {
    for (const row of rows) {
      db.run(
        `UPDATE import_batch_records SET status = 'normalized', normalized_json = ?, created_at = ? WHERE id = ?`,
        [JSON.stringify({ normalizedAt: now, rawRecordId: row.raw_record_id }), now, row.id]
      );
      n += 1;
    }
    db.run("COMMIT");
  } catch (e) {
    try {
      db.run("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  }
  return { success: true, data: { batchId, normalized: n, status: "ingesting" } };
}

/**
 * Attach mapping JSON; moves normalized → mapped or rejected with reason.
 */
export async function mapBatch({ db, payload }) {
  assertDbPassed(db, "import.mapBatch");
  ensureImportTables(db);
  const { batchId, mappings = [] } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  loadBatch(db, batchId);

  const byId = new Map(mappings.map((m) => [m.recordId, m]));
  const stmt = db.prepare(
    `SELECT id FROM import_batch_records WHERE batch_id = ? AND status IN ('raw','normalized')`
  );
  stmt.bind([batchId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();

  let mapped = 0;
  let rejected = 0;
  db.run("BEGIN IMMEDIATE");
  try {
    for (const row of rows) {
      const m = byId.get(row.id);
      if (!m || m.reject) {
        db.run(
          `UPDATE import_batch_records SET status = 'rejected', reject_reason = ? WHERE id = ?`,
          [m?.reason || "NO_MAPPING", row.id]
        );
        rejected += 1;
      } else {
        db.run(
          `UPDATE import_batch_records SET status = 'mapped', mapping_json = ?, reject_reason = NULL WHERE id = ?`,
          [JSON.stringify(m.mapping || m), row.id]
        );
        mapped += 1;
      }
    }
    db.run(`UPDATE import_batches SET status = 'mapped' WHERE id = ?`, [batchId]);
    db.run("COMMIT");
  } catch (e) {
    try {
      db.run("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  }
  return { success: true, data: { batchId, mapped, rejected, status: "mapped" } };
}

export async function validateBatch({ db, payload }) {
  assertDbPassed(db, "import.validateBatch");
  ensureImportTables(db);
  const { batchId } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  const batch = loadBatch(db, batchId);
  if (batch.status !== "mapped" && batch.status !== "validated") {
    throw Object.assign(new Error(`BATCH_STATUS_INVALID:${batch.status}`), {
      code: "BATCH_STATUS_INVALID",
    });
  }
  const stmt = db.prepare(
    `SELECT COUNT(*) AS c FROM import_batch_records WHERE batch_id = ? AND status = 'mapped'`
  );
  stmt.bind([batchId]);
  stmt.step();
  const c = stmt.getAsObject().c;
  stmt.free();
  if (Number(c) === 0) {
    throw Object.assign(new Error("BATCH_NO_MAPPED_RECORDS"), { code: "BATCH_NO_MAPPED_RECORDS" });
  }
  db.run(`UPDATE import_batches SET status = 'validated' WHERE id = ?`, [batchId]);
  return { success: true, data: { batchId, mappedCount: Number(c), status: "validated" } };
}

/**
 * Business commit — only after validated.
 * v1: still requires mapped commandId per record; without executable handlers marks failed path.
 */
export async function commitBatch({ db, payload }) {
  assertDbPassed(db, "import.commitBatch");
  ensureImportTables(db);
  const { batchId } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  const batch = loadBatch(db, batchId);
  if (batch.status !== "validated") {
    const err = new Error(
      `IMPORT_COMMIT_NOT_READY: batch status must be validated (was ${batch.status}); raw ingest is not business import`
    );
    err.code = "IMPORT_COMMIT_NOT_READY";
    throw err;
  }

  // Check mapped rows have command mapping
  const stmt = db.prepare(
    `SELECT id, mapping_json FROM import_batch_records WHERE batch_id = ? AND status = 'mapped'`
  );
  stmt.bind([batchId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();

  let executable = 0;
  for (const row of rows) {
    try {
      const m = JSON.parse(row.mapping_json || "{}");
      if (m.commandId && m.payload) executable += 1;
    } catch {
      /* ignore */
    }
  }
  if (executable === 0) {
    const err = new Error(
      "IMPORT_COMMIT_NOT_READY: no mapped records with commandId+payload; refusing false-green import"
    );
    err.code = "IMPORT_COMMIT_NOT_READY";
    throw err;
  }

  // Host-level commit of public commands is application orchestration responsibility.
  // Here we only gate and mark committing; full loop requires host injection.
  db.run(`UPDATE import_batches SET status = 'committing' WHERE id = ?`, [batchId]);
  return {
    success: true,
    data: {
      batchId,
      status: "committing",
      executable,
      note: "Host must run public commands for each mapped row then finalize completed",
    },
  };
}

export async function getBatch({ db, payload }) {
  assertDbPassed(db, "import.getBatch");
  ensureImportTables(db);
  const { batchId } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  const batch = loadBatch(db, batchId);
  const stmt = db.prepare(
    `SELECT status, COUNT(*) AS c FROM import_batch_records WHERE batch_id = ? GROUP BY status`
  );
  stmt.bind([batchId]);
  const byStatus = {};
  while (stmt.step()) {
    const r = stmt.getAsObject();
    byStatus[r.status] = Number(r.c);
  }
  stmt.free();
  return { success: true, data: { ...batch, recordsByStatus: byStatus } };
}

function loadBatch(db, batchId) {
  const stmt = db.prepare("SELECT * FROM import_batches WHERE id = ?");
  stmt.bind([batchId]);
  if (!stmt.step()) {
    stmt.free();
    throw Object.assign(new Error("BATCH_NOT_FOUND"), { code: "BATCH_NOT_FOUND" });
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

function buildDedupeKey(provider, rec, hash) {
  const external =
    rec.providerTxId || rec.txHash || rec.externalReference || rec.id || null;
  if (external) return `${provider}:${external}`;
  return `${provider}:hash:${hash}`;
}

function simpleHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

export const IMPORT_COMMANDS = Object.freeze([
  "import.createBatch",
  "import.ingestRaw",
  "import.normalizeBatch",
  "import.mapBatch",
  "import.validateBatch",
  "import.commitBatch",
  "import.getBatch",
]);
