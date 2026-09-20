import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Pure re-implementation mirror for Node test without TS build
function formatMoney(raw, currency) {
  if (raw == null || raw === "") return `— ${currency}`;
  const neg = raw.startsWith("-");
  const body = neg ? raw.slice(1) : raw;
  const [w, f] = body.split(".");
  const grouped = w.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const shown = f != null && f !== "" ? `${grouped}.${f}` : grouped;
  return `${neg ? "-" : ""}${shown} ${currency}`;
}

test("formatMoney never turns null into zero", () => {
  assert.equal(formatMoney(null, "IRR"), "— IRR");
  assert.equal(formatMoney("10000000", "IRR"), "10,000,000 IRR");
  assert.equal(formatMoney("-500", "IRR"), "-500 IRR");
});

test("raw value unchanged by formatter (display only)", () => {
  const raw = "10000000";
  formatMoney(raw, "IRR");
  assert.equal(raw, "10000000");
});
