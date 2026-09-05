import { canonicalDecimalString, toDecimal } from "../money/canonicalDecimal.js";

const MONEY_KEYS = new Set([
  "amount", "quantity", "price", "fee", "rate", "totalInvested", "cost", "pnl", "balance", "nav",
]);
const ID_KEYS = new Set([
  "id", "operationId", "instrumentId", "holdingId", "accountId", "commandHash",
]);

export function assertNoJsonNumbers(value, path = "$") {
  if (typeof value === "number") {
    throw new Error(`FIXTURE_JSON_NUMBER_FORBIDDEN at ${path}`);
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoJsonNumbers(v, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      assertNoJsonNumbers(v, `${path}.${k}`);
    }
  }
}

export function assertExpected(actual, expected, path = "$") {
  if (expected === null || expected === undefined) {
    if (actual !== expected) throw new Error(`ASSERT ${path}`);
    return;
  }
  if (typeof expected === "object" && !Array.isArray(expected)) {
    for (const key of Object.keys(expected)) {
      const p = `${path}.${key}`;
      const e = expected[key];
      const a = actual?.[key];
      if (ID_KEYS.has(key) || key.endsWith("Id")) {
        if (String(a) !== String(e)) throw new Error(`ID_MISMATCH ${p}: ${a} !== ${e}`);
        continue;
      }
      if (MONEY_KEYS.has(key) || (typeof e === "string" && key.toLowerCase().includes("amount"))) {
        if (!toDecimal(String(a)).eq(toDecimal(String(e)))) {
          throw new Error(`MONEY_MISMATCH ${p}: ${a} !== ${e}`);
        }
        continue;
      }
      assertExpected(a, e, p);
    }
    return;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      throw new Error(`ARRAY_MISMATCH ${path}`);
    }
    expected.forEach((e, i) => assertExpected(actual[i], e, `${path}[${i}]`));
    return;
  }
  if (actual !== expected) throw new Error(`VALUE_MISMATCH ${path}: ${actual} !== ${expected}`);
}
