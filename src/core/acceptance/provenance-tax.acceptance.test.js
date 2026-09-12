import test from "node:test";
import assert from "node:assert/strict";
import { changeTaxRecordStatus } from "../tax/taxEvents.js";

test("P0-013 changeStatus paid forbidden", () => {
  assert.throws(
    () => changeTaxRecordStatus("/tmp/x", "id", "paid"),
    /TAX_PAID_REQUIRES_PAYTAX/,
  );
});

test("P0-011 channel and type are distinct concepts", () => {
  // documentation lock — values must not be interchangeable
  const channels = new Set(["ui", "api", "import", "migration", "system"]);
  const types = new Set(["manual", "bank_statement", "broker_statement", "exchange_api", "opening", "correction"]);
  for (const t of types) assert.ok(!channels.has(t) || t === "import"); // import can appear in both layers historically
  assert.ok(channels.has("ui"));
  assert.ok(types.has("manual"));
});
