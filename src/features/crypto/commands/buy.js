/**
 * crypto.buy — Core owns netQuantity derivation (BUG-P0-03).
 * UI sends grossQuantity + feeQuantity; Core computes net = gross - fee (reduce-received).
 * If caller supplies netQuantity it is treated as consistency assertion only.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";
import { resolveMoneyOperationFx, journalPair } from "../../_shared/operationFx.js";
import { toDecimal, canonicalDecimalString } from "../../../core/money/canonicalDecimal.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function buyCrypto({ db, payload, baseCurrency }) {
  assertDbPassed(db, "crypto.buy");

  const {
    instrumentId,
    symbol,
    exchangeId = null,
    grossQuantity,
    feeQuantity = "0",
    netQuantity: callerNet = null,
    costTotal,
    costCurrency,
    price = null,
    priceAsOf = null,
    businessDate,
    feeTreatment = "reduce_received",
    feeAmount = "0",
    feeCurrency = null,
    fxRate = null,
    operationId = null,
    memo = null,
  } = payload || {};

  if (!instrumentId && !symbol) {
    throw Object.assign(new Error("INSTRUMENT_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (grossQuantity == null || grossQuantity === "") {
    throw Object.assign(new Error("GROSS_QUANTITY_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (costTotal == null || costTotal === "") {
    throw Object.assign(new Error("COST_TOTAL_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const gross = toDecimal(String(grossQuantity));
  const feeQty = toDecimal(String(feeQuantity || "0"));
  if (gross.lte(0)) throw Object.assign(new Error("GROSS_MUST_BE_POSITIVE"), { code: "VALIDATION_ERROR" });
  if (feeQty.lt(0)) throw Object.assign(new Error("FEE_QTY_NEGATIVE"), { code: "VALIDATION_ERROR" });

  // Core derives net under reduce_received
  let net;
  if (feeTreatment === "reduce_received" || feeTreatment === "expense") {
    net = gross.minus(feeQty);
  } else {
    net = gross; // other treatments keep received gross; fee as separate expense
  }
  if (net.lt(0)) {
    throw Object.assign(new Error("INV_QTY_CONSERVATION"), { code: "INV_QTY_CONSERVATION" });
  }

  // Consistency assertion if caller supplied netQuantity
  if (callerNet != null && callerNet !== "") {
    const supplied = toDecimal(String(callerNet));
    if (!supplied.eq(net)) {
      throw Object.assign(
        new Error(`INV_QTY_CONSERVATION: expected net ${net.toFixed()} got ${supplied.toFixed()}`),
        { code: "INV_QTY_CONSERVATION" }
      );
    }
  }

  const txnCcy = costCurrency || baseCurrency;
  const fx = resolveMoneyOperationFx({
    bookBaseCurrency: baseCurrency,
    transactionCurrency: txnCcy,
    fxRate,
    amount: costTotal,
  });

  const opId =
    operationId ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`);
  const txId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ctx-${Date.now()}`;
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const now = new Date().toISOString();
  const instId = instrumentId || `crypto:${symbol}`;

  // Ensure instrument + holding rows (simplified; full schema may expand)
  ensureInstrument(db, instId, symbol || instId, now);
  const cashAcct = ensureSystemAccount(db, "asset.cash.crypto", baseCurrency, now);
  const holdingAcct = ensureSystemAccount(db, `asset.crypto.${instId}`, baseCurrency, now);

  const pair = journalPair({
    debitAccountId: holdingAcct,
    creditAccountId: cashAcct,
    amountInBase: fx.amountInBase,
    memo: memo || `crypto.buy:${symbol || instId}`,
  });

  db.run("BEGIN IMMEDIATE");
  try {
    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "crypto.buy", businessDate, baseCurrency, now, now]
    );
    db.run(
      `INSERT INTO fin_journal_entries (id, operation_id, business_date, memo, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [entryId, opId, businessDate, memo, now]
    );
    for (const line of pair.lines) {
      const lineId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `jl-${Math.random().toString(36).slice(2)}`;
      db.run(
        `INSERT INTO fin_journal_lines (
          id, entry_id, account_id, side, amount, currency,
          amount_in_base, exchange_rate_to_base, memo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lineId,
          entryId,
          line.accountId,
          line.side,
          fx.amountInTxn,
          txnCcy,
          line.amount,
          fx.fxRate,
          pair.memo,
        ]
      );
    }

    // Feature RAW row
    db.run(
      `INSERT INTO inv_crypto_transactions (
        id, operation_id, holding_id, instrument_id, tx_type, business_date,
        gross_quantity, fee_quantity, net_quantity, fee_currency, economic_kind, created_at
      ) VALUES (?, ?, NULL, ?, 'buy', ?, ?, ?, ?, ?, ?, ?)`,
      [
        txId,
        opId,
        instId,
        businessDate,
        canonicalDecimalString(gross.toFixed()),
        canonicalDecimalString(feeQty.toFixed()),
        canonicalDecimalString(net.toFixed()),
        txnCcy,
        feeTreatment || 'buy',
        now,
      ]
    );

    // Upsert holding quantity
    upsertHolding(db, instId, net, fx.amountInBase, txnCcy, now);

    db.run("COMMIT");
  } catch (e) {
    try {
      db.run("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  }

  return {
    success: true,
    data: {
      operationId: opId,
      transactionId: txId,
      instrumentId: instId,
      grossQuantity: canonicalDecimalString(gross.toFixed()),
      feeQuantity: canonicalDecimalString(feeQty.toFixed()),
      netQuantity: canonicalDecimalString(net.toFixed()),
      costTotal: fx.amountInTxn,
      amountInBase: fx.amountInBase,
      currency: txnCcy,
      feeTreatment,
      businessDate,
    },
  };
}

function ensureInstrument(db, id, symbol, now) {
  try {
    const stmt = db.prepare("SELECT id FROM ref_instruments WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      stmt.free();
      return;
    }
    stmt.free();
    db.run(
      `INSERT INTO ref_instruments (id, asset_class, symbol, name) VALUES (?, 'crypto', ?, ?)`,
      [id, symbol, symbol]
    );
  } catch {
    /* schema may vary in early bootstrap */
  }
}

function ensureSystemAccount(db, code, currency, now) {
  const stmt = db.prepare("SELECT id FROM fin_accounts WHERE code = ? AND currency = ?");
  stmt.bind([code, currency]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row.id;
  }
  stmt.free();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sys-${code}-${Date.now()}`;
  db.run(
    `INSERT INTO fin_accounts (id, code, name, account_kind, currency, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, 'asset', ?, 0, ?, ?)`,
    [id, code, code, currency, now, now]
  );
  return id;
}

function upsertHolding(db, instrumentId, netQty, costInBase, currency, now) {
  try {
    const stmt = db.prepare("SELECT id, quantity, total_invested FROM inv_crypto_holdings WHERE instrument_id = ?");
    stmt.bind([instrumentId]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      const newQty = toDecimal(row.quantity || "0").plus(netQty);
      const newCost = toDecimal(row.total_invested || "0").plus(toDecimal(costInBase));
      db.run(
        `UPDATE inv_crypto_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
        [canonicalDecimalString(newQty.toFixed()), canonicalDecimalString(newCost.toFixed()), now, row.id]
      );
      return;
    }
    stmt.free();
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `hold-${Date.now()}`;
    db.run(
      `INSERT INTO inv_crypto_holdings (id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        instrumentId,
        canonicalDecimalString(netQty.toFixed()),
        canonicalDecimalString(String(costInBase)),
        currency,
        now,
        now,
      ]
    );
  } catch {
    /* holdings table may have slightly different columns in early schema */
  }
}
