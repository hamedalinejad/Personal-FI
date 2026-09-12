import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  ensureAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { applyDisposal } from "../../../core/domain/costBasis/engine.js";
import { openDb } from "../../../core/persistence/port.js";

/**
 * stocks.sell — WAC disposal.
 * V1: proceeds create broker receivable (T+n mirror of buy payable) unless settleSameDay.
 * Position decreases on tradeDate.
 */
export async function sellStock(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "brokerageId", "quantity", "price", "currency", "tradeDate", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }

  const qty = toDecimal(p.quantity);
  const price = toDecimal(p.price);
  if (!qty.gt(0)) throw new Error("STOCK_QTY_NONPOSITIVE");
  if (!price.gt(0)) throw new Error("STOCK_PRICE_NONPOSITIVE");
  const currency = p.currency;
  const proceeds = qty.times(price);
  const commission = toDecimal(p.commission || "0");
  if (commission.isNegative()) throw new Error("STOCK_COMMISSION_NEGATIVE");
  const netProceeds = proceeds.minus(commission);
  if (netProceeds.lt(0)) throw new Error("VALIDATION_ERROR:commission");

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

  const db0 = openDb(dataDir);
  const holding = db0
    .prepare(
      `SELECT * FROM inv_stocks_iran_holdings WHERE instrument_id = ? AND brokerage_id = ?`,
    )
    .get(p.instrumentId, p.brokerageId);
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
      amountInBase: netProceeds.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: invId,
      side: "credit",
      amount: costReleased.toFixed(),
      currency,
      amountInBase: costReleased.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];
  if (!realized.isZero()) {
    journalLines.push({
      accountId: pnlId,
      side: realized.gt(0) ? "credit" : "debit",
      amount: realized.abs().toFixed(),
      currency,
      amountInBase: realized.abs().toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    });
  }
  // Commission expense if any
  if (commission.gt(0)) {
    const feeExp = scopedAccountId("stock_fee_expense", currency);
    journalLines.push(
      {
        accountId: feeExp,
        side: "debit",
        amount: commission.toFixed(),
        currency,
        amountInBase: commission.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "fee",
      },
      {
        accountId: receivableId,
        side: "credit",
        amount: commission.toFixed(),
        currency,
        amountInBase: commission.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "fee",
      },
    );
  }

  if (settleSameOp) {
    journalLines.push(
      {
        accountId: cashId,
        side: "debit",
        amount: netProceeds.toFixed(),
        currency,
        amountInBase: netProceeds.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "principal",
      },
      {
        accountId: receivableId,
        side: "credit",
        amount: netProceeds.toFixed(),
        currency,
        amountInBase: netProceeds.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "principal",
      },
    );
  }

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "stocks.sell",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
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
      if (commission.gt(0)) {
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
          `SELECT * FROM inv_stocks_iran_holdings WHERE instrument_id = ? AND brokerage_id = ?`,
        )
        .get(p.instrumentId, p.brokerageId);
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
          trade_date, settlement_date, quantity, price, fee_amount, currency, account_id, created_at
        ) VALUES (?, ?, ?, ?, ?, 'sell', ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        h2.id,
        p.instrumentId,
        p.brokerageId,
        tradeDate,
        settlementDate,
        qty.toFixed(),
        price.toFixed(),
        commission.toFixed(),
        currency,
        p.accountId || null,
        now,
      );
    },
  });
}
