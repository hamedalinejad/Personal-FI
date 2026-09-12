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
 * metals.delivery — physical delivery out of platform holding.
 * Carrying cost moves to physical asset inventory (same currency).
 * Delivery fee expense separate (transaction currency only).
 */
export async function deliverMetal(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "platformId", "quantityMg", "currency", "businessDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }

  const qty = toDecimal(p.quantityMg);
  const currency = p.currency;
  const fee = toDecimal(p.deliveryFee || "0");
  if (p.feeCurrency && p.feeCurrency !== currency && fee.gt(0)) {
    throw new Error("DELIVERY_FEE_CURRENCY_MISMATCH");
  }

  const db0 = openDb(dataDir);
  const holding = db0
    .prepare(`SELECT * FROM inv_metals_holdings WHERE instrument_id=? AND platform_id=?`)
    .get(p.instrumentId, p.platformId);
  if (!holding) throw new Error("HOLDING_NOT_FOUND");

  // delivery is transfer of carrying, not disposal at 0
  const unit = toDecimal(holding.total_invested).div(toDecimal(holding.quantity_mg));
  const carrying = qty.times(unit);
  const newQty = toDecimal(holding.quantity_mg).minus(qty);
  if (newQty.lt(0)) throw new Error("DIS_INSUFFICIENT_QTY");
  const newInvested = toDecimal(holding.total_invested).minus(carrying);

  const invId = scopedAccountId("metal_inventory", currency);
  const physId = scopedAccountId("metal_physical_inventory", currency);
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const feeExp = scopedAccountId("metal_delivery_fee", currency);

  const journalLines = [
    {
      accountId: physId,
      side: "debit",
      amount: carrying.toFixed(),
      currency,
      amountInBase: carrying.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: invId,
      side: "credit",
      amount: carrying.toFixed(),
      currency,
      amountInBase: carrying.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];
  if (fee.gt(0)) {
    journalLines.push(
      {
        accountId: feeExp,
        side: "debit",
        amount: fee.toFixed(),
        currency,
        amountInBase: fee.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "fee",
      },
      {
        accountId: cashId,
        side: "credit",
        amount: fee.toFixed(),
        currency,
        amountInBase: fee.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "fee",
      },
    );
  }

  const txId = randomUUID();
  const delId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "metals.delivery",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: p,
    journalLines,
    domainResult: {
      transactionId: txId,
      deliveryId: delId,
      quantityMg: qty.toFixed(),
      carrying: carrying.toFixed(),
      deliveryFee: fee.toFixed(),
    },
    engineVersions: { metals: "1.3.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "metal",
        currency,
        displayName: "Metal investment",
      });
      ensureAccount(db, {
        id: physId,
        name: `Metal physical inventory (${currency})`,
        accountKind: "asset",
        currency,
        systemRole: "metal_physical_inventory",
      });
      if (fee.gt(0)) {
        ensureAccount(db, {
          id: feeExp,
          name: `Metal delivery fee (${currency})`,
          accountKind: "expense",
          currency,
          systemRole: "metal_delivery_fee",
        });
      }

      const h2 = db
        .prepare(`SELECT * FROM inv_metals_holdings WHERE instrument_id=? AND platform_id=?`)
        .get(p.instrumentId, p.platformId);
      if (!h2) throw new Error("HOLDING_NOT_FOUND");
      const u2 = toDecimal(h2.total_invested).div(toDecimal(h2.quantity_mg));
      const c2 = qty.times(u2);
      const nq = toDecimal(h2.quantity_mg).minus(qty);
      if (nq.lt(0)) throw new Error("DIS_INSUFFICIENT_QTY");
      const ni = toDecimal(h2.total_invested).minus(c2);
      db.prepare(
        `UPDATE inv_metals_holdings SET quantity_mg = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
      ).run(nq.toFixed(), ni.toFixed(), now, h2.id);

      db.prepare(
        `INSERT INTO inv_metals_transactions (
          id, operation_id, holding_id, instrument_id, tx_type,
          business_date, quantity_mg, amount, currency, fee_amount, created_at
        ) VALUES (?, ?, ?, ?, 'physical_delivery', ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        h2.id,
        p.instrumentId,
        p.businessDate,
        qty.toFixed(),
        c2.toFixed(),
        currency,
        fee.toFixed(),
        now,
      );

      // optional physical_deliveries table
      const cols = db.prepare(`PRAGMA table_info(inv_metals_physical_deliveries)`).all();
      if (cols.length) {
        db.prepare(
          `INSERT INTO inv_metals_physical_deliveries (
            id, operation_id, metals_holding_id, status, quantity_mg, created_at, updated_at
          ) VALUES (?, ?, ?, 'delivered', ?, ?, ?)`,
        ).run(delId, operationId, h2.id, qty.toFixed(), now, now);
      }
    },
  });
}
