import test from "node:test";
import assert from "node:assert/strict";
import { assertIsoDate } from "./isoDate.js";

test("accepts ISO", () => {
  assert.equal(assertIsoDate("2026-01-01"), "2026-01-01");
});

test("rejects non-ISO and invalid", () => {
  assert.throws(() => assertIsoDate("1404/01/01"));
  assert.throws(() => assertIsoDate("2026-13-01"));
  assert.throws(() => assertIsoDate(20260101));
});
