import { resolveBookBaseCurrency, requireFxIfCrossCurrency, resolveBaseAmountSync } from "../../../core/accounting/bookSettings.js";
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

function resolveMetalsHolding(db, p) {
  if (p.holdingId) {
    const h = db.prepare(`SELECT * FROM inv_metals_holdings WHERE id = ?`).get(p.holdingId);
    if (!h) throw new Error("HOLDING_NOT_FOUND");
    return h;
  }
  if (p.purityRatio != null && p.purityRatio !== "") {
    const rows = db
      .prepare(
        `SELECT * FROM inv_metals_holdings WHERE instrument_id = ? AND ifnull(platform_id,'') = ifnull(?, '') AND purity_ratio = ?`,
      )
      .all(p.instrumentId, p.platformId, String(p.purityRatio));
    if (!rows.length) throw new Error("HOLDING_NOT_FOUND");
    if (rows.length > 1) throw new Error("HOLDING_AMBIGUOUS");
    return rows[0];
  }
  const rows = db
    .prepare(
      `SELECT * FROM inv_metals_holdings WHERE instrument_id = ? AND ifnull(platform_id,'') = ifnull(?, '')`,
    )
    .all(p.instrumentId, p.platformId);
  if (!rows.length) throw new Error("HOLDING_NOT_FOUND");
  if (rows.length > 1) throw new Error("HOLDING_AMBIGUOUS:purityRatio_or_holdingId_required");
  return rows[0];
}


/**
 * metals.sell — quantityMg disposal WAC; proceeds in transaction currency.
 */
export async function sellMetal(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "platformId", "quantityMg", "proceedsTotal", "currency", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }

  const qty = toDecimal(p.quantityMg);
  const proceeds = toDecimal(p.proceedsTotal);
  assertPositive(p.quantityMg, "METAL_QTY_NONPOSITIVE");
  assertPositive(p.proceedsTotal, "METAL_PROCEEDS_NONPOSITIVE");
  const currency = p.currency;
  const baseCurrency = resolveBookBaseCurrency({ dataDir, explicitBaseCurrency: p.baseCurrency || null, transactionCurrency: currency });
  let exchangeRateToBase = p.exchangeRateToBase != null ? toDecimal(p.exchangeRateToBase) : null;
  if (currency === baseCurrency) exchangeRateToBase = toDecimal("1");
  else if (exchangeRateToBase == null) throw new Error("VALIDATION_ERROR:exchangeRateToBase");
  else exchangeRateToBase = toDecimal(exchangeRateToBase);
  const exchangeRateToBaseStr = exchangeRateToBase.toFixed();

  const toBase = (amt) => resolveBaseAmountSync(amt, currency, baseCurrency, exchangeRateToBase).amountInBase;


  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("metal_inventory", currency);
  const pnlId = scopedAccountId("metal_realized_pnl", currency);

  const db0 = openDb(dataDir);
  const holding = resolveMetalsHolding(db0, p);
  if (!holding) throw new Error("HOLDING_NOT_FOUND");
  if (holding.cost_currency && holding.cost_currency !== currency) {
    throw new Error(`COST_CURRENCY_MISMATCH:${holding.cost_currency}!=${currency}`);
  }

  const disposal = applyDisposal(
    { quantity: holding.quantity_mg, totalInvested: holding.total_invested },
    { quantity: qty.toFixed(), proceeds: proceeds.toFixed() },
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
      exchangeRateToBase: exchangeRateToBaseStr,
      lineKind: "principal",
    },
    {
      accountId: invId,
      side: "credit",
      amount: costReleased.toFixed(),
      currency,
      amountInBase: toBase(costReleased),
      exchangeRateToBase: exchangeRateToBaseStr,
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
      exchangeRateToBase: exchangeRateToBaseStr,
      lineKind: "principal",
    });
  }

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "metals.sell",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: baseCurrency,
    payload: p,
    journalLines,
    domainResult: {
      holdingId: holding.id,
      transactionId: txId,
      quantityMg: qty.toFixed(),
      proceeds: proceeds.toFixed(),
      costReleased: disposal.costReleased,
      realizedPnl: disposal.realizedPnl,
    },
    engineVersions: { metals: "1.2.0", costBasis: "1.0.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "metal",
        currency,
        displayName: "Metal investment",
      });
      ensureAccount(db, {
        id: pnlId,
        name: `Metal realized P&L (${currency})`,
        accountKind: "income",
        currency,
        systemRole: "metal_realized_pnl",
      });

      const h2 = resolveMetalsHolding(db, p);
      if (!h2) throw new Error("HOLDING_NOT_FOUND");
      const d2 = applyDisposal(
        { quantity: h2.quantity_mg, totalInvested: h2.total_invested },
        { quantity: qty.toFixed(), proceeds: proceeds.toFixed() },
      );

      db.prepare(
        `UPDATE inv_metals_holdings SET quantity_mg = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
      ).run(d2.quantity, d2.totalInvested, now, h2.id);

      db.prepare(
        `INSERT INTO inv_metals_transactions (
          id, operation_id, holding_id, instrument_id, tx_type,
          business_date, quantity_mg, amount, currency, created_at
        ) VALUES (?, ?, ?, ?, 'sell', ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        h2.id,
        p.instrumentId,
        p.businessDate,
        qty.toFixed(),
        proceeds.toFixed(),
        currency,
        now,
      );
    },
  });
}
