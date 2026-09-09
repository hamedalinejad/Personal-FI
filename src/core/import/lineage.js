import { createHash } from "node:crypto";

export function hashRawRecord(payload) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  return createHash("sha256").update(raw).digest("hex");
}

export function preserveImportRecord({
  payload,
  sourceProvider,
  sourceReference,
  sourceDocumentId,
  providerTxId,
  batchId,
  unknownFields = {},
}) {
  return Object.freeze({
    rawRecordHash: hashRawRecord(payload),
    payload,
    unknownFields,
    sourceProvider: sourceProvider || null,
    sourceReference: sourceReference || null,
    sourceDocumentId: sourceDocumentId || null,
    providerTxId: providerTxId || null,
    batchId: batchId || null,
  });
}
