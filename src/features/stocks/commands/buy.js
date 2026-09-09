import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { openDb } from "../../../core/persistence/worker.js";

/** stocks.buy — tradeDate and settlementDate kept distinct */
export async function buyStock(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;
  for (const k of [
    "instrumentId",
    "quantity",
    "price",
    "tradeDate",
    "settlementDate",
    "currency",
    "brokerageId",
  ]) {
    if (!p[k]) throw new Error(`VALIDATION_ERROR:${k}`);
  }
  if (p.tradeDate === p.settlementDate) {
    // allowed but discouraged; still accept — do not collapse fields
  }
  const qty = toDecimal(p.quantity);
  const price = toDecimal(p.price);
  const commission = toDecimal(p.commission || "0");
  const tax = toDecimal(p.tax || "0");
  const other = toDecimal(p.otherFee || "0");
  const gross = qty.times(price);
  const total = gross.plus(commission).plus(tax).plus(other);
  const now = new Date().toISOString();

  bootstrapLoanEditionAccounts(dataDir, p.currency);
  const cashId = p.cashAccountId || "LOC-CASH";
  const stockAcc = "STOCK-INV";
  const db0 = openDb(dataDir);
  db0.prepare(
    `INSERT OR IGNORE INTO fin_accounts (
      id, name, account_kind, currency, is_archived, created_at, updated_at, status, role
    ) VALUES (?, 'Stock investment', 'asset', ?, 0, ?, ?, 'active', 'stock_inventory')`,
  ).run(stockAcc, p.currency, now, now);
    db0.prepare(
    `INSERT OR IGNORE INTO inv_stocks_iran_brokerages (id, name, created_at) VALUES (?, ?, ?)`,
  ).run(p.brokerageId, p.brokerageName || p.brokerageId, now);
  db0.prepare(
    `INSERT OR IGNORE INTO ref_instruments (
      id, asset_class, symbol, name, isin, created_at, updated_at, is_active
    ) VALUES (?, 'stock', ?, ?, ?, ?, ?, 1)`,
  ).run(p.instrumentId, p.symbol || "SYM", p.symbol || "SYM", p.isin || null, now, now);

  const journalLines = [
    {
      accountId: stockAcc,
      side: "debit",
      amount: total.toFixed(),
      currency: p.currency,
      amountInBase: total.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: total.toFixed(),
      currency: p.currency,
      amountInBase: total.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];

  const holdingId = randomUUID();
  return runAtomicFinancialOperation({
    operationId,
    type: "stocks.buy",
    dataDir,
    businessDate: p.tradeDate,
    baseCurrency: p.currency,
    payload: p,
    journalLines,
    domainResult: {
      tradeDate: p.tradeDate,
      settlementDate: p.settlementDate,
      total: total.toFixed(),
      holdingId,
    },
    engineVersions: { stocks: "1.0.0", money: "1.0.0" },
    withinTransaction(db) {
      try {
        db.prepare(
          `INSERT INTO inv_stocks_iran_holdings (
            id, instrument_id, brokerage_id, quantity, total_invested, cost_currency, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          holdingId,
          p.instrumentId,
          p.brokerageId,
          p.quantity,
          total.toFixed(),
          p.currency,
          now,
          now,
        );
      } catch (e) {
        // if unique conflict, accumulate
        const row = db
          .prepare(
            `SELECT * FROM inv_stocks_iran_holdings WHERE instrument_id = ? AND brokerage_id = ?`,
          )
          .get(p.instrumentId, p.brokerageId);
        if (row) {
          const q = toDecimal(row.quantity).plus(qty);
          const c = toDecimal(row.total_invested).plus(total);
          db.prepare(
            `UPDATE inv_stocks_iran_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
          ).run(q.toFixed(), c.toFixed(), now, row.id);
        } else {
          throw e;
        }
      }
    },
  });
}
