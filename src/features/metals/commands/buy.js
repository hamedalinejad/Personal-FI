import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureAccount,
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/**
 * metals.buy — persists inv_metals_transactions; metal / premium / fee separated.
 */
export async function buyMetal(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "platformId", "grossWeight", "currency", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  const unitPrice = p.metalPricePerMg ?? p.metalPrice;
  if (unitPrice == null || unitPrice === "") throw new Error("VALIDATION_ERROR:metalPricePerMg");

  const grossMg = toDecimal(p.grossWeight);
  const purity = toDecimal(p.purityRatio || "1");
  const fine = grossMg.times(purity);
  const metalCost = fine.times(toDecimal(unitPrice));
  const premium = toDecimal(p.premiumAmount ?? p.premium ?? "0");
  const fee = toDecimal(p.feeAmount ?? p.fee ?? "0");
  const feeTreatment = p.feeTreatment || "expense";
  const premiumTreatment = p.premiumTreatment || "capitalized_cost";

  let carrying = metalCost;
  let expenseTotal = toDecimal("0");
  if (premiumTreatment === "capitalized_cost") carrying = carrying.plus(premium);
  else if (premiumTreatment === "expense") expenseTotal = expenseTotal.plus(premium);
  else throw new Error(`FEE_TREATMENT_INVALID:${premiumTreatment}`);

  if (feeTreatment === "capitalized_cost") carrying = carrying.plus(fee);
  else if (feeTreatment === "expense") expenseTotal = expenseTotal.plus(fee);
  else throw new Error(`FEE_TREATMENT_INVALID:${feeTreatment}`);

  const cashOut = metalCost.plus(premium).plus(fee);
  const currency = p.currency;
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("metal_inventory", currency);
  const feeExpId = scopedAccountId("metal_fee_expense", currency);
  const now = new Date().toISOString();
  const holdingId = randomUUID();
  const txId = randomUUID();

  const journalLines = [
    {
      accountId: invId,
      side: "debit",
      amount: carrying.toFixed(),
      currency,
      amountInBase: carrying.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];
  if (expenseTotal.gt(0)) {
    journalLines.push({
      accountId: feeExpId,
      side: "debit",
      amount: expenseTotal.toFixed(),
      currency,
      amountInBase: expenseTotal.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "fee",
    });
  }
  journalLines.push({
    accountId: cashId,
    side: "credit",
    amount: cashOut.toFixed(),
    currency,
    amountInBase: cashOut.toFixed(),
    exchangeRateToBase: "1",
    lineKind: "principal",
  });

  return runAtomicFinancialOperation({
    operationId,
    type: "metals.buy",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: {
      ...p,
      fineWeight: fine.toFixed(),
      metalCost: metalCost.toFixed(),
      premium: premium.toFixed(),
      fee: fee.toFixed(),
      carrying: carrying.toFixed(),
      cashOut: cashOut.toFixed(),
      feeTreatment,
      premiumTreatment,
    },
    journalLines,
    domainResult: {
      holdingId,
      transactionId: txId,
      fineWeight: fine.toFixed(),
      metalCost: metalCost.toFixed(),
      premium: premium.toFixed(),
      fee: fee.toFixed(),
      total: cashOut.toFixed(),
      carrying: carrying.toFixed(),
    },
    engineVersions: { metals: "1.1.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "metal",
        currency,
        displayName: "Metal investment",
      });
      if (expenseTotal.gt(0)) {
        ensureAccount(db, {
          id: feeExpId,
          name: `Metal fee expense (${currency})`,
          accountKind: "expense",
          currency,
          systemRole: "metal_fee_expense",
        });
      }

      db.prepare(
        `INSERT OR IGNORE INTO inv_metals_platforms (id, name, created_at) VALUES (?, ?, ?)`,
      ).run(p.platformId, p.platformName || p.platformId, now);

      db.prepare(
        `INSERT OR IGNORE INTO ref_instruments (
          id, asset_class, symbol, name, created_at, updated_at, is_active
        ) VALUES (?, 'metal', ?, ?, ?, ?, 1)`,
      ).run(p.instrumentId, p.symbol || "GOLD", p.name || p.symbol || "GOLD", now, now);

      db.prepare(
        `INSERT INTO inv_metals_holdings (
          id, platform_id, instrument_id, quantity_mg, purity_code, purity_ratio,
          total_invested, cost_currency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        holdingId,
        p.platformId,
        p.instrumentId,
        p.grossWeight,
        p.purityCode || "unknown",
        p.purityRatio || "1",
        carrying.toFixed(),
        currency,
        now,
        now,
      );

      db.prepare(
        `INSERT INTO inv_metals_transactions (
          id, operation_id, holding_id, instrument_id, tx_type, business_date,
          quantity_mg, metal_price_per_mg, premium_amount, fee_amount, fee_currency,
          amount, currency, exchange_rate_to_base, created_at
        ) VALUES (?, ?, ?, ?, 'buy', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        holdingId,
        p.instrumentId,
        p.businessDate,
        p.grossWeight,
        String(unitPrice),
        premium.toFixed(),
        fee.toFixed(),
        p.feeCurrency || currency,
        cashOut.toFixed(),
        currency,
        "1",
        now,
      );
    },
  });
}
