import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCommand,
  computeCommandHash,
  buildEconomicIdentity,
  runAtomicFinancialOperation,
} from "./operationEngine.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { closeAllDbs } from "../../persistence/port.js";

test("P0-01 computeCommandHash equals stable identity of normalizeCommand", () => {
  const cmd = {
    operationId: randomUUID(),
    type: "test.op",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    payload: { x: "1" },
    status: "draft",
    journalLines: [
      { accountId: "a1", side: "debit", amount: "10", currency: "IRR", amountInBase: "10", exchangeRateToBase: "1" },
      { accountId: "a2", side: "credit", amount: "10", currency: "IRR", amountInBase: "10", exchangeRateToBase: "1" },
    ],
    settlementDate: "2026-01-02",
    eventAt: "2026-01-01T00:00:00Z",
    provenance: { source: "test" },
  };
  const norm = normalizeCommand(cmd);
  const h1 = computeCommandHash(norm);
  const h2 = computeCommandHash({ ...norm, dataDir: "/tmp/should-not-matter" });
  assert.equal(h1, h2);
  assert.ok(h1.length >= 16);
  const id = buildEconomicIdentity(norm);
  assert.equal(id.settlementDate, "2026-01-02");
});


test("BUG-004 same-currency representation yields same hash", () => {
  const base = {
    operationId: "op-1",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "posted",
    type: "test.op",
  };
  const a = normalizeCommand({
    ...base,
    journalLines: [
      { accountId: "a1", side: "debit", amount: "100", currency: "IRR" },
      { accountId: "a2", side: "credit", amount: "100", currency: "IRR" },
    ],
  });
  const b = normalizeCommand({
    ...base,
    journalLines: [
      { accountId: "a1", side: "debit", amount: "100", currency: "IRR", amountInBase: "100", exchangeRateToBase: "1" },
      { accountId: "a2", side: "credit", amount: "100", currency: "IRR", amountInBase: "100", exchangeRateToBase: "1" },
    ],
  });
  assert.equal(computeCommandHash(a), computeCommandHash(b));
});


test("BUG-005 money Number in payload rejected by hash", () => {
  assert.throws(
    () =>
      computeCommandHash(
        normalizeCommand({
          operationId: "op-num",
          businessDate: "2026-01-01",
          baseCurrency: "IRR",
          status: "draft",
          type: "test.op",
          payload: { amount: 0.1 },
        }),
      ),
    /HASH_NUMBER_FORBIDDEN/,
  );
});

test("equivalent decimal formatting → same hash", () => {
  const base = {
    operationId: "op-dec",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "posted",
    type: "test.op",
  };
  const a = normalizeCommand({
    ...base,
    journalLines: [
      { accountId: "a1", side: "debit", amount: "100", currency: "IRR" },
      { accountId: "a2", side: "credit", amount: "100", currency: "IRR" },
    ],
  });
  const b = normalizeCommand({
    ...base,
    journalLines: [
      { accountId: "a1", side: "debit", amount: "100.0", currency: "IRR" },
      { accountId: "a2", side: "credit", amount: "100.00", currency: "IRR" },
    ],
  });
  assert.equal(computeCommandHash(a), computeCommandHash(b));
});

test("reordered journal lines → same economic hash", () => {
  const base = {
    operationId: "op-order",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "posted",
    type: "test.op",
  };
  const a = normalizeCommand({
    ...base,
    journalLines: [
      { accountId: "a1", side: "debit", amount: "50", currency: "IRR" },
      { accountId: "a2", side: "credit", amount: "50", currency: "IRR" },
    ],
  });
  const b = normalizeCommand({
    ...base,
    journalLines: [
      { accountId: "a2", side: "credit", amount: "50", currency: "IRR" },
      { accountId: "a1", side: "debit", amount: "50", currency: "IRR" },
    ],
  });
  assert.equal(computeCommandHash(a), computeCommandHash(b));
});

test("payload key order does not change hash", () => {
  const base = {
    operationId: "op-keys",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "draft",
    type: "test.op",
    journalLines: [],
  };
  const a = normalizeCommand({ ...base, payload: { a: "1", b: "2" } });
  const b = normalizeCommand({ ...base, payload: { b: "2", a: "1" } });
  assert.equal(computeCommandHash(a), computeCommandHash(b));
});

test("omitted settlementDate and null settlementDate same identity", () => {
  const base = {
    operationId: "op-null",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "draft",
    type: "test.op",
    journalLines: [],
  };
  const a = normalizeCommand({ ...base });
  const b = normalizeCommand({ ...base, settlementDate: null });
  assert.equal(computeCommandHash(a), computeCommandHash(b));
});
