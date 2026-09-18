import { resolveBookBaseCurrency, requireFxIfCrossCurrency } from "../../../core/accounting/bookSettings.js";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureAccount,
  ensureLocalSettlementAccounts,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { openDb } from "../../../core/persistence/port.js";

/**
 * Journal balance of an account from posted lines only (Decimal).
 */
function accountBalance(db, accountId) {
  const rows = db
    .prepare(
      `SELECT jl.side, jl.amount_in_base, jl.amount
       FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       JOIN fin_operations o ON o.id = je.operation_id
       WHERE jl.account_id = ? AND o.status = 'posted'`,
    )
    .all(accountId);
  let bal = toDecimal("0");
  for (const r of rows) {
    if (r.amount_in_base == null || r.amount_in_base === "") {
      throw new Error("SETTLE_MISSING_AMOUNT_IN_BASE");
    }
    const a = toDecimal(r.amount_in_base);
    bal = r.side === "debit" ? bal.plus(a) : bal.minus(a);
  }
  return bal;
}

/**
 * stocks.settle — settle broker payable (buy) or receivable (sell).
 *
 * BUG-FINAL-033/034/035:
 * - Supports stocks.buy and stocks.sell original trades
 * - Outstanding from journal truth on broker account
 * - Prior settlement from relational inv_stocks_iran_transactions settle rows + operations link
 */
