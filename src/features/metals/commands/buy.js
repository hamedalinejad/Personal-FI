import { resolveBookBaseCurrency, requireFxIfCrossCurrency } from "../../../core/accounting/bookSettings.js";
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

/** Module policy v1 (docs/modules/metals.md): trade fee expense; premium capitalized via alias */
const MODULE_DEFAULT_FEE_TREATMENT = "expense";
const MODULE_DEFAULT_PREMIUM_TREATMENT = "capitalize_inventory";

export async function buyMetal(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "platformId", "currency", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  // canonical mass is quantityMg; grossWeight retained as UI alias (mg)
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
  // never default purity to 1
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

  // Quote semantics (explicit — never silent pure vs gross confusion)
  const quoteBasis = p.quoteBasis || "pure_metal"; // pure_metal | gross_weight | coin_market | bar
  const priceUnit = p.priceUnit || "per_mg"; // per_mg | per_g
  const pricePurityBasis = p.pricePurityBasis || (quoteBasis === "pure_metal" ? "fine" : "gross");
  const allowedQuote = new Set(["pure_metal", "gross_weight", "coin_market", "bar"]);
  const allowedUnit = new Set(["per_mg", "per_g"]);
  const allowedPurityBasis = new Set(["fine", "gross"]);
  if (!allowedQuote.has(quoteBasis)) throw new Error("VALIDATION_ERROR:quoteBasis");
  if (!allowedUnit.has(priceUnit)) throw new Error("VALIDATION_ERROR:priceUnit");
  if (!allowedPurityBasis.has(pricePurityBasis)) throw new Error("VALIDATION_ERROR:pricePurityBasis");
  if (quoteBasis === "pure_metal" && pricePurityBasis !== "fine") {
    throw new Error("VALIDATION_ERROR:quoteBasis_pricePurityBasis");
  }
  if (quoteBasis === "gross_weight" && pricePurityBasis !== "gross") {
    throw new Error("VALIDATION_ERROR:quoteBasis_pricePurityBasis");
  }
  if ((quoteBasis === "coin_market" || quoteBasis === "bar") && !p.instrumentQuoteLocked) {
    // coin/bar market quotes must not be auto-derived from pure metal without explicit lock
    if (pricePurityBasis === "fine" && !p.allowFineDerivedCoinPrice) {
      throw new Error("VALIDATION_ERROR:coin_bar_requires_explicit_policy");
    }
  }
  let pricePerMg = toDecimal(unitPrice);
  if (priceUnit === "per_g") pricePerMg = pricePerMg.div("1000");
  const massForPrice = pricePurityBasis === "fine" ? fine : grossMg;
  const metalCost = massForPrice.times(pricePerMg);
  const premium = toDecimal(p.premiumAmount ?? p.premium ?? "0");
  const fee = toDecimal(p.feeAmount ?? p.fee ?? "0");
  const currency = p.currency;
  const baseCurrency = resolveBookBaseCurrency({ dataDir, explicitBaseCurrency: p.baseCurrency || null, transactionCurrency: currency });
  let exchangeRateToBase = "1";
  if (baseCurrency !== currency) {
    if (!p.exchangeRateToBase) throw new Error("FX_RATE_REQUIRED");
    exchangeRateToBase = toDecimal(p.exchangeRateToBase).toFixed();
  } else if (p.exchangeRateToBase != null && p.exchangeRateToBase !== "") {
    // BUG-F03: same-currency must not accept non-identity FX
    const supplied = toDecimal(p.exchangeRateToBase);
    if (!supplied.eq(1)) throw new Error("FX_SAME_CURRENCY_RATE_MUST_BE_1");
    exchangeRateToBase = "1";
  }

  const feeCurrency = p.feeCurrency || currency;
  if (fee.gt(0) && feeCurrency !== currency && feeCurrency !== (p.baseCurrency || currency)) {
    throw new Error("FEE_CURRENCY_UNSUPPORTED");
  }
  // never sum fee in foreign currency into transaction-currency cashPrincipal
  if (!fee.isZero() && feeCurrency !== currency) {
    if (p.feeExchangeRateToBase == null && baseCurrency !== feeCurrency) {
      throw new Error("VALIDATION_ERROR:feeExchangeRateToBase");
    }
    // foreign fee must be a separate cash leg via Fee Engine (expense/capitalized in base);
    // cashPrincipal stays metalCost+premium in transaction currency only
  }
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("metal_inventory", currency);

  const feeEvents = buildFeeEvents(
    [
      { feeAmount: premium.toFixed(), treatment: p.premiumTreatment || MODULE_DEFAULT_PREMIUM_TREATMENT, label: "premium", feeCurrency: currency },
      { feeAmount: fee.toFixed(), treatment: p.feeTreatment || MODULE_DEFAULT_FEE_TREATMENT, label: "fee", feeCurrency, feeExchangeRateToBase: p.feeExchangeRateToBase },
    ].filter((f) => !toDecimal(f.feeAmount).isZero()),
    { baseCurrency, transactionCurrency: currency, exchangeRateToBase },
  );
    // BUG-003 v1: fee currency must match transaction currency
  if (p.feeAmount != null && p.feeAmount !== "" && !toDecimal(p.feeAmount).isZero()) {
    const feeCur = p.feeCurrency || currency;
    if (feeCur !== currency) {
      throw new Error("METALS_FEE_CURRENCY_MISMATCH:v1_feeCurrency_must_eq_transactionCurrency");
    }
  }
const feeResult = applyFeeEvents(
    feeEvents.map((e) => ({
      ...e,
      inventoryAccountId: invId,
      baseCurrency,
      transactionCurrency: currency,
      exchangeRateToBase,
    })),
    {
      expenseAccountId: scopedAccountId("metal_fee_expense", feeCurrency),
      cashAccountId: cashId,
      transactionCurrency: currency,
    },
  );
  // Dimensional carrying — never add BASE fee amounts into TX currency
  // Premium is a capitalized_cost fee event — already inside carryingDeltaTx/Base; do not add twice
  const feeCarryTx = toDecimal(feeResult.carryingDeltaTx?.amount || "0");
  const carrying = metalCost.plus(feeCarryTx);
  const metalCostBase = metalCost.times(toDecimal(exchangeRateToBase));
  const carryingBase = metalCostBase.plus(toDecimal(feeResult.carryingDeltaBase || "0"));

  // TX cash: metal+premium+TX fee; subtract TX fee amounts already on fee expense journal credits
  const cashOutTx = metalCost.plus(premium).plus(feeCurrency === currency ? fee : toDecimal("0"));
  const expenseCashTx = feeResult.journalLines
    .filter((l) => l.side === "credit" && l.currency === currency)
    .reduce((s, l) => s.plus(toDecimal(l.amount)), toDecimal("0"));
  const cashPrincipal = cashOutTx.minus(expenseCashTx);
  const now = new Date().toISOString();
  let holdingId = randomUUID();
  const txId = randomUUID();

  const journalLines = [
    {
      accountId: invId,
      side: "debit",
      amount: metalCost.toFixed(),
      currency,
      amountInBase: metalCostBase.toFixed(),
      exchangeRateToBase,
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: cashPrincipal.toFixed(),
      currency,
      amountInBase: cashPrincipal.times(toDecimal(exchangeRateToBase)).toFixed(),
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
      cashOut: cashOutTx.toFixed(),
      cashPrincipal: cashPrincipal.toFixed(),
    },
    journalLines,
    domainResult: {
      fees: feeResult.derivedFeeBases,
      holdingId,
      transactionId: txId,
      fineWeight: fine.toFixed(),
      quoteBasis,
      priceUnit,
      pricePurityBasis,
      fineWeightMg: fine.toFixed(),
      quantityMg: grossMg.toFixed(),
      metalCost: metalCost.toFixed(),
      premium: premium.toFixed(),
      fee: fee.toFixed(),
      total: cashOutTx.toFixed(),
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
          id: scopedAccountId("metal_fee_expense", feeCurrency),
          name: `Metal fee expense (${feeCurrency})`,
          accountKind: "expense",
          currency: feeCurrency,
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

      // aggregate position (platform + instrument)
      let holding = db
        .prepare(
          `SELECT * FROM inv_metals_holdings WHERE platform_id = ? AND instrument_id = ? AND purity_ratio = ?`,
        )
        .get(p.platformId, p.instrumentId, p.purityRatio);
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
          quantity_mg, purity_ratio, metal_price_per_mg, premium_amount, fee_amount, fee_currency,
          amount, currency, exchange_rate_to_base, quote_basis, price_unit, price_purity_basis, created_at
        ) VALUES (?, ?, ?, ?, 'buy', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        holdingId,
        p.instrumentId,
        p.businessDate,
        grossMg.toFixed(),
        String(p.purityRatio),
        String(unitPrice),
        premium.toFixed(),
        fee.toFixed(),
        p.feeCurrency || currency,
        cashPrincipal.toFixed(),
        currency,
        exchangeRateToBase,
        quoteBasis,
        priceUnit,
        pricePurityBasis,
        now,
      );
    },
  });
}
