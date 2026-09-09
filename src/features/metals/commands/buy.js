import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { openDb } from "../../../core/persistence/worker.js";

/** metals.buy — fineWeight = grossWeight * purityRatio; premium separate */
export async function buyMetal(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;
  for (const k of [
    "instrumentId",
    "grossWeight",
    "purityRatio",
    "metalPrice",
    "currency",
    "businessDate",
    "platformId",
  ]) {
    if (!p[k]) throw new Error(`VALIDATION_ERROR:${k}`);
  }
  const gross = toDecimal(p.grossWeight);
  const purity = toDecimal(p.purityRatio);
  const fine = gross.times(purity);
  const metalPrice = toDecimal(p.metalPrice);
  const premium = toDecimal(p.premium || "0");
  const fee = toDecimal(p.fee || "0");
  // metal cost on fine weight + separate premium + fee
  const metalCost = fine.times(metalPrice);
  const total = metalCost.plus(premium).plus(fee);
  const now = new Date().toISOString();

  bootstrapLoanEditionAccounts(dataDir, p.currency);
  const cashId = p.cashAccountId || "LOC-CASH";
  const metalAcc = "METAL-INV";
  const db0 = openDb(dataDir);
  db0.prepare(
    `INSERT OR IGNORE INTO fin_accounts (
      id, name, account_kind, currency, is_archived, created_at, updated_at, status, role
    ) VALUES (?, 'Metal investment', 'asset', ?, 0, ?, ?, 'active', 'metal_inventory')`,
  ).run(metalAcc, p.currency, now, now);
  db0.prepare(
    `INSERT OR IGNORE INTO inv_metals_platforms (id, name, created_at) VALUES (?, ?, ?)`,
  ).run(p.platformId, p.platformName || p.platformId, now);
  db0.prepare(
    `INSERT OR IGNORE INTO ref_instruments (
      id, asset_class, symbol, name, created_at, updated_at, is_active
    ) VALUES (?, 'metal', ?, ?, ?, ?, 1)`,
  ).run(p.instrumentId, p.symbol || "GOLD", p.symbol || "GOLD", now, now);

  const journalLines = [
    {
      accountId: metalAcc,
      side: "debit",
      amount: total.toFixed(),
      currency: p.currency,
      amountInBase: total.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: total.toFixed(),
      currency: p.currency,
      amountInBase: total.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];

  const holdingId = randomUUID();
  return runAtomicFinancialOperation({
    operationId,
    type: "metals.buy",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: p.currency,
    payload: {
      ...p,
      fineWeight: fine.toFixed(),
      metalCost: metalCost.toFixed(),
      premium: premium.toFixed(),
      total: total.toFixed(),
    },
    journalLines,
    domainResult: {
      fineWeight: fine.toFixed(),
      metalCost: metalCost.toFixed(),
      premium: premium.toFixed(),
      total: total.toFixed(),
      holdingId,
    },
    engineVersions: { metals: "1.0.0", money: "1.0.0" },
    withinTransaction(db) {
      db.prepare(
        `INSERT INTO inv_metals_holdings (
          id, platform_id, instrument_id, quantity_mg, purity_code, purity_ratio, total_invested, cost_currency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        holdingId,
        p.platformId,
        p.instrumentId,
        p.grossWeight, // gross mg SoT
        p.purityCode || "unknown",
        p.purityRatio,
        total.toFixed(),
        p.currency,
        now,
        now,
      );
    },
  });
}
