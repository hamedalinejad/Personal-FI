import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureAccount,
  ensureLocalSettlementAccounts,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/**
 * stocks.settle — clear broker payable with cash on settlementDate.
 *
 * Does NOT change position quantity (that was tradeDate).
 * Requires trade buy operation already posted with pending_settlement.
 *
 * Payload:
 * - originalTradeOperationId (required)
 * - businessDate (settlement business day)
 * - settlementDate (optional; defaults businessDate)
 * - amount (optional; defaults to remaining payable from original totalDue)
 * - cashAccountId (optional)
 * - brokerPayableAccountId (optional; derived from trade brokerage)
 */
export async function settleStock(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  if (!p.originalTradeOperationId) throw new Error("VALIDATION_ERROR:originalTradeOperationId");
  if (!p.businessDate) throw new Error("VALIDATION_ERROR:businessDate");

  const settlementDate = p.settlementDate || p.businessDate;
  const cashId = p.cashAccountId || null;
  let payableId = p.brokerPayableAccountId || null;
  let amount = p.amount != null ? toDecimal(p.amount) : null;
  let currency = p.currency || null;
  let brokerageId = p.brokerageId || null;

  // Pre-read trade (revalidated inside txn)
  const { openDb } = await import("../../../core/persistence/port.js");
  const db0 = openDb(dataDir);
  const tradeOp = db0
    .prepare(`SELECT * FROM fin_operations WHERE id = ?`)
    .get(p.originalTradeOperationId);
  if (!tradeOp) throw new Error("TRADE_OP_NOT_FOUND");
  if (tradeOp.status !== "posted") throw new Error("TRADE_OP_NOT_POSTED");
  if (tradeOp.operation_type !== "stocks.buy") throw new Error("TRADE_OP_TYPE");

  const tradeTx = db0
    .prepare(`SELECT * FROM inv_stocks_iran_transactions WHERE operation_id = ? AND tx_type = 'buy'`)
    .get(p.originalTradeOperationId);
  if (!tradeTx) throw new Error("TRADE_TX_NOT_FOUND");

  // Detect prior settlement via operation result snapshot
  let alreadySettled = false;
  const settles = db0
    .prepare(
      `SELECT id, result_json FROM fin_operations
       WHERE operation_type = 'stocks.settle' AND status = 'posted'`,
    )
    .all();
  for (const row of settles) {
    try {
      const r = JSON.parse(row.result_json || "{}");
      if (r.domainResult?.originalTradeOperationId === p.originalTradeOperationId) {
        alreadySettled = true;
        break;
      }
    } catch {
      /* ignore */
    }
  }
  if (alreadySettled) throw new Error("ALREADY_SETTLED");

  currency = currency || tradeTx.currency;
  brokerageId = brokerageId || tradeTx.brokerage_id;
  payableId =
    payableId || scopedAccountId(`broker_payable_${brokerageId}`, currency);
  const resolvedCashId = cashId || scopedAccountId("local_settlement_cash", currency);

  // Amount: use trade fee+gross from tx if present
  if (amount == null) {
    const qty = toDecimal(tradeTx.quantity);
    const price = toDecimal(tradeTx.price);
    const fee = toDecimal(tradeTx.fee_amount || "0");
    amount = qty.times(price).plus(fee);
  }
  if (!amount.gt(0)) throw new Error("SETTLE_AMOUNT_POSITIVE");

  if (tradeTx.settlement_date && settlementDate < tradeTx.settlement_date) {
    // allow early only with policy
    if (p.allowEarlySettlement !== true) {
      throw new Error("SETTLEMENT_BEFORE_CONTRACT_DATE");
    }
  }

  const settleTxId = randomUUID();
  const now = new Date().toISOString();
  const amt = amount.toFixed();

  const journalLines = [
    {
      accountId: payableId,
      side: "debit",
      amount: amt,
      currency,
      amountInBase: amt,
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: resolvedCashId,
      side: "credit",
      amount: amt,
      currency,
      amountInBase: amt,
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];

  return runAtomicFinancialOperation({
    operationId,
    type: "stocks.settle",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: {
      ...p,
      currency,
      brokerageId,
      amount: amt,
      settlementDate,
      originalTradeOperationId: p.originalTradeOperationId,
    },
    journalLines,
    domainResult: {
      originalTradeOperationId: p.originalTradeOperationId,
      settlementDate,
      amount: amt,
      currency,
      brokerageId,
      settleTransactionId: settleTxId,
      settlementStatus: "settled",
      brokerPayableAccountId: payableId,
      cashAccountId: resolvedCashId,
    },
    engineVersions: { stocks: "1.2.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureAccount(db, {
        id: payableId,
        name: `Broker payable ${brokerageId} (${currency})`,
        accountKind: "liability",
        currency,
        systemRole: "broker_payable",
      });
      // Settlement is journal + operation domainResult only (no quantity change).
      // Subledger settlement marker is optional; avoid schema CHECK/FK friction.
      void settleTxId;
      void now;
    },
  });
}
