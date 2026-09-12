import test from "node:test";
import assert from "node:assert/strict";
import { changeTaxRecordStatus } from "./taxEvents.js";

test("P0-TAX-001 changeStatus paid forbidden", () => {
  assert.throws(
    () => changeTaxRecordStatus("/tmp/no-db", "x", "paid"),
    /TAX_PAID_REQUIRES_PAYTAX/,
  );
});
