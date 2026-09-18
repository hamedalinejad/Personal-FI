import { resolveBookBaseCurrency, requireFxIfCrossCurrency } from "../../../core/accounting/bookSettings.js";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { resolveOrCreateInstrument } from "../../../core/domain/instrument/resolve.js";

/** funds.distribute — cash distribution only (v1). reinvest = DEFERRED/REJECTED. */
export async function distributeFund(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input
  if (p.reinvest != null && p.reinvest !== false && p.reinvest !== 0 && p.reinvest !== "0") {
    throw new Error("REINVEST_DEFERRED");
  };

  for (const k of ["instrumentId", "amount", "currency", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  const amount = toDecimal(p.amount);
  if (!amount.gt(0)) throw new Error("VALIDATION_ERROR:amount");
  const currency = p.currency;
  const baseCurrency = resolveBookBaseCurrency({ dataDir, explicitBaseCurrency: p.baseCurrency || null, transactionCurrency: currency });
  let exchangeRateToBase = p.exchangeRateToBase != null ? toDecimal(p.exchangeRateToBase) : null;
  if (currency === baseCurrency) exchangeRateToBase = toDecimal("1");
  else if (exchangeRateToBase == null) throw new Error("VALIDATION_ERROR:exchangeRateToBase");
  const toBase = (amt) => toDecimal(amt?.toFixed ? amt.toFixed() : String(amt)).times(exchangeRateToBase).toFixed();

  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const incId = scopedAccountId("fund_distribution_income", currency);

  const journalLines = [
    {
      accountId: cashId,
      side: "debit",
      amount: amount.toFixed(),
      currency,
      amountInBase: amount.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
    {
      accountId: incId,
      side: "credit",
      amount: amount.toFixed(),
      currency,
      amountInBase: amount.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
  ];

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "funds.distribute",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: baseCurrency,
    payload: p,
    journalLines,
    domainResult: { transactionId: txId, amount: amount.toFixed() },
    engineVersions: { funds: "1.3.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      resolveOrCreateInstrument(db, {
        instrumentId: p.instrumentId,
        assetClass: "fund",
        symbol: p.symbol || p.instrumentId,
        name: p.name || p.symbol || p.instrumentId,
        now,
      });
      ensureAccount(db, {
        id: incId,
        name: `Fund distribution income (${currency})`,
        accountKind: "income",
        currency,
        systemRole: "fund_distribution_income",
      });
      db.prepare(
        `INSERT INTO inv_fif_transactions (
          id, operation_id, instrument_id, tx_type, trade_date, quantity, amount, currency, created_at
        ) VALUES (?, ?, ?, 'distribution', ?, '0', ?, ?, ?)`,
      ).run(txId, operationId, p.instrumentId, p.businessDate, amount.toFixed(), currency, now);
    },
  });
}
