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
 * fund.redeem — units out at transactionPrice (not NAV for cost release WAC).
 * proceeds = units * transactionPrice (or explicit proceedsTotal).
 */
export async function redeemFund(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "units", "currency", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  if (p.transactionPrice == null && p.proceedsTotal == null) {
    throw new Error("VALIDATION_ERROR:transactionPrice_or_proceedsTotal");
  }

  const units = toDecimal(p.units);
  const currency = p.currency;
  const proceeds =
    p.proceedsTotal != null
      ? toDecimal(p.proceedsTotal)
      : units.times(toDecimal(p.transactionPrice));

  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("fund_inventory", currency);
  const pnlId = scopedAccountId("fund_realized_pnl", currency);

  const db0 = openDb(dataDir);
  let holding;
  if (p.accountId) {
    holding = db0
      .prepare(
        `SELECT * FROM inv_fif_holdings WHERE instrument_id = ? AND account_id = ?`,
      )
      .get(p.instrumentId, p.accountId);
  } else {
    holding = db0
      .prepare(`SELECT * FROM inv_fif_holdings WHERE instrument_id = ?`)
      .get(p.instrumentId);
  }
  if (!holding) throw new Error("HOLDING_NOT_FOUND");

  const disposal = applyDisposal(
    { quantity: holding.quantity, totalInvested: holding.total_invested },
    { quantity: units.toFixed(), proceeds: proceeds.toFixed() },
  );

  const costReleased = toDecimal(disposal.costReleased);
  const realized = toDecimal(disposal.realizedPnl);

  const journalLines = [
    {
      accountId: cashId,
      side: "debit",
      amount: proceeds.toFixed(),
      currency,
      amountInBase: proceeds.toFixed(),
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

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "fund.redeem",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: p,
    journalLines,
    domainResult: {
      holdingId: holding.id,
      transactionId: txId,
      units: units.toFixed(),
      proceeds: proceeds.toFixed(),
      costReleased: disposal.costReleased,
      realizedPnl: disposal.realizedPnl,
      transactionPrice: p.transactionPrice || null,
      nav: p.nav || null,
    },
    engineVersions: { funds: "1.2.0", costBasis: "1.0.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "fund",
        currency,
        displayName: "Fund investment",
      });
      ensureAccount(db, {
        id: pnlId,
        name: `Fund realized P&L (${currency})`,
        accountKind: "income",
        currency,
        systemRole: "fund_realized_pnl",
      });

      let h2;
      if (p.accountId) {
        h2 = db
          .prepare(
            `SELECT * FROM inv_fif_holdings WHERE instrument_id = ? AND account_id = ?`,
          )
          .get(p.instrumentId, p.accountId);
      } else {
        h2 = db.prepare(`SELECT * FROM inv_fif_holdings WHERE instrument_id = ?`).get(p.instrumentId);
      }
      if (!h2) throw new Error("HOLDING_NOT_FOUND");
      const d2 = applyDisposal(
        { quantity: h2.quantity, totalInvested: h2.total_invested },
        { quantity: units.toFixed(), proceeds: proceeds.toFixed() },
      );

      db.prepare(
        `UPDATE inv_fif_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
      ).run(d2.quantity, d2.totalInvested, now, h2.id);

      db.prepare(
        `INSERT INTO inv_fif_transactions (
          id, operation_id, instrument_id, tx_type,
          trade_date, quantity, transaction_price, nav, amount, currency, account_id, created_at
        ) VALUES (?, ?, ?, 'redeem', ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        p.instrumentId,
        p.businessDate,
        units.toFixed(),
        p.transactionPrice || null,
        p.nav || null,
        proceeds.toFixed(),
        currency,
        p.accountId || null,
        now,
      );
    },
  });
}
