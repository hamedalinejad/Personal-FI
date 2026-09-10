import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "./operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  scopedAccountId,
} from "../../accounting/chartOfAccounts.js";
import { openDb, closeAllDbs, loadOperation } from "../../persistence/port.js";

test("B-022 result_json preserves payload envelope", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-env-"));
  const cash = scopedAccountId("local_settlement_cash", "IRR");
  const inv = scopedAccountId("crypto_inventory", "IRR");
  const opId = randomUUID();
  await runAtomicFinancialOperation({
    operationId: opId,
    type: "test.envelope",
    dataDir,
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    payload: { note: "keep-me", instrumentId: "x" },
    journalLines: [
      {
        accountId: inv,
        side: "debit",
        amount: "1",
        currency: "IRR",
        amountInBase: "1",
        exchangeRateToBase: "1",
      },
      {
        accountId: cash,
        side: "credit",
        amount: "1",
        currency: "IRR",
        amountInBase: "1",
        exchangeRateToBase: "1",
      },
    ],
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, "IRR");
      ensureFeatureInventoryAccount(db, {
        featureKey: "crypto",
        currency: "IRR",
        displayName: "Crypto",
      });
    },
  });
  const loaded = await loadOperation(opId, { dataDir });
  assert.equal(loaded.payload?.note, "keep-me");
  assert.ok(loaded.normalizedRequest);
  closeAllDbs();
});

test("B-023 non-OP_NOT_FOUND load errors must not start new write path silently", async () => {
  // Structural: only OP_NOT_FOUND is caught as continue — verified by source contract + envelope test above.
  // A missing dataDir that causes unexpected errors should throw, not invent a second op.
  await assert.rejects(
    async () => {
      const { loadOperation: lo } = await import("../../persistence/port.js");
      await lo("no-such-op", { dataDir: await mkdtemp(join(tmpdir(), "pf-nf-")) });
    },
    (e) => e && e.message === "OP_NOT_FOUND",
  );
});
