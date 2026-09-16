import { resolveBookBaseCurrency, requireFxIfCrossCurrency } from "../../../core/accounting/bookSettings.js";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  ensureAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { buildFeeEvents, applyFeeEvents } from "../../../core/domain/fee/feeEngine.js";
import { SETTLEMENT_POLICY_VERSION } from "../../../core/iran/settlementPolicy.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { assertPositive, assertNonNegative } from "../../../core/domain/validation/positiveMoney.js";
import { applyDisposal } from "../../../core/domain/costBasis/engine.js";
import { openDb } from "../../../core/persistence/port.js";

/**
 * stocks.sell — WAC disposal.
 * V1: proceeds create broker receivable (T+n mirror of buy payable) unless settleSameDay.
 * Position decreases on tradeDate.
 */

/** Module policy v1 (docs/modules/stocks.md) — not a Core silent default */
const MODULE_DEFAULT_FEE_TREATMENT = "expense";

export async function sellStock(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "brokerageId", "quantity", "price", "currency", "tradeDate", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }

  const qty = toDecimal(p.quantity);
  const price = toDecimal(p.price);
  assertPositive(p.quantity, "STOCK_QTY_NONPOSITIVE");
  assertPositive(p.price, "STOCK_PRICE_NONPOSITIVE");
  const currency = p.currency;
  const proceeds = qty.times(price);
  const commission = toDecimal(p.commission || "0");
  const tax = toDecimal(p.tax || p.transactionTax || "0");
  const otherFee = toDecimal(p.otherFee || p.otherFees || "0");
  assertNonNegative(p.commission || "0", "STOCK_COMMISSION_NEGATIVE");
  assertNonNegative(p.tax || p.transactionTax || "0", "STOCK_TAX_NEGATIVE");
  assertNonNegative(p.otherFee || p.otherFees || "0", "STOCK_OTHER_FEE_NEGATIVE");
  const totalFees = commission.plus(tax).plus(otherFee);
  const netProceeds = proceeds.minus(totalFees);
  if (netProceeds.lt(0)) throw new Error("VALIDATION_ERROR:fees_exceed_proceeds");

  const tradeDate = p.tradeDate;
  const settlementDate = p.settlementDate || null;
  if (settlementDate && settlementDate < tradeDate) throw new Error("SETTLEMENT_BEFORE_TRADE");

  const settleSameOp =
    settlementDate != null &&
    settlementDate === tradeDate &&
    p.allowSameDaySettlement === true;

  const receivableId =
    p.brokerReceivableAccountId ||
    scopedAccountId(`broker_receivable_${p.brokerageId}`, currency);
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("stock_inventory", currency);
  const pnlId = scopedAccountId("stock_realized_pnl", currency);

  const baseCurrency = resolveBookBaseCurrency({
    dataDir,
    explicitBaseCurrency: p.baseCurrency || null,
    transactionCurrency: currency,
  });
  const exchangeRateToBase = requireFxIfCrossCurrency({
    transactionCurrency: currency,
    baseCurrency,
    exchangeRateToBase: p.exchangeRateToBase || null,
  });
  const toBase = (a) => toDecimal(typeof a === "string" ? a : a.toFixed()).times(toDecimal(exchangeRateToBase)).toFixed();

  // Module policy (stocks.md): sell fee default = expense when omitted
  const feeEvents = buildFeeEvents(
    [
      { feeAmount: commission.toFixed(), treatment: p.commissionTreatment || MODULE_DEFAULT_FEE_TREATMENT, label: "commission", feeCurrency: currency },
      { feeAmount: tax.toFixed(), treatment: p.taxTreatment || MODULE_DEFAULT_FEE_TREATMENT, label: "tax", feeCurrency: currency },
      { feeAmount: otherFee.toFixed(), treatment: p.otherFeeTreatment || MODULE_DEFAULT_FEE_TREATMENT, label: "otherFee", feeCurrency: currency },
    ].filter((f) => !toDecimal(f.feeAmount).isZero()),
    { baseCurrency, transactionCurrency: currency, exchangeRateToBase },
  );
  const feeResult = applyFeeEvents(
    feeEvents.map((e) => ({
      ...e,
      baseCurrency,
      transactionCurrency: currency,
      exchangeRateToBase,
    })),
    {
      expenseAccountId: scopedAccountId("stock_fee_expense", currency),
      cashAccountId: receivableId,
      transactionCurrency: currency,
    },
  );

  const db0 = openDb(dataDir);
  const holding = db0
    .prepare(
      `SELECT * FROM inv_stocks_iran_holdings WHERE instrument_id = ? AND brokerage_id = ? AND ifnull(account_id,'') = ifnull(?, '')`,
    )
    .get(p.instrumentId, p.brokerageId, p.accountId || null);
  if (!holding) throw new Error("HOLDING_NOT_FOUND");

  const disposal = applyDisposal(
    { quantity: holding.quantity, totalInvested: holding.total_invested },
    { quantity: qty.toFixed(), proceeds: netProceeds.toFixed() },
  );

  const costReleased = toDecimal(disposal.costReleased);
  const realized = toDecimal(disposal.realizedPnl);

  // Trade: Dr Receivable (net proceeds) / Cr Inventory (cost) / Cr|Dr PnL
  const journalLines = [
    {
      accountId: receivableId,
      side: "debit",
      amount: netProceeds.toFixed(),
      currency,
      amountInBase: toBase(netProceeds),
      exchangeRateToBase,
      lineKind: "principal",
    },
    {
      accountId: invId,
      side: "credit",
      amount: costReleased.toFixed(),
      currency,
      amountInBase: toBase(costReleased),
      exchangeRateToBase,
      lineKind: "principal",
    },
  ];
  if (!realized.isZero()) {
    journalLines.push({
      accountId: pnlId,
      side: realized.gt(0) ? "credit" : "debit",
      amount: realized.abs().toFixed(),
      currency,
      amountInBase: toBase(realized.abs()),
      exchangeRateToBase,
      lineKind: "principal",
    });
  }
  // Fees: same vocabulary as buy (commission / tax / otherFee)
  journalLines.push(...feeResult.journalLines);

  if (settleSameOp) {
    journalLines.push(
      {
        accountId: cashId,
        side: "debit",
        amount: netProceeds.toFixed(),
        currency,
        amountInBase: toBase(netProceeds),
        exchangeRateToBase,
        lineKind: "principal",
      },
      {
        accountId: receivableId,
        side: "credit",
        amount: netProceeds.toFixed(),
        currency,
        amountInBase: toBase(netProceeds),
        exchangeRateToBase,
        lineKind: "principal",
      },
    );
  }

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    status: "posted",
    operationId,
    type: "stocks.sell",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    payload: p,
    journalLines,
    domainResult: {
      holdingId: holding.id,
      transactionId: txId,
      quantity: qty.toFixed(),
      proceeds: proceeds.toFixed(),
      netProceeds: netProceeds.toFixed(),
      costReleased: disposal.costReleased,
      realizedPnl: disposal.realizedPnl,
      tradeDate,
      settlementDate,
      settlementStatus: settleSameOp ? "settled_same_op" : "pending_settlement",
    },
    engineVersions: { stocks: "1.3.0", costBasis: "1.0.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "stock",
        currency,
        displayName: "Stock investment",
      });
      ensureAccount(db, {
        id: receivableId,
        name: `Broker receivable ${p.brokerageId} (${currency})`,
        accountKind: "asset",
        currency,
        systemRole: "broker_receivable",
      });
      ensureAccount(db, {
        id: pnlId,
        name: `Stock realized P&L (${currency})`,
        accountKind: "income",
        currency,
        systemRole: "stock_realized_pnl",
      });
      if (totalFees.gt(0)) {
        ensureAccount(db, {
          id: scopedAccountId("stock_fee_expense", currency),
          name: `Stock fee expense (${currency})`,
          accountKind: "expense",
          currency,
          systemRole: "stock_fee_expense",
        });
      }

      const h2 = db
        .prepare(
          `SELECT * FROM inv_stocks_iran_holdings WHERE instrument_id = ? AND brokerage_id = ? AND ifnull(account_id,'') = ifnull(?, '')`,
        )
        .get(p.instrumentId, p.brokerageId, p.accountId || null);
      if (!h2) throw new Error("HOLDING_NOT_FOUND");
      const d2 = applyDisposal(
        { quantity: h2.quantity, totalInvested: h2.total_invested },
        { quantity: qty.toFixed(), proceeds: netProceeds.toFixed() },
      );
      db.prepare(
        `UPDATE inv_stocks_iran_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
      ).run(d2.quantity, d2.totalInvested, now, h2.id);

      db.prepare(
        `INSERT INTO inv_stocks_iran_transactions (
          id, operation_id, holding_id, instrument_id, brokerage_id, tx_type,
          trade_date, settlement_date, cash_date, market_date, price_as_of, fx_as_of,
          settlement_policy_version, quantity, price, fee_amount,
          fee_commission, fee_tax, fee_other, fee_treatments_json,
          currency, account_id, created_at
        ) VALUES (?, ?, ?, ?, ?, 'sell', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        h2.id,
        p.instrumentId,
        p.brokerageId,
        tradeDate,
        settlementDate,
        p.cashDate || null,
        p.marketDate || tradeDate,
        p.priceAsOf || tradeDate,
        p.fxAsOf || null,
        p.settlementPolicyVersion || SETTLEMENT_POLICY_VERSION,
        qty.toFixed(),
        price.toFixed(),
        commission.plus(tax).plus(otherFee).toFixed(),
        commission.toFixed(),
        tax.toFixed(),
        otherFee.toFixed(),
        JSON.stringify({
          commission: p.commissionTreatment || null,
          tax: p.taxTreatment || null,
          otherFee: p.otherFeeTreatment || null,
        }),
        currency,
        p.accountId || null,
        now,
      );
    },
  });
}
