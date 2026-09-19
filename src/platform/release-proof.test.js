import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Phase18 RELEASE_PROVEN remains false until evidence complete", () => {
  const doc = JSON.parse(readFileSync("docs/core/registry/release-proof-checklist.json", "utf8"));
  assert.equal(doc.RELEASE_PROVEN, false);
  for (const [ed, flags] of Object.entries(doc.perEdition)) {
    for (const [k, v] of Object.entries(flags)) {
      assert.equal(v, false, `${ed}.${k} must not be prematurely true`);
    }
  }
  assert.ok(doc.promotionRule.includes("Platform E2E"));
});
