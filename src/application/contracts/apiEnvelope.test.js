import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ok, fail, normalizeResult } from "./apiEnvelope.js";
import { isOfficialRoute, isForbiddenTopLevel, OFFICIAL_ROUTES } from "./boundaryRules.js";

describe("apiEnvelope §25", () => {
  it("success shape has ok true and data", () => {
    const r = ok({ operationId: "x" }, ["accounts.list"]);
    assert.equal(r.ok, true);
    assert.equal(r.success, true);
    assert.equal(r.data.operationId, "x");
    assert.deepEqual(r.invalidated, ["accounts.list"]);
  });

  it("failure shape has ok false, code, message", () => {
    const r = fail("FX_REQUIRED", "need rate");
    assert.equal(r.ok, false);
    assert.equal(r.success, false);
    assert.equal(r.code, "FX_REQUIRED");
    assert.equal(r.message, "need rate");
  });

  it("normalizeResult maps success handlers", () => {
    const r = normalizeResult({ success: true, data: { a: 1 } });
    assert.equal(r.ok, true);
    assert.equal(r.data.a, 1);
  });

  it("normalizeResult maps failures", () => {
    const r = normalizeResult({ success: false, code: "X", message: "y" });
    assert.equal(r.ok, false);
    assert.equal(r.code, "X");
  });
});

describe("IA no-new-pages §27", () => {
  it("six official routes", () => {
    assert.equal(OFFICIAL_ROUTES.length, 6);
    assert.equal(isOfficialRoute("/money"), true);
  });

  it("forbids feature top-level routes", () => {
    assert.equal(isForbiddenTopLevel("/crypto"), true);
    assert.equal(isForbiddenTopLevel("/reports"), true);
    assert.equal(isForbiddenTopLevel("/import"), true);
  });
});
