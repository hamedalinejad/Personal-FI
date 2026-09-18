import test from "node:test";
import assert from "node:assert/strict";
import {
  EDITIONS,
  listEditionCapabilities,
  apisForEdition,
  getEdition,
} from "./publicRegistry.js";

test("editions: feature-only never requires Accounts UI", () => {
  for (const id of ["loan-only", "crypto-only", "funds-only", "stocks-only", "metals-only"]) {
    assert.equal(getEdition(id).requiresAccountsUi, false);
  }
  assert.equal(getEdition("full").requiresAccountsUi, true);
});

test("apisForEdition loan-only exposes only loan package", () => {
  const apis = apisForEdition("loan-only");
  assert.deepEqual(Object.keys(apis).sort(), ["loan"]);
  assert.equal(apis.loan.capabilities().edition, "loan-only");
});

test("apisForEdition full exposes all investment+loan packages", () => {
  const apis = apisForEdition("full");
  assert.ok(apis.loan && apis.crypto && apis.funds && apis.stocks && apis.metals);
});

test("listEditionCapabilities all require sharedCore / no Accounts for standalone", () => {
  const caps = listEditionCapabilities();
  for (const [k, c] of Object.entries(caps)) {
    assert.equal(c.sharedCore, true, k);
    assert.equal(c.requiresAccountsUi, false, k);
  }
});
