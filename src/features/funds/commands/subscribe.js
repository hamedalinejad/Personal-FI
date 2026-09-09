import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { openDb } from "../../../core/persistence/worker.js";

/**
 * fund.subscribe — cost uses transactionPrice (not NAV)
 */
export async function subscribeFund(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;
  for (const k of ["instrumentId", "units", "transactionPrice", "nav", "businessDate", "currency"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  // NAV != transactionPrice allowed
  const units = toDecimal(p.units);
  const txPrice = toDecimal(p.transactionPrice);
  const cost = units.times(txPrice);
  const now = new Date().toISOString();

  bootstrapLoanEditionAccounts(dataDir, p.currency);
  const cashId = p.cashAccountId || "LOC-CASH";
  const fundAcc = "FUND-INV";
  const db0 = openDb(dataDir);
  db0.prepare(
    `INSERT OR IGNORE INTO fin_accounts (
      id, name, account_kind, currency, is_archived, created_at, updated_at, status, role
    ) VALUES (?, 'Fund investment', 'asset', ?, 0, ?, ?, 'active', 'fund_inventory')`,
  ).run(fundAcc, p.currency, now, now);
  db0.prepare(
    `INSERT OR IGNORE INTO ref_instruments (
      id, asset_class, symbol, name, created_at, updated_at, is_active
    ) VALUES (?, 'fund', ?, ?, ?, ?, 1)`,
  ).run(p.instrumentId, p.symbol || "FUND", p.symbol || "FUND", now, now);

  const journalLines = [
    {
      accountId: fundAcc,
      side: "debit",
      amount: cost.toFixed(),
      currency: p.currency,
      amountInBase: cost.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: cost.toFixed(),
      currency: p.currency,
      amountInBase: cost.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];

  const holdingId = randomUUID();
  const txId = randomUUID();

  return runAtomicFinancialOperation({
    operationId,
    type: "fund.subscribe",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: p.currency,
    payload: {
      ...p,
      nav: p.nav,
      transactionPrice: p.transactionPrice,
      cost: cost.toFixed(),
    },
    journalLines,
    domainResult: { holdingId, txId, cost: cost.toFixed(), nav: p.nav, transactionPrice: p.transactionPrice },
    engineVersions: { funds: "1.0.0", money: "1.0.0" },
    withinTransaction(db) {
      const row = db
        .prepare(`SELECT * FROM inv_fif_holdings WHERE instrument_id = ?`)
        .get(p.instrumentId);
      if (!row) {
        db.prepare(
          `INSERT INTO inv_fif_holdings (
            id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(holdingId, p.instrumentId, p.units, cost.toFixed(), p.currency, now, now);
      } else {
        const q = toDecimal(row.quantity).plus(units);
        const c = toDecimal(row.total_invested).plus(cost);
        db.prepare(
          `UPDATE inv_fif_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
        ).run(q.toFixed(), c.toFixed(), now, row.id);
      }
      db.prepare(
        `INSERT INTO inv_fif_transactions (
          id, operation_id, instrument_id, tx_type, trade_date, quantity, transaction_price, nav, amount, currency, created_at
        ) VALUES (?, ?, ?, 'subscribe', ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        p.instrumentId,
        p.businessDate,
        p.units,
        p.transactionPrice,
        p.nav,
        cost.toFixed(),
        p.currency,
        now,
      );
    },
  });
}
