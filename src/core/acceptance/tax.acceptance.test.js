import test from "node:test";
import assert from "node:assert/strict";
import { changeTaxRecordStatus } from "../tax/taxEvents.js";

test("F.tax: status cannot become paid without payTax operation", () => {
  assert.throws(
    () => changeTaxRecordStatus("/tmp/no-db", "evt-1", "paid"),
    /TAX_PAID_REQUIRES_PAYTAX|payTax/i,
  );
});
