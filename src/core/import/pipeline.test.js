import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeAllDbs, openDb } from "../persistence/worker.js";
import { ingestRawRecord, loadImportRecord, hashRawPayload } from "./pipeline.js";

test("Phase8 import preserves unknown fields and raw hash", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-imp-"));
  openDb(dataDir); // bootstrap schema
  const payload = {
    amount: "100",
    currency: "IRR",
    businessDate: "2026-01-01",
    brokerMemo: "X-CUSTOM",
    channelTag: "mobile",
  };
  const r = ingestRawRecord(dataDir, {
    sourceProvider: "testbank",
    sourceType: "json",
    payload,
    providerTxId: "TX-1",
  });
  assert.equal(r.preserved, true);
  assert.equal(r.unknownFields.brokerMemo, "X-CUSTOM");
  assert.equal(r.unknownFields.channelTag, "mobile");
  assert.equal(r.rawHash, hashRawPayload(JSON.stringify(payload)));

  const loaded = loadImportRecord(dataDir, r.recordId);
  assert.ok(loaded);
  assert.equal(loaded.unknownFields.brokerMemo, "X-CUSTOM");
  assert.equal(loaded.payload.amount, "100");
  closeAllDbs();
});
