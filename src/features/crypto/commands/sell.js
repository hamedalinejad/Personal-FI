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
import { applySingleFee } from "../../../core/domain/fee/feeEngine.js";
import { openDb } from "../../../core/persistence/port.js";

/**
 * crypto.sell — WAC disposal (Model A cost pool).
 * Journal: Dr Cash (proceeds) / Cr Inventory (costReleased) / Cr or Dr PnL
 * Fee via Fee Engine.
 */
export async function sellCrypto(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "exchangeId", "quantity", "proceedsTotal", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }

  const qty = toDecimal(p.quantity);
  const proceeds = toDecimal(p.proceedsTotal);
  const proceedsCurrency = p.proceedsCurrency || p.costCurrency;
  const baseCurrency = p.currency || p.baseCurrency || proceedsCurrency;
  if (!proceedsCurrency) throw new Error("VALIDATION_ERROR:proceedsCurrency");

  let exchangeRateToBase =
    p.exchangeRateToBase != null ? toDecimal(p.exchangeRateToBase) : null;
  if (proceedsCurrency === baseCurrency) exchangeRateToBase = toDecimal("1");
  else if (exchangeRateToBase == null) throw new Error("VALIDATION_ERROR:exchangeRateToBase");

  const networkId = p.networkId || p.network_identifier || null;
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", proceedsCurrency);

  // Pre-read holding for cost currency & WAC
  const db0 = openDb(dataDir);
  let holding;
  if (networkId) {
    holding = db0
      .prepare(
        `SELECT * FROM inv_crypto_holdings
         WHERE instrument_id = ? AND exchange_id = ? AND network_id = ?`,
      )
      .get(p.instrumentId, p.exchangeId, networkId);
  } else {
    holding = db0
      .prepare(
        `SELECT * FROM inv_crypto_holdings
         WHERE instrument_id = ? AND exchange_id = ? AND network_id IS NULL`,
      )
      .get(p.instrumentId, p.exchangeId);
  }
  if (!holding) throw new Error("HOLDING_NOT_FOUND");
  const costCurrency = holding.cost_currency || proceedsCurrency;

  const disposal = applyDisposal(
    { quantity: holding.quantity, totalInvested: holding.total_invested },
    { quantity: qty.toFixed(), proceeds: proceeds.toFixed() },
  );

  const costReleased = toDecimal(disposal.costReleased);
  const realized = toDecimal(disposal.realizedPnl);
  const invId = scopedAccountId("crypto_inventory", costCurrency);
  const pnlId = scopedAccountId("crypto_realized_pnl", proceedsCurrency);

  const feeTreatment = p.feeTreatment || "expense";
  const feeResult = applySingleFee(
    p.feeAmount != null && p.feeAmount !== ""
      ? {
          feeAmount: p.feeAmount,
          feeCurrency: p.feeCurrency || proceedsCurrency,
          treatment: feeTreatment,
          feeExchangeRateToBase: p.feeExchangeRateToBase,
        }
      : null,
    {
      baseCurrency,
      transactionCurrency: proceedsCurrency,
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      cashAccountId: cashId,
    },
  );

  // Proceeds and cost may differ currency — for V1 require same currency pool as proceeds
  // or same costCurrency as proceedsCurrency for simple journal
  if (costCurrency !== proceedsCurrency) {
    throw new Error("CRYPTO_SELL_CURRENCY_MISMATCH:cost_pool_must_match_proceeds_v1");
  }

  const proceedsBase = proceeds.times(exchangeRateToBase);
  const costBase = costReleased.times(exchangeRateToBase);

  const journalLines = [
    {
      accountId: cashId,
      side: "debit",
      amount: proceeds.toFixed(),
      currency: proceedsCurrency,
      amountInBase: proceedsBase.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
    {
      accountId: invId,
      side: "credit",
      amount: costReleased.toFixed(),
      currency: costCurrency,
      amountInBase: costBase.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
  ];

  if (!realized.isZero()) {
    const gain = realized.gt(0);
    journalLines.push({
      accountId: pnlId,
      side: gain ? "credit" : "debit",
      amount: realized.abs().toFixed(),
      currency: proceedsCurrency,
      amountInBase: realized.abs().times(exchangeRateToBase).toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    });
  }

  journalLines.push(...feeResult.journalLines);

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    operationId,
    type: "crypto.sell",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    payload: { ...p, networkId, costReleased: disposal.costReleased, realizedPnl: disposal.realizedPnl },
    journalLines,
    domainResult: {
      holdingId: holding.id,
      transactionId: txId,
      quantity: qty.toFixed(),
      proceeds: proceeds.toFixed(),
      costReleased: disposal.costReleased,
      realizedPnl: disposal.realizedPnl,
      remainingQty: disposal.quantity,
      remainingInvested: disposal.totalInvested,
    },
    engineVersions: { crypto: "1.2.0", costBasis: "1.0.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, proceedsCurrency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "crypto",
        currency: costCurrency,
        displayName: "Crypto investment",
      });
      ensureAccount(db, {
        id: pnlId,
        name: `Crypto realized P&L (${proceedsCurrency})`,
        accountKind: realized.gte(0) ? "income" : "expense",
        currency: proceedsCurrency,
        systemRole: "crypto_realized_pnl",
      });

      // Re-check holding inside txn
      let h2;
      if (networkId) {
        h2 = db
          .prepare(
            `SELECT * FROM inv_crypto_holdings
             WHERE instrument_id = ? AND exchange_id = ? AND network_id = ?`,
          )
          .get(p.instrumentId, p.exchangeId, networkId);
      } else {
        h2 = db
          .prepare(
            `SELECT * FROM inv_crypto_holdings
             WHERE instrument_id = ? AND exchange_id = ? AND network_id IS NULL`,
          )
          .get(p.instrumentId, p.exchangeId);
      }
      if (!h2) throw new Error("HOLDING_NOT_FOUND");
      const d2 = applyDisposal(
        { quantity: h2.quantity, totalInvested: h2.total_invested },
        { quantity: qty.toFixed(), proceeds: proceeds.toFixed() },
      );

      db.prepare(
        `UPDATE inv_crypto_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
      ).run(d2.quantity, d2.totalInvested, now, h2.id);

      db.prepare(
        `INSERT INTO inv_crypto_transactions (
          id, operation_id, holding_id, instrument_id,
          tx_type, business_date, gross_quantity, fee_quantity, net_quantity,
          fee_currency, fee_instrument_id, economic_kind, created_at
        ) VALUES (?, ?, ?, ?, 'sell', ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        h2.id,
        p.instrumentId,
        p.businessDate,
        qty.toFixed(),
        p.feeAmount || "0",
        qty.toFixed(),
        p.feeCurrency || proceedsCurrency,
        p.feeInstrumentId || null,
        "disposal",
        now,
      );
    },
  });
}
