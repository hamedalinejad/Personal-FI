import { resolveBookBaseCurrency, requireFxIfCrossCurrency } from "../../../core/accounting/bookSettings.js";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  ensureAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { assertPositive } from "../../../core/domain/validation/positiveMoney.js";
import { applyDisposal } from "../../../core/domain/costBasis/engine.js";
import { openDb } from "../../../core/persistence/port.js";

/**
 * funds.redeem — units out at transactionPrice (not NAV for cost release WAC).
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
  assertPositive(p.units, "FUND_UNITS_NONPOSITIVE");
  if (p.transactionPrice != null && p.transactionPrice !== "") {
    assertPositive(p.transactionPrice, "FUND_PRICE_NONPOSITIVE");
  }
  const currency = p.currency;
  // C0-FIN-03: redemption currency must match holding cost currency (no invented conversion)
  // C0-FIN-01: book base + FX
  const baseCurrency = resolveBookBaseCurrency({ dataDir, explicitBaseCurrency: p.baseCurrency || null, transactionCurrency: currency });
  let exchangeRateToBase = p.exchangeRateToBase != null ? toDecimal(p.exchangeRateToBase) : null;
  if (currency === baseCurrency) {
    exchangeRateToBase = toDecimal("1");
  } else if (exchangeRateToBase == null) {
    throw new Error("VALIDATION_ERROR:exchangeRateToBase");
  }
  const toBase = (amt) => toDecimal(amt?.toFixed ? amt.toFixed() : String(amt)).times(toDecimal(exchangeRateToBase.toFixed ? exchangeRateToBase.toFixed() : String(exchangeRateToBase))).toFixed();

  // BUG-001: if both supplied, they must agree (units × transactionPrice)
  let proceeds;
  if (p.proceedsTotal != null && p.proceedsTotal !== "" && p.transactionPrice != null && p.transactionPrice !== "") {
    const derived = units.times(toDecimal(p.transactionPrice));
    proceeds = toDecimal(p.proceedsTotal);
    if (!proceeds.eq(derived)) {
      throw new Error("AMOUNT_PRICE_MISMATCH");
    }
  } else if (p.proceedsTotal != null && p.proceedsTotal !== "") {
    proceeds = toDecimal(p.proceedsTotal);
  } else {
    proceeds = units.times(toDecimal(p.transactionPrice));
  }
  assertPositive(proceeds.toFixed(), "FUND_PROCEEDS_NONPOSITIVE");
  assertPositive(proceeds.toFixed(), "FUND_PROCEEDS_NONPOSITIVE");

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
    const rows = db0
      .prepare(`SELECT * FROM inv_fif_holdings WHERE instrument_id = ?`)
      .all(p.instrumentId);
    if (rows.length > 1) {
      throw new Error("HOLDING_AMBIGUOUS:accountId_required");
    }
    holding = rows[0];
  }
  if (!holding) throw new Error("HOLDING_NOT_FOUND");
  if (holding.cost_currency && holding.cost_currency !== currency) {
    throw new Error("HOLDING_CURRENCY_MISMATCH");
  }

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
      amountInBase: toBase(proceeds),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
    {
      accountId: invId,
      side: "credit",
      amount: costReleased.toFixed(),
      currency,
      amountInBase: toBase(costReleased),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
  ];
  if (!realized.isZero()) {
    journalLines.push({
      accountId: pnlId,
      side: realized.gt(0) ? "credit" : "debit",
      amount: realized.abs().toFixed(),
      currency,
      amountInBase: toBase(realized.abs()),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    });
  }

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "funds.redeem",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: baseCurrency,
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
        const rows2 = db.prepare(`SELECT * FROM inv_fif_holdings WHERE instrument_id = ?`).all(p.instrumentId);
        if (rows2.length > 1) throw new Error("HOLDING_AMBIGUOUS:accountId_required");
        h2 = rows2[0];
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
