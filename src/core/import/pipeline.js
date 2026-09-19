/**
 * Phase 8 — Import lineage: raw → hash → unknownFields → map → operation
 */
import { createHash, randomUUID } from "node:crypto";
import { openDb } from "../persistence/port.js";

export function hashRawPayload(payload) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  return createHash("sha256").update(raw).digest("hex");
}

export function ensureImportBatch(dataDir, {
  batchId = null,
  sourceProvider = "manual",
  sourceType = "json",
  sourceReference = null,
} = {}) {
  const db = openDb(dataDir);
  const id = batchId || randomUUID();
  const now = new Date().toISOString();
  const existing = db.prepare(`SELECT id FROM import_batches WHERE id = ?`).get(id);
  if (!existing) {
    db.prepare(
      `INSERT INTO import_batches (id, source_provider, source_type, source_reference, status, created_at)
       VALUES (?, ?, ?, ?, 'open', ?)`,
    ).run(id, sourceProvider, sourceType, sourceReference, now);
  }
  return id;
}

export function ingestRawRecord(dataDir, {
  batchId,
  sourceProvider = "manual",
  sourceType = "json",
  sourceReference = null,
  providerTxId = null,
  payload,
  mapping = null,
  operationId = null,
} = {}) {
  if (payload == null) throw new Error("IMPORT_PAYLOAD_REQUIRED");
  const bid = ensureImportBatch(dataDir, {
    batchId: batchId || randomUUID(),
    sourceProvider,
    sourceType,
    sourceReference,
  });

  const payloadJson = typeof payload === "string" ? payload : JSON.stringify(payload);
  const rawHash = hashRawPayload(payloadJson);
  const knownKeys = new Set([
    "amount", "currency", "businessDate", "date", "description", "memo", "type", "quantity", "price",
  ]);
  const obj = typeof payload === "object" && payload ? payload : {};
  const unknownFields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!knownKeys.has(k)) unknownFields[k] = v;
  }

  const db = openDb(dataDir);
  const id = `imp_${rawHash.slice(0, 24)}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT OR IGNORE INTO import_raw_records (
      id, batch_id, source_provider, source_type, source_reference,
      raw_record_hash, unknown_fields_json, payload_json,
      mapping_decision_json, normalization_status, reconciliation_status, imported_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'raw', 'unreconciled', ?, ?)`,
  ).run(
    id,
    bid,
    sourceProvider,
    sourceType,
    sourceReference,
    rawHash,
    JSON.stringify(unknownFields),
    payloadJson,
    mapping ? JSON.stringify(mapping) : null,
    now,
    now,
  );

  if (providerTxId) {
    try {
      db.prepare(
        `INSERT OR IGNORE INTO import_dedupe_keys (
          id, source_provider, provider_tx_id, operation_id
        ) VALUES (?, ?, ?, ?)`,
      ).run(`dd_${rawHash.slice(0, 20)}`, sourceProvider, providerTxId, operationId);
    } catch {
      /* optional */
    }
  }

  if (operationId) {
    linkImportToOperation(dataDir, id, operationId);
  }

  return { recordId: id, batchId: bid, rawHash, unknownFields, operationId, preserved: true };
}

export function linkImportToOperation(dataDir, recordId, operationId) {
  const db = openDb(dataDir);
  // store linkage on dedupe or mapping json if no column
  try {
    db.prepare(
      `UPDATE import_raw_records SET mapping_decision_json = json_set(
         COALESCE(mapping_decision_json, '{}'), '$.operationId', ?
       ), normalization_status = 'mapped' WHERE id = ?`,
    ).run(operationId, recordId);
  } catch {
    db.prepare(
      `UPDATE import_raw_records SET mapping_decision_json = ?, normalization_status = 'mapped' WHERE id = ?`,
    ).run(JSON.stringify({ operationId }), recordId);
  }
  return { recordId, operationId };
}

export function loadImportRecord(dataDir, recordId) {
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM import_raw_records WHERE id = ?`).get(recordId);
  if (!row) return null;
  return {
    ...row,
    payload: JSON.parse(row.payload_json),
    unknownFields: row.unknown_fields_json ? JSON.parse(row.unknown_fields_json) : {},
  };
}
