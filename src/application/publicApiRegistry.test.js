import test from "node:test";
import assert from "node:assert/strict";
import {
  APPLICATION_MODULE_KEYS,
  applicationApi,
  toCommandId,
  gatedCommand,
} from "./publicApiRegistry.js";

test("application surface covers all product modules", () => {
  for (const k of [
    "accounts",
    "income",
    "expense",
    "cheque",
    "tax",
    "assets",
    "budget",
    "goals",
    "bills",
    "loan",
    "crypto",
    "stocks",
    "funds",
    "metals",
  ]) {
    assert.ok(APPLICATION_MODULE_KEYS.includes(k), k);
    assert.ok(applicationApi[k], k);
  }
  assert.ok(applicationApi.reports.reportPack);
  assert.ok(applicationApi.license.listEditions);
});

test("toCommandId maps goals/bills catalog ids", () => {
  assert.equal(toCommandId("goals", "create"), "goal.create");
  assert.equal(toCommandId("bills", "schedule"), "bill.schedule");
  assert.equal(toCommandId("loan", "create"), "loan.create");
});

test("gatedCommand loan-only blocks crypto", async () => {
  await assert.rejects(
    () => gatedCommand("loan-only", "crypto", "buy", {}),
    /LICENSE_REQUIRED/,
  );
});
