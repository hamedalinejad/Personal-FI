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
    /HASH_NUMBER_FORBIDDEN|PAYLOAD_ECONOMIC_NOT_STRING/,
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

test("exchangeRateToBase 42000 == 42000.0 same economic hash", () => {
  const base = {
    operationId: "op-fx-canon",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "draft",
    type: "test.op",
  };
  const lineA = {
    accountId: "a1",
    side: "debit",
    amount: "1",
    currency: "USD",
    amountInBase: "42000",
    exchangeRateToBase: "42000",
  };
  const lineB = {
    accountId: "a1",
    side: "debit",
    amount: "1",
    currency: "USD",
    amountInBase: "42000.0",
    exchangeRateToBase: "42000.0",
  };
  const credit = {
    accountId: "a2",
    side: "credit",
    amount: "42000",
    currency: "IRR",
  };
  const a = normalizeCommand({ ...base, journalLines: [lineA, credit] });
  const b = normalizeCommand({ ...base, journalLines: [lineB, credit] });
  assert.equal(a.journalLines[0].exchangeRateToBase, b.journalLines[0].exchangeRateToBase);
  assert.equal(computeCommandHash(a), computeCommandHash(b));
});

test("same-currency amount variants hash equal after canonicalize", () => {
  const base = {
    operationId: "op-amt-canon",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "draft",
    type: "test.op",
  };
  const a = normalizeCommand({
    ...base,
    journalLines: [
      { accountId: "a1", side: "debit", amount: "100.00", currency: "IRR" },
      { accountId: "a2", side: "credit", amount: "100.0", currency: "IRR" },
    ],
  });
  const b = normalizeCommand({
    ...base,
    journalLines: [
      { accountId: "a1", side: "debit", amount: "100", currency: "IRR" },
      { accountId: "a2", side: "credit", amount: "100", currency: "IRR" },
    ],
  });
  assert.equal(computeCommandHash(a), computeCommandHash(b));
});

test("H-payload: costTotal 100 vs 100.0 same hash when string economic field", () => {
  const base = {
    operationId: "op-payload-dec",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "draft",
    type: "test.op",
    journalLines: [],
  };
  const a = normalizeCommand({ ...base, payload: { costTotal: "100" } });
  const b = normalizeCommand({ ...base, payload: { costTotal: "100.0" } });
  assert.equal(a.payload.costTotal, "100");
  assert.equal(b.payload.costTotal, "100");
  assert.equal(computeCommandHash(a), computeCommandHash(b));
});

test("H-payload: Number economic field rejected", () => {
  assert.throws(
    () =>
      normalizeCommand({
        operationId: "op-payload-num",
        businessDate: "2026-01-01",
        baseCurrency: "IRR",
        status: "draft",
        type: "test.op",
        journalLines: [],
        payload: { costTotal: 100 },
      }),
    /PAYLOAD_ECONOMIC_NOT_STRING/,
  );
});
