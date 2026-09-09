import test from "node:test";
import assert from "node:assert/strict";
import { preserveImportRecord } from "./lineage.js";

test("preserves unknown fields and hash", () => {
  const r = preserveImportRecord({
    payload: { a: 1 },
    sourceProvider: "csv",
    unknownFields: { weird: true },
  });
  assert.ok(r.rawRecordHash);
  assert.equal(r.unknownFields.weird, true);
  assert.equal(r.sourceProvider, "csv");
});
