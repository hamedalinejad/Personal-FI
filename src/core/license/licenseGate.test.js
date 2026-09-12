import test from "node:test";
import assert from "node:assert/strict";
import { applyLicenseCapabilities, assertNoHistoryDeletion } from "./licenseGate.js";

test("P1-MOD-003 downgrade hides UI but retains history ids", () => {
  const history = [{ id: "op1" }, { id: "op2" }];
  const full = applyLicenseCapabilities({ enabledFeatures: ["full"] }, { previouslyWritten: history });
  assert.equal(full.ui.showCrypto, true);
  const down = applyLicenseCapabilities(
    { enabledFeatures: ["loan"] },
    { previouslyWritten: history },
  );
  assert.equal(down.ui.showCrypto, false);
  assert.equal(down.ui.showLoan, true);
  assert.equal(down.exportAllowed, true);
  assert.equal(down.retainedRecordCount, 2);
  assertNoHistoryDeletion(
    history.map((h) => h.id),
    down.retainedIds,
  );
});
