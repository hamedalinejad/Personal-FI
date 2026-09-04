import { canonicalDecimalString } from "../money/canonicalDecimal.js";

/**
 * BUG-CODE-006 / 007 — type-aware fixture compare; reject JSON number primitives for money
 */

const MONEY_KEYS = new Set([
  "amount",
  "quantity",
  "price",
  "fee",
  "rate",
  "totalInvested",
  "cost",
  "pnl",
  "balance",
  "nav",
]);

const ID_KEYS = new Set([
  "id",
  "operationId",
  "instrumentId",
  "holdingId",
  "accountId",
  "commandHash",
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
    assert.equal(actual, expected);
    return;
  }
  if (typeof expected === "object" && !Array.isArray(expected)) {
    for (const key of Object.keys(expected)) {
      const p = `${path}.${key}`;
      const e = expected[key];
      const a = actual?.[key];
      if (ID_KEYS.has(key) || key.endsWith("Id")) {
        if (String(a) !== String(e)) {
          throw new Error(`ID_MISMATCH ${p}: ${a} !== ${e}`);
        }
        continue;
      }
      if (
        MONEY_KEYS.has(key) ||
        typeof e === "string" && /^-?\d+(\.\d+)?$/.test(e) && key.toLowerCase().includes("amount")
      ) {
        const ca = canonicalDecimalString(String(a));
        const ce = canonicalDecimalString(String(e));
        if (Number(ca) !== Number(ce) && ca !== ce) {
          // allow equivalent numeric string forms after canonicalize path
          if (Number(ca) !== Number(ce)) {
            throw new Error(`MONEY_MISMATCH ${p}: ${a} !== ${e}`);
          }
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
  // exact for non-money scalars
  if (actual !== expected) {
    throw new Error(`VALUE_MISMATCH ${path}: ${actual} !== ${expected}`);
  }
}

// local assert.equal without importing node assert in non-test
const assert = {
  equal(a, b) {
    if (a !== b) throw new Error(`ASSERT ${a} !== ${b}`);
  },
};
