import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIranMoneyInput } from "../iran/toman.js";
import { allocatePayment } from "../../features/loan/domain/paymentAllocation.js";
import { applyEconomicSwap } from "../costBasis/applyEconomicSwap.js";
import { subscribe } from "../domain/funds/engine.js";
import { computeFineWeight } from "../domain/metals/fineWeight.js";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import { openDb, closeAllDbs } from "../persistence/worker.js";
import { ensureAccount } from "../accounting/chartOfAccounts.js";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

test("VECTOR Toman 1000000 → IRR 10000000", () => {
  const n = normalizeIranMoneyInput({ amount: "1000000", unit: "TOMAN" });
  assert.equal(n.currency, "IRR");
  assert.equal(n.amount, "10000000");
});

test("VECTOR fund NAV!=tx price cost = units*tx", () => {
  const r = subscribe({ quantity: "100", nav: "12", transactionPrice: "11.5" });
  assert.equal(r.costTotal, "1150");
  assert.equal(r.nav, "12");
  assert.equal(r.transactionPrice, "11.5");
  assert.equal(r.valuationMode, "transaction_price");
});

test("VECTOR metal fine weight", () => {
  assert.equal(
    computeFineWeight({ grossWeight: "100", purityRatio: "0.995" }),
    "99.5",
  );
});

test("VECTOR C2C destination cost with fee capitalized", () => {
  const r = applyEconomicSwap({
    sourceQty: "1",
    sourceCarryingCost: "1000",
    consideration: "1250",
    fee: "10",
    capitalizeFee: true,
  });
  assert.equal(r.realizedPnl, "250");
  assert.equal(r.destinationCostBasis, "1260");
});

test("VECTOR expense journal balanced 100", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-vec-"));
  const db = openDb(dataDir);
  ensureAccount(db, { id: "cash", name: "Cash", accountKind: "asset", currency: "IRR" });
  ensureAccount(db, { id: "expense", name: "Expense", accountKind: "expense", currency: "IRR" });
  const r = await runAtomicFinancialOperation({
    operationId: randomUUID(),
    type: "expense",
    dataDir,
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    journalLines: [
      { accountId: "expense", side: "debit", amount: "100", currency: "IRR" },
      { accountId: "cash", side: "credit", amount: "100", currency: "IRR" },
    ],
  });
  assert.equal(r.journalLines.length, 2);
  closeAllDbs();
});

test("VECTOR transfer 250", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-vec-"));
  const db = openDb(dataDir);
  ensureAccount(db, { id: "src", name: "Src", accountKind: "asset", currency: "IRR" });
  ensureAccount(db, { id: "dst", name: "Dst", accountKind: "asset", currency: "IRR" });
  const r = await runAtomicFinancialOperation({
    operationId: randomUUID(),
    type: "transfer",
    dataDir,
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    journalLines: [
      { accountId: "dst", side: "debit", amount: "250", currency: "IRR" },
      { accountId: "src", side: "credit", amount: "250", currency: "IRR" },
    ],
  });
  assert.equal(r.idempotentReplay, false);
  closeAllDbs();
});

test("VECTOR idempotency O1 H1 replay / H2 conflict", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-vec-"));
  const db = openDb(dataDir);
  ensureAccount(db, { id: "a", name: "A", accountKind: "asset", currency: "IRR" });
  ensureAccount(db, { id: "b", name: "B", accountKind: "liability", currency: "IRR" });
  const operationId = randomUUID();
  const lines = [
    { accountId: "a", side: "debit", amount: "10", currency: "IRR" },
    { accountId: "b", side: "credit", amount: "10", currency: "IRR" },
  ];
  const first = await runAtomicFinancialOperation({
    operationId,
    type: "adj",
    dataDir,
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    journalLines: lines,
  });
  const second = await runAtomicFinancialOperation({
    operationId,
    type: "adj",
    dataDir,
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    journalLines: lines,
  });
  assert.equal(second.idempotentReplay, true);
  assert.equal(first.operationId, second.operationId);
  await assert.rejects(() =>
    runAtomicFinancialOperation({
      operationId,
      type: "adj",
      dataDir,
      businessDate: "2026-01-01",
      baseCurrency: "IRR",
      journalLines: [
        { accountId: "a", side: "debit", amount: "99", currency: "IRR" },
        { accountId: "b", side: "credit", amount: "99", currency: "IRR" },
      ],
    }),
  );
  closeAllDbs();
});
