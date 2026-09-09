import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { openDb } from "../../../core/persistence/worker.js";

/**
 * crypto.buy v1
 * fee_from_received: net = gross - fee
 */
export async function buyCrypto(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of [
    "instrumentId",
    "grossQuantity",
    "netQuantity",
    "costTotal",
    "costCurrency",
    "businessDate",
    "currency",
    "feeRole",
    "price",
    "priceAsOf",
    "exchangeId",
  ]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }

  const gross = toDecimal(p.grossQuantity);
  const fee = toDecimal(p.feeQuantity || "0");
  const net = toDecimal(p.netQuantity);
  if (p.feeRole === "fee_from_received" || p.feeRole === "feeBurnQuantity") {
    if (!gross.minus(fee).eq(net)) throw new Error("INV_QTY_CONSERVATION");
  }

  bootstrapLoanEditionAccounts(dataDir, p.currency);
  const cashId = p.cashAccountId || "LOC-CASH";
  const invId = "CRYPTO-INV";
  const now = new Date().toISOString();
  const db0 = openDb(dataDir);
  db0.prepare(
    `INSERT OR IGNORE INTO fin_accounts (
      id, name, account_kind, currency, is_archived, created_at, updated_at, status, role
    ) VALUES (?, 'Crypto investment', 'asset', ?, 0, ?, ?, 'active', 'crypto_inventory')`,
  ).run(invId, p.currency, now, now);

  // exchange + instrument bootstrap
  db0.prepare(
    `INSERT OR IGNORE INTO inv_crypto_exchanges (id, name, created_at) VALUES (?, ?, ?)`,
  ).run(p.exchangeId, p.exchangeName || p.exchangeId, now);
  db0.prepare(
    `INSERT OR IGNORE INTO ref_instruments (
      id, asset_class, symbol, name, created_at, updated_at, is_active
    ) VALUES (?, 'crypto', ?, ?, ?, ?, 1)`,
  ).run(p.instrumentId, p.symbol || "ASSET", p.symbol || "ASSET", now, now);

  const cost = toDecimal(p.costTotal);
  const journalLines = [
    {
      accountId: invId,
      side: "debit",
      amount: cost.toFixed(),
      currency: p.costCurrency,
      amountInBase: cost.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: cost.toFixed(),
      currency: p.costCurrency,
      amountInBase: cost.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];

  const holdingId = randomUUID();
  const txId = randomUUID();

  return runAtomicFinancialOperation({
    operationId,
    type: "crypto.buy",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: p.currency,
    payload: p,
    journalLines,
    domainResult: {
      holdingId,
      txId,
      instrumentId: p.instrumentId,
      netQuantity: p.netQuantity,
    },
    engineVersions: { costBasis: "1.0.0-weighted_average", money: "1.0.0" },
    withinTransaction(db) {
      const row = db
        .prepare(
          `SELECT * FROM inv_crypto_holdings
           WHERE instrument_id = ? AND exchange_id = ? AND network_id IS NULL`,
        )
        .get(p.instrumentId, p.exchangeId);

      let hid = holdingId;
      if (!row) {
        db.prepare(
          `INSERT INTO inv_crypto_holdings (
            id, exchange_id, network_id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at
          ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
        ).run(
          holdingId,
          p.exchangeId,
          p.instrumentId,
          p.netQuantity,
          p.costTotal,
          p.costCurrency,
          now,
          now,
        );
      } else {
        hid = row.id;
        const newQty = toDecimal(row.quantity).plus(net);
        const newCost = toDecimal(row.total_invested).plus(cost);
        db.prepare(
          `UPDATE inv_crypto_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
        ).run(newQty.toFixed(), newCost.toFixed(), now, row.id);
      }

      db.prepare(
        `INSERT INTO inv_crypto_transactions (
          id, operation_id, holding_id, instrument_id, tx_type, business_date,
          gross_quantity, fee_quantity, net_quantity, economic_kind, created_at
        ) VALUES (?, ?, ?, ?, 'buy', ?, ?, ?, ?, 'acquisition', ?)`,
      ).run(
        txId,
        operationId,
        hid,
        p.instrumentId,
        p.businessDate,
        p.grossQuantity,
        p.feeQuantity || "0",
        p.netQuantity,
        now,
      );
    },
  });
}
