import test from "node:test";
import assert from "node:assert/strict";
import { ok, fail } from "./responseEnvelope.js";

test("API-001 envelope shape", () => {
  const r = ok({ x: 1 }, { operationId: "op1", engineVersions: { money: "1" } });
  assert.equal(r.success, true);
  assert.equal(r.meta.operation_id, "op1");
  assert.equal(r.meta.api_version, "1");
  assert.deepEqual(r.engine_versions, { money: "1" });
});

test("API-002 errors[].code", () => {
  const r = fail({ errorCode: "X", message: "m", featureCode: "F" });
  assert.equal(r.success, false);
  assert.equal(r.errors[0].code, "X");
  assert.equal(r.errors[0].details.featureCode, "F");
});