export async function settleStock(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;
  // alias: relatedOperationId → originalTradeOperationId
  if (!p.originalTradeOperationId && p.relatedOperationId) {
    p.originalTradeOperationId = p.relatedOperationId;
  }


  if (!p.originalTradeOperationId) throw new Error("VALIDATION_ERROR:originalTradeOperationId");
  if (!p.businessDate) throw new Error("VALIDATION_ERROR:businessDate");

  const settlementDate = p.settlementDate || p.businessDate;
  const db0 = openDb(dataDir);

  const tradeOp = db0
    .prepare(`SELECT * FROM fin_operations WHERE id = ?`)
    .get(p.originalTradeOperationId);
  if (!tradeOp) throw new Error("TRADE_OP_NOT_FOUND");
  if (tradeOp.status !== "posted") throw new Error("TRADE_OP_NOT_POSTED");
  if (tradeOp.operation_type !== "stocks.buy" && tradeOp.operation_type !== "stocks.sell") {
    throw new Error("TRADE_OP_TYPE");
  }

  const side = tradeOp.operation_type === "stocks.buy" ? "buy" : "sell";
  const tradeTx = db0
    .prepare(
      `SELECT * FROM inv_stocks_iran_transactions WHERE operation_id = ? AND tx_type = ?`,
    )
    .get(p.originalTradeOperationId, side);
  if (!tradeTx) throw new Error("TRADE_TX_NOT_FOUND");

  // relational prior settlement — settle tx linked to original op
  const priorSettle = db0
    .prepare(
      `SELECT t.id FROM inv_stocks_iran_transactions t
       JOIN fin_operations o ON o.id = t.operation_id
       WHERE t.tx_type = 'settlement' AND o.status = 'posted'
         AND t.related_operation_id = ?`,
    )
    .get(p.originalTradeOperationId);
  // Locked schema: prior settlement only via related_operation_id (no source_reference fallback)
  if (priorSettle) throw new Error("ALREADY_SETTLED");

  const currency = p.currency || tradeTx.currency;
  const brokerageId = p.brokerageId || tradeTx.brokerage_id;
  const brokerAccountId =
    p.brokerAccountId ||
    (side === "buy"
      ? scopedAccountId(`broker_payable_${brokerageId}`, currency)
      : scopedAccountId(`broker_receivable_${brokerageId}`, currency));
  const resolvedCashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);

  // outstanding from journal
  const bal = accountBalance(db0, brokerAccountId);
  // buy payable: credit-normal → balance negative; outstanding = -bal
  // sell receivable: debit-normal → balance positive; outstanding = bal
  let outstanding = side === "buy" ? bal.neg() : bal;
  if (outstanding.lte(0)) {
    throw new Error("SETTLE_NOTHING_OUTSTANDING");
  }

  let amount = p.amount != null ? toDecimal(p.amount) : outstanding;
  if (!amount.gt(0)) throw new Error("SETTLE_AMOUNT_POSITIVE");
  if (amount.gt(outstanding)) throw new Error("SETTLE_AMOUNT_EXCEEDS_OUTSTANDING");

  const partial = amount.lt(outstanding);
  if (partial && p.allowPartialSettlement !== true) {
    throw new Error("SETTLE_PARTIAL_REQUIRES_FLAG");
  }
  if (!partial && !amount.eq(outstanding) && p.amount != null) {
    throw new Error("SETTLE_AMOUNT_MISMATCH");
  }

  if (tradeTx.settlement_date && settlementDate < tradeTx.settlement_date && p.allowEarlySettlement !== true) {
    throw new Error("SETTLEMENT_BEFORE_CONTRACT_DATE");
  }

  const settleTxId = randomUUID();
  const amt = amount.toFixed();
  const now = new Date().toISOString();

  // Book base from trade op / book settings — never force txn currency as base
  const baseCurrency = resolveBookBaseCurrency({
    dataDir,
    explicitBaseCurrency: p.baseCurrency || tradeOp.base_currency || null,
    transactionCurrency: currency,
  });
  const exchangeRateToBase = requireFxIfCrossCurrency({
    transactionCurrency: currency,
    baseCurrency,
    exchangeRateToBase:
      p.exchangeRateToBase ||
      p.settlementExchangeRateToBase ||
      tradeOp.exchange_rate_to_base ||
      null,
  });
  const amountInBase = toDecimal(amt).times(toDecimal(exchangeRateToBase)).toFixed();

  // Buy: Dr payable / Cr cash. Sell: Dr cash / Cr receivable. (txn currency legs + base amounts)
  const journalLines =
    side === "buy"
      ? [
          {
            accountId: brokerAccountId,
            side: "debit",
            amount: amt,
            currency,
            amountInBase,
            exchangeRateToBase,
            lineKind: "principal",
          },
          {
            accountId: resolvedCashId,
            side: "credit",
            amount: amt,
            currency,
            amountInBase,
            exchangeRateToBase,
            lineKind: "principal",
          },
        ]
      : [
          {
            accountId: resolvedCashId,
            side: "debit",
            amount: amt,
            currency,
            amountInBase,
            exchangeRateToBase,
            lineKind: "principal",
          },
          {
            accountId: brokerAccountId,
            side: "credit",
            amount: amt,
            currency,
            amountInBase,
            exchangeRateToBase,
            lineKind: "principal",
          },
        ];

  return runAtomicFinancialOperation({
    status: "posted",
    operationId,
    type: "stocks.settle",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    sourceReference: p.originalTradeOperationId,
    sourceType: "settlement",
    sourceChannel: "api",
    payload: {
      ...p,
      currency,
      brokerageId,
      amount: amt,
      settlementDate,
      originalTradeOperationId: p.originalTradeOperationId,
      tradeSide: side,
      partial,
      outstandingBefore: outstanding.toFixed(),
    },
    journalLines,
    domainResult: {
      originalTradeOperationId: p.originalTradeOperationId,
      tradeSide: side,
      settlementDate,
      amount: amt,
      partial,
      fullSettlement: !partial,
      settlementStatus: partial ? "partially_settled" : "settled",
      settleTransactionId: settleTxId,
    },
    engineVersions: { stocks: "1.2.0", settlement: "1.1.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureAccount(db, {
        id: brokerAccountId,
        name: side === "buy" ? `Broker payable ${brokerageId}` : `Broker receivable ${brokerageId}`,
        accountKind: side === "buy" ? "liability" : "asset",
        currency,
      });
      ensureAccount(db, {
        id: resolvedCashId,
        name: "Local settlement cash",
        accountKind: "asset",
        currency,
        systemRole: "cash",
      });

      // Locked schema contract: related_operation_id + settlement tx_type always present
      db.prepare(
        `INSERT INTO inv_stocks_iran_transactions (
          id, operation_id, brokerage_id, instrument_id, tx_type, trade_date, settlement_date,
          cash_date, market_date, price_as_of, fx_as_of, settlement_policy_version,
          quantity, price, currency, related_operation_id, created_at
        ) VALUES (?, ?, ?, ?, 'settlement', ?, ?, ?, ?, ?, ?, ?, '0', '0', ?, ?, ?)`,
      ).run(
        settleTxId,
        operationId,
        brokerageId,
        tradeTx.instrument_id,
        p.businessDate,
        settlementDate,
        p.cashDate || settlementDate || p.businessDate,
        p.marketDate || p.businessDate,
        p.priceAsOf || null,
        p.fxAsOf || null,
        p.settlementPolicyVersion || tradeTx.settlement_policy_version || null,
        currency,
        p.originalTradeOperationId,
        now,
      );
    },
  });
}
