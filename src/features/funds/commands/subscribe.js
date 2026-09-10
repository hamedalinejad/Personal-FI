import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/**
 * funds.subscribe — holding identity = instrument_id + account_id (nullable standalone)
 */
export async function subscribeFund(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  if (!p.instrumentId) throw new Error("VALIDATION_ERROR:instrumentId");
  if (!p.currency) throw new Error("VALIDATION_ERROR:currency");
  if (!p.businessDate) throw new Error("VALIDATION_ERROR:businessDate");
  const qty = toDecimal(p.quantity ?? p.units);
  const nav = p.nav != null ? toDecimal(p.nav) : null;
  const txPrice = toDecimal(p.transactionPrice ?? p.nav ?? p.amount);
  // Cost uses transactionPrice when present (not NAV alone)
  const amount = p.amount != null ? toDecimal(p.amount) : qty.times(txPrice);
  if (qty.isZero()) throw new Error("VALIDATION_ERROR:quantity");
  const currency = p.currency;
  const accountId = p.accountId || p.cashAccountId || null;
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("fund_inventory", currency);
  const holdingId = randomUUID();
  const txId = randomUUID();
  const now = new Date().toISOString();

  const journalLines = [
    {
      accountId: invId,
      side: "debit",
      amount: amount.toFixed(),
      currency,
      amountInBase: amount.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: amount.toFixed(),
      currency,
      amountInBase: amount.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];

  return runAtomicFinancialOperation({
    operationId,
    type: "funds.subscribe",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
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
        currency,
        displayName: "Fund investment",
      });

      db.prepare(
        `INSERT OR IGNORE INTO ref_instruments (
          id, asset_class, symbol, name, created_at, updated_at, is_active
        ) VALUES (?, 'fund', ?, ?, ?, ?, 1)`,
      ).run(p.instrumentId, p.symbol || "FUND", p.name || p.symbol || "FUND", now, now);

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
        p.transactionPrice || nav ? nav.toFixed() : null,
        amount.toFixed(),
        currency,
        accountId,
        now,
      );
    },
  });
}
