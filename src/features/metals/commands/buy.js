import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureAccount,
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { assertInstrumentValuationPolicy } from "../domain/valuationBasis.js";
import { resolveOrCreateInstrument, resolveOrCreateNamedMaster } from "../../../core/domain/instrument/resolve.js";
import { buildFeeEvents, applyFeeEvents } from "../../../core/domain/fee/feeEngine.js";

/**
 * metals.buy — persists inv_metals_transactions; metal / premium / fee separated.
 */
export async function buyMetal(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "platformId", "currency", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  // B-020: canonical mass is quantityMg; grossWeight retained as UI alias (mg)
  const quantityMgRaw = p.quantityMg ?? p.grossWeight;
  if (quantityMgRaw == null || quantityMgRaw === "") throw new Error("VALIDATION_ERROR:quantityMg");
  if (p.inputMassUnit === "g" || p.inputMassUnit === "gram") {
    // UI grams → mg
    // quantityMg = grams * 1000 (handled below after parse)
  }
  const unitPrice = p.metalPricePerMg ?? p.metalPrice;
  if (unitPrice == null || unitPrice === "") throw new Error("VALIDATION_ERROR:metalPricePerMg");

  let grossMg = toDecimal(quantityMgRaw);
  if (p.inputMassUnit === "g" || p.inputMassUnit === "gram") {
    grossMg = grossMg.times("1000");
  }
  // BUG-008: never default purity to 1
  const purityPolicy = p.purityPolicy || null;
  if (p.purityRatio == null || p.purityRatio === "") {
    if (purityPolicy === "fixed_1") {
      p.purityRatio = "1";
    } else {
      throw new Error("VALIDATION_ERROR:purityRatio");
    }
  }
  const purity = toDecimal(p.purityRatio);
  if (purity.lte(0) || purity.gt(1)) throw new Error("VALIDATION_ERROR:purityRatio_range");
  const fine = grossMg.times(purity); // fineWeightMg
  const metalCost = fine.times(toDecimal(unitPrice));
  const premium = toDecimal(p.premiumAmount ?? p.premium ?? "0");
  const fee = toDecimal(p.feeAmount ?? p.fee ?? "0");
  const currency = p.currency;
  const baseCurrency = p.baseCurrency || currency;
  // BUG-CUR-015
  let exchangeRateToBase = p.exchangeRateToBase || "1";
  if (baseCurrency !== currency) {
    if (!p.exchangeRateToBase) throw new Error("FX_RATE_REQUIRED");
    exchangeRateToBase = toDecimal(p.exchangeRateToBase).toFixed();
  }

  const feeCurrency = p.feeCurrency || currency;
  // P0-04: never sum fee in foreign currency into transaction-currency cashOut
  if (!fee.isZero() && feeCurrency !== currency) {
    if (p.feeExchangeRateToBase == null && baseCurrency !== feeCurrency) {
      throw new Error("VALIDATION_ERROR:feeExchangeRateToBase");
    }
    // foreign fee must be a separate cash leg via Fee Engine (expense/capitalized in base);
    // cashOut stays metalCost+premium in transaction currency only
  }
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("metal_inventory", currency);

  const feeEvents = buildFeeEvents(
    [
      { feeAmount: premium.toFixed(), treatment: p.premiumTreatment || "capitalized_cost", label: "premium", feeCurrency: currency },
      { feeAmount: fee.toFixed(), treatment: p.feeTreatment || "expense", label: "fee", feeCurrency, feeExchangeRateToBase: p.feeExchangeRateToBase },
    ].filter((f) => !toDecimal(f.feeAmount).isZero()),
    { baseCurrency, transactionCurrency: currency, exchangeRateToBase },
  );
  const feeResult = applyFeeEvents(feeEvents, {
    expenseAccountId: scopedAccountId("metal_fee_expense", baseCurrency),
    cashAccountId: cashId,
  });
  // carrying stays in transaction currency; base delta must not mix units
  const feeCarryTx = feeResult.carryingDelta?.amount != null
    ? toDecimal(feeResult.carryingDelta.amount)
    : (currency === baseCurrency ? toDecimal(feeResult.carryingDeltaBase) : toDecimal("0"));
  const carrying = metalCost.plus(feeCarryTx);
  const carryingBase = carrying.times(toDecimal(exchangeRateToBase)).plus(
    currency === baseCurrency ? toDecimal("0") : toDecimal(feeResult.carryingDeltaBase || "0"),
  );

  const cashOutTx = metalCost.plus(premium).plus(feeCurrency === currency ? fee : toDecimal("0"));
  const cashOut = cashOutTx; // transaction-currency cash only

  const expenseCash = feeResult.journalLines
    .filter((l) => l.side === "credit")
    .reduce((s, l) => s.plus(toDecimal(l.amount)), toDecimal("0"));
  const cashPrincipal = cashOut.minus(expenseCash);
  const now = new Date().toISOString();
  let holdingId = randomUUID();
  const txId = randomUUID();

  const journalLines = [
    {
      accountId: invId,
      side: "debit",
      amount: carrying.toFixed(),
      currency,
      amountInBase: carryingBase.toFixed(),
      exchangeRateToBase,
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: cashPrincipal.toFixed(),
      currency,
      amountInBase: cashPrincipal.toFixed(),
      exchangeRateToBase,
      lineKind: "principal",
    },
    ...feeResult.journalLines,
  ];

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "metals.buy",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    payload: {
      ...p,
      quantityMg: grossMg.toFixed(),
      fineWeightMg: fine.toFixed(),
      originalMassInput: quantityMgRaw,
      inputMassUnit: p.inputMassUnit || "mg",
      metalCost: metalCost.toFixed(),
      premium: premium.toFixed(),
      fee: fee.toFixed(),
      carrying: carrying.toFixed(),
      cashOut: cashOut.toFixed(),
    },
    journalLines,
    domainResult: {
      fees: feeResult.derivedFeeBases,
      holdingId,
      transactionId: txId,
      fineWeight: fine.toFixed(),
      fineWeightMg: fine.toFixed(),
      quantityMg: grossMg.toFixed(),
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
      if (feeResult.journalLines.some((l) => l.lineKind === "fee")) {
        ensureAccount(db, {
          id: scopedAccountId("metal_fee_expense", baseCurrency),
          name: `Metal fee expense (${baseCurrency})`,
          accountKind: "expense",
          currency: baseCurrency,
          systemRole: "metal_fee_expense",
        });
      }

      resolveOrCreateNamedMaster(db, {
        table: "inv_metals_platforms",
        id: p.platformId,
        existingSelect: `SELECT * FROM inv_metals_platforms WHERE id = ?`,
        insertSql: `INSERT INTO inv_metals_platforms (id, name, created_at) VALUES (?, ?, ?)`,
        insertArgs: [p.platformId, p.platformName || p.platformId, now],
      });
      if (!p.symbol) throw new Error("INSTRUMENT_SYMBOL_REQUIRED_ON_CREATE");
      resolveOrCreateInstrument(db, {
        instrumentId: p.instrumentId,
        assetClass: "metal",
        symbol: p.symbol,
        name: p.name || p.symbol,
        now,
      });

      // BUG-009: aggregate position (platform + instrument)
      let holding = db
        .prepare(
          `SELECT * FROM inv_metals_holdings WHERE platform_id = ? AND instrument_id = ?`,
        )
        .get(p.platformId, p.instrumentId);
      if (holding) {
        const newQty = toDecimal(holding.quantity_mg).plus(grossMg);
        const newCost = toDecimal(holding.total_invested || "0").plus(carrying);
        db.prepare(
          `UPDATE inv_metals_holdings SET quantity_mg = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
        ).run(newQty.toFixed(), newCost.toFixed(), now, holding.id);
        holdingId = holding.id;
      } else {
        db.prepare(
          `INSERT INTO inv_metals_holdings (
            id, platform_id, instrument_id, quantity_mg, purity_code, purity_ratio,
            total_invested, cost_currency, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          holdingId,
          p.platformId,
          p.instrumentId,
          grossMg.toFixed(),
          p.purityCode || "unknown",
          p.purityRatio,
          carrying.toFixed(),
          currency,
          now,
          now,
        );
      }

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
        grossMg.toFixed(),
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
