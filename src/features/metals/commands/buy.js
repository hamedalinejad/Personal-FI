/**
 * metals.buy — never silently default purity to 1 (BUG-P0-04).
 * purity = 1 only when instrument purityPolicy === fixed_1.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";
import { resolveMoneyOperationFx, journalPair } from "../../_shared/operationFx.js";
import { toDecimal, canonicalDecimalString } from "../../../core/money/canonicalDecimal.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function buyMetals({ db, payload, baseCurrency }) {
  assertDbPassed(db, "metals.buy");

  const {
    instrumentId,
    massMg,
    purityRatio = null,
    purityPolicy = null,
    costTotal,
    costCurrency,
    fxRate = null,
    businessDate,
    platformId = null,
    operationId = null,
    memo = null,
  } = payload || {};

  if (!instrumentId) throw Object.assign(new Error("INSTRUMENT_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (massMg == null || massMg === "") {
    throw Object.assign(new Error("MASS_MG_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (costTotal == null || costTotal === "") {
    throw Object.assign(new Error("COST_TOTAL_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  // BUG-P0-04: purity resolution
  let purity;
  if (purityPolicy === "fixed_1") {
    purity = toDecimal("1");
  } else if (purityRatio == null || purityRatio === "") {
    throw Object.assign(
      new Error("PURITY_REQUIRED: non-fixed instrument requires explicit purityRatio"),
      { code: "VALIDATION_ERROR" }
    );
  } else {
    purity = toDecimal(String(purityRatio));
    if (purity.lte(0) || purity.gt(1)) {
      throw Object.assign(new Error("PURITY_OUT_OF_RANGE"), { code: "VALIDATION_ERROR" });
    }
    if (purityPolicy === "fixed_1" && !purity.eq(1)) {
      throw Object.assign(new Error("PURITY_FIXED_1_OVERRIDE"), { code: "VALIDATION_ERROR" });
    }
  }

  const mass = toDecimal(String(massMg));
  if (mass.lte(0)) throw Object.assign(new Error("MASS_MUST_BE_POSITIVE"), { code: "VALIDATION_ERROR" });
  const fineMg = mass.times(purity);

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
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `mtx-${Date.now()}`;
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const now = new Date().toISOString();

  ensureInstrument(db, instrumentId, now);
  const cashAcct = ensureSystemAccount(db, "asset.cash.metals", baseCurrency, now);
  const holdingAcct = ensureSystemAccount(db, `asset.metals.${instrumentId}`, baseCurrency, now);

  const pair = journalPair({
    debitAccountId: holdingAcct,
    creditAccountId: cashAcct,
    amountInBase: fx.amountInBase,
    memo: memo || `metals.buy:${instrumentId}`,
  });

  db.run("BEGIN IMMEDIATE");
  try {
    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "metals.buy", businessDate, baseCurrency, now, now]
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

    try {
      db.run(
        `INSERT INTO inv_metals_transactions (
          id, operation_id, instrument_id, tx_type, quantity_mg, amount, currency, created_at
        ) VALUES (?, ?, ?, 'buy', ?, ?, ?, ?)`,
        [
          txId,
          opId,
          instrumentId,
          canonicalDecimalString(mass.toFixed()),
          fx.amountInTxn,
          txnCcy,
          now,
        ]
      );
    } catch {
      /* optional if schema drift */
    }

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
      instrumentId,
      massMg: canonicalDecimalString(mass.toFixed()),
      purityRatio: canonicalDecimalString(purity.toFixed()),
      fineWeightMg: canonicalDecimalString(fineMg.toFixed()),
      costTotal: fx.amountInTxn,
      amountInBase: fx.amountInBase,
      currency: txnCcy,
      businessDate,
    },
  };
}

function ensureInstrument(db, id, now) {
  try {
    const stmt = db.prepare("SELECT id FROM ref_instruments WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      stmt.free();
      return;
    }
    stmt.free();
    db.run(
      `INSERT INTO ref_instruments (id, asset_class, symbol, name) VALUES (?, 'metal', ?, ?)`,
      [id, id, id]
    );
  } catch {
    /* ignore */
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
