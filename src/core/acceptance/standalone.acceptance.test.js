import test from "node:test";
import assert from "node:assert/strict";
import { capabilities as loanCaps } from "../../features/loan/public-api/index.js";
import { capabilities as cryptoCaps } from "../../features/crypto/public-api/index.js";
import { capabilities as fundsCaps } from "../../features/funds/public-api/index.js";
import { capabilities as stocksCaps } from "../../features/stocks/public-api/index.js";
import { capabilities as metalsCaps } from "../../features/metals/public-api/index.js";
import { applyLicenseCapabilities, assertNoHistoryDeletion } from "../license/licenseGate.js";

test("H.standalone: each feature exposes capabilities without Accounts UI", () => {
  for (const c of [loanCaps(), cryptoCaps(), fundsCaps(), stocksCaps(), metalsCaps()]) {
    assert.ok(c);
    assert.ok(c.edition || c.implements || c.status);
  }
});

test("H.standalone: capability downgrade preserves history", () => {
  const hist = [{ id: "1" }, { id: "2" }];
  const down = applyLicenseCapabilities({ enabledFeatures: ["loan"] }, { previouslyWritten: hist });
  assert.equal(down.exportAllowed, true);
  assertNoHistoryDeletion(
    hist.map((h) => h.id),
    down.retainedIds,
  );
});
