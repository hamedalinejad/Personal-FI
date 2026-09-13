import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { assertPositive } from "../../../core/domain/validation/positiveMoney.js";
import { fundCashJournalLines } from "../domain/cashPath.js";
import { resolveOrCreateInstrument } from "../../../core/domain/instrument/resolve.js";

/**
 * funds.subscribe — holding identity = instrument_id + account_id (nullable standalone)
 */
export async function subscribeFund(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  if (!p.instrumentId) throw new Error("VALIDATION_ERROR:instrumentId");
  if (!p.businessDate) throw new Error("VALIDATION_ERROR:businessDate");
  const qty = toDecimal(p.quantity ?? p.units);
  if (qty.lte(0)) throw new Error("VALIDATION_ERROR:quantity");

  // /003/004: explicit price modes — never treat amount as unit price
  const nav = p.nav != null && p.nav !== "" ? toDecimal(p.nav) : null;
  let txPrice = null;
  if (p.transactionPrice != null && p.transactionPrice !== "") {
    txPrice = toDecimal(p.transactionPrice);
  } else if (p.pricingMode === "nav" && nav != null) {
    txPrice = nav;
  } else if (p.pricingMode === "amount_based" && p.amount != null && p.amount !== "") {
    txPrice = toDecimal(p.amount).div(qty);
  } else if (nav != null) {
    // allowed fallback only when transactionPrice omitted and nav present
    txPrice = nav;
  } else {
    throw new Error("VALIDATION_ERROR:transactionPrice_or_nav");
  }
  assertPositive(txPrice.toFixed(), "FUND_PRICE_NONPOSITIVE");
  if (nav != null) assertPositive(nav.toFixed(), "FUND_NAV_NONPOSITIVE");

  let amount;
  if (p.amount != null && p.amount !== "") {
    amount = toDecimal(p.amount);
    const expected = qty.times(txPrice);
    if (!amount.eq(expected)) {
      throw new Error(`AMOUNT_PRICE_MISMATCH:expected=${expected.toFixed()},got=${amount.toFixed()}`);
    }
  } else {
    amount = qty.times(txPrice);
  }
  assertPositive(amount.toFixed(), "FUND_AMOUNT_NONPOSITIVE");

  // transaction vs base currency
  const transactionCurrency = p.transactionCurrency || p.currency;
  if (!transactionCurrency) throw new Error("VALIDATION_ERROR:transactionCurrency");
  const baseCurrency = p.baseCurrency || transactionCurrency;
  let exchangeRateToBase = p.exchangeRateToBase != null ? toDecimal(p.exchangeRateToBase) : null;
  if (transactionCurrency === baseCurrency) {
    exchangeRateToBase = toDecimal("1");
  } else if (exchangeRateToBase == null) {
    throw new Error("VALIDATION_ERROR:exchangeRateToBase");
  }
  const amountInBase = amount.times(exchangeRateToBase);
  const currency = transactionCurrency; // journal line currency = transaction currency
  const accountId = p.accountId || null;
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  // FUND-003: same CashSettlementPort/Accounts pattern as stocks — no brokerage cash ledger
  const invId = scopedAccountId("fund_inventory", currency); // Model A: inventory account currency = transaction currency
  const holdingId = randomUUID();
  const txId = randomUUID();
  const now = new Date().toISOString();

  const journalLines = [
    {
      accountId: invId,
      side: "debit",
      amount: amount.toFixed(),
      currency,
      amountInBase: amountInBase.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: amount.toFixed(),
      currency,
      amountInBase: amountInBase.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
  ];

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "funds.subscribe",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    payload: { ...p, accountId },
    journalLines,
    domainResult: {
      holdingId,
      transactionId: txId,
      accountId,
      cost: amount.toFixed(),
      nav: nav ? nav.toFixed() : null,
      transactionPrice: txPrice.toFixed(),
      quantity: qty.toFixed(),
      transactionCurrency,
      baseCurrency,
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      amountInBase: amountInBase.toFixed(),
      valuation: {
        nav: nav ? nav.toFixed() : null,
        transactionPrice: txPrice.toFixed(),
        source: p.priceSource || p.valuationSource || null,
        sourceReference: p.priceSourceReference || null,
        asOf: p.priceAsOf || p.navAsOf || p.businessDate,
        fetchedAt: p.priceFetchedAt || null,
        marketDate: p.marketDate || p.businessDate,
        quoteType: p.quoteType || (p.transactionPrice != null ? "transaction_price" : "nav"),
        valuationMode: p.valuationMode || "transaction_price_preferred",
      },
    },
    engineVersions: { funds: "1.1.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "fund",
        currency, // transaction currency — matches journal line
        displayName: "Fund investment",
      });

      if (!p.symbol) throw new Error("INSTRUMENT_SYMBOL_REQUIRED_ON_CREATE");
      resolveOrCreateInstrument(db, {
        instrumentId: p.instrumentId,
        assetClass: "fund",
        symbol: p.symbol,
        name: p.name || p.symbol,
        now,
      });

      let holding;
      if (accountId) {
        holding = db
          .prepare(
            `SELECT * FROM inv_fif_holdings WHERE instrument_id = ? AND account_id = ?`,
          )
          .get(p.instrumentId, accountId);
      } else {
        holding = db
          .prepare(
            `SELECT * FROM inv_fif_holdings WHERE instrument_id = ? AND account_id IS NULL`,
          )
          .get(p.instrumentId);
      }

      if (holding) {
        const newQty = toDecimal(holding.quantity).plus(qty);
        const newCost = toDecimal(holding.total_invested).plus(amount);
        db.prepare(
          `UPDATE inv_fif_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
        ).run(newQty.toFixed(), newCost.toFixed(), now, holding.id);
        holding = { id: holding.id };
      } else {
        db.prepare(
          `INSERT INTO inv_fif_holdings (
            id, instrument_id, quantity, total_invested, cost_currency, account_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          holdingId,
          p.instrumentId,
          qty.toFixed(),
          amount.toFixed(),
          currency,
          accountId,
          now,
          now,
        );
        holding = { id: holdingId };
      }

      db.prepare(
        `INSERT INTO inv_fif_transactions (
          id, operation_id, instrument_id, tx_type, trade_date, settlement_date,
          quantity, nav, transaction_price, amount, currency, account_id, created_at
        ) VALUES (?, ?, ?, 'subscribe', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        p.instrumentId,
        p.businessDate,
        p.settlementDate || p.businessDate,
        qty.toFixed(),
        nav ? nav.toFixed() : null,
        txPrice.toFixed(),
        amount.toFixed(),
        currency,
        accountId,
        now,
      );
    },
  });
}
