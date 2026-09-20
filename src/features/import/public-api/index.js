/**
 * Canonical import public surface (R-M22).
 * Stages are explicit — UI may show one sheet, backend state machine is multi-step.
 *
 * import.createBatch
 * import.ingestRaw
 * import.inspectSchema
 * import.previewMapping
 * import.validateBatch
 * import.commitBatch
 * import.getBatch
 *
 * commitBatch is the only stage that may create fin_operations / journal.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";

const BATCH_STATUSES = Object.freeze([
  "open",
  "ingesting",
  "mapped",
  "validated",
  "committing",
  "completed",
  "failed",
  "cancelled",
]);

/**
 * @param {{ db: any, payload: object }} ctx
 */
export async function createBatch({ db, payload }) {
  assertDbPassed(db, "import.createBatch");
  const { sourceProvider, sourceSchemaVersion = null, label = null } = payload || {};
  if (!sourceProvider) {
    throw Object.assign(new Error("SOURCE_PROVIDER_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `batch-${Date.now()}`;
  const now = new Date().toISOString();

  // Ensure batches table exists (lightweight for bootstrap)
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

/**
 * Raw ingest only — does NOT post business operations (BUG-P1-10).
 * @param {{ db: any, payload: object }} ctx
 */
export async function ingestRaw({ db, payload }) {
  assertDbPassed(db, "import.ingestRaw");
  const { batchId, records } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (!Array.isArray(records) || records.length === 0) {
    throw Object.assign(new Error("RECORDS_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const batch = db.prepare("SELECT id, status FROM import_batches WHERE id = ?");
  batch.bind([batchId]);
  if (!batch.step()) {
    batch.free();
    throw Object.assign(new Error("BATCH_NOT_FOUND"), { code: "BATCH_NOT_FOUND" });
  }
  const b = batch.getAsObject();
  batch.free();
  if (b.status !== "open" && b.status !== "ingesting") {
    throw Object.assign(new Error(`BATCH_STATUS_INVALID:${b.status}`), { code: "BATCH_STATUS_INVALID" });
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
      db.run(
        `INSERT INTO import_raw_records (
          id, source_provider, source_schema_version, raw_record_hash,
          unknown_fields_json, payload_json, imported_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          rid,
          b.source_provider || "unknown",
          null,
          hash,
          null,
          payloadJson,
          now,
        ]
      );
      stored += 1;
    }
    db.run(
      `UPDATE import_batches SET record_count = record_count + ?, status = 'ingesting' WHERE id = ?`,
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
      note: "RAW only — not business-posted; call import.commitBatch after mapping",
    },
  };
}

/**
 * commitBatch — placeholder gate: rejects until mapping/validation implemented.
 * Prevents false-green "imported X" without operations.
 */
export async function commitBatch({ db, payload }) {
  assertDbPassed(db, "import.commitBatch");
  const { batchId } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });

  // Explicit incomplete lifecycle — do not pretend success
  const err = new Error(
    "IMPORT_COMMIT_NOT_READY: mapping/validate stages required before commit; raw ingest is not business import"
  );
  err.code = "IMPORT_COMMIT_NOT_READY";
  throw err;
}

export async function getBatch({ db, payload }) {
  assertDbPassed(db, "import.getBatch");
  const { batchId } = payload || {};
  if (!batchId) throw Object.assign(new Error("BATCH_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  const stmt = db.prepare("SELECT * FROM import_batches WHERE id = ?");
  stmt.bind([batchId]);
  if (!stmt.step()) {
    stmt.free();
    return { success: true, data: null };
  }
  const row = stmt.getAsObject();
  stmt.free();
  return { success: true, data: row };
}

function simpleHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

export const IMPORT_COMMANDS = Object.freeze([
  "import.createBatch",
  "import.ingestRaw",
  "import.inspectSchema",
  "import.previewMapping",
  "import.validateBatch",
  "import.commitBatch",
  "import.getBatch",
]);

export { BATCH_STATUSES };
