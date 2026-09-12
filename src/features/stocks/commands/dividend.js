import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { resolveOrCreateInstrument } from "../../../core/domain/instrument/resolve.js";

/**
 * stocks.dividend — cash dividend; does not change quantity.
 * Dr Cash (or receivable) / Cr Dividend income
 */
export async function stockDividend(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "amount", "currency", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }

  const amount = toDecimal(p.amount);
  if (!amount.gt(0)) throw new Error("VALIDATION_ERROR:amount");
  const currency = p.currency;
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const incId = scopedAccountId("stock_dividend_income", currency);
  const tax = toDecimal(p.withholdingTax || "0");
  const net = amount.minus(tax);
  if (net.lt(0)) throw new Error("VALIDATION_ERROR:withholdingTax");

  const journalLines = [
    {
      accountId: cashId,
      side: "debit",
      amount: net.toFixed(),
      currency,
      amountInBase: net.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: incId,
      side: "credit",
      amount: amount.toFixed(),
      currency,
      amountInBase: amount.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];
  if (tax.gt(0)) {
    const taxId = scopedAccountId("stock_withholding_tax", currency);
    journalLines.push({
      accountId: taxId,
      side: "debit",
      amount: tax.toFixed(),
      currency,
      amountInBase: tax.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "fee",
    });
  }

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    operationId,
    type: "stocks.dividend",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: p,
    journalLines,
    domainResult: {
      transactionId: txId,
      gross: amount.toFixed(),
      net: net.toFixed(),
      withholdingTax: tax.toFixed(),
    },
    engineVersions: { stocks: "1.4.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      if (p.symbol) {
        resolveOrCreateInstrument(db, {
          instrumentId: p.instrumentId,
          assetClass: "stock",
          symbol: p.symbol,
          name: p.name || p.symbol,
          now,
        });
      }
      ensureAccount(db, {
        id: incId,
        name: `Stock dividend income (${currency})`,
        accountKind: "income",
        currency,
        systemRole: "stock_dividend_income",
      });
      if (tax.gt(0)) {
        ensureAccount(db, {
          id: scopedAccountId("stock_withholding_tax", currency),
          name: `Withholding tax (${currency})`,
          accountKind: "expense",
          currency,
          systemRole: "stock_withholding_tax",
        });
      }
      db.prepare(
        `INSERT INTO inv_stocks_iran_transactions (
          id, operation_id, holding_id, instrument_id, brokerage_id, tx_type,
          trade_date, settlement_date, quantity, price, fee_amount, currency, account_id, created_at
        ) VALUES (?, ?, NULL, ?, ?, 'dividend', ?, ?, '0', '0', ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        p.instrumentId,
        p.brokerageId || null,
        p.businessDate,
        p.businessDate,
        tax.toFixed(),
        currency,
        p.accountId || null,
        now,
      );
    },
  });
}
