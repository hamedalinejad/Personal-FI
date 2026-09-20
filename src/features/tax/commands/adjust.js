/**
 * tax.adjust — full accounting operation (BUG-P0-05).
 * Creates tax_events adjustment + balancing journal + mandatory fin_audit_log.
 * Does NOT destroy prior summary; delta-based.
 * Rejects adjustment after paid.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";
import { resolveMoneyOperationFx, journalPair } from "../../_shared/operationFx.js";
import { toDecimal, canonicalDecimalString } from "../../../core/money/canonicalDecimal.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function adjustTax({ db, payload, baseCurrency }) {
  assertDbPassed(db, "tax.adjust");

  const {
    taxEventId = null,
    taxRecordId = null,
    newAmountDue,
    currency,
    fxRate = null,
    businessDate,
    reason,
    jurisdiction = null,
    periodKey = null,
    operationId = null,
  } = payload || {};

  if (newAmountDue == null || newAmountDue === "") {
    throw Object.assign(new Error("NEW_AMOUNT_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!reason) throw Object.assign(new Error("ADJUST_REASON_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  // Load prior event/record if provided
  let oldAmount = toDecimal("0");
  let priorStatus = null;
  let entityId = taxEventId || taxRecordId;

  if (taxEventId) {
    const stmt = db.prepare("SELECT id, amount, currency, status FROM tax_events WHERE id = ?");
    stmt.bind([taxEventId]);
    if (!stmt.step()) {
      stmt.free();
      throw Object.assign(new Error("TAX_EVENT_NOT_FOUND"), { code: "TAX_EVENT_NOT_FOUND" });
    }
    const row = stmt.getAsObject();
    stmt.free();
    oldAmount = toDecimal(row.amount || "0");
    priorStatus = row.status;
    if (priorStatus === "paid") {
      throw Object.assign(new Error("TAX_ALREADY_PAID"), { code: "TAX_ALREADY_PAID" });
    }
  }

  const newAmt = toDecimal(String(newAmountDue));
  const delta = newAmt.minus(oldAmount);
  const txnCcy = currency || baseCurrency;

  const fx = resolveMoneyOperationFx({
    bookBaseCurrency: baseCurrency,
    transactionCurrency: txnCcy,
    fxRate,
    amount: canonicalDecimalString(delta.abs().toFixed()) === "0" ? "0.0000001" : delta.abs().toFixed(),
  });
  // For zero delta we still post an audit-only path
  const isZero = delta.eq(0);

  const opId =
    operationId ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`);
  const eventId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `te-${Date.now()}`;
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const auditId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `aud-${Date.now()}`;
  const now = new Date().toISOString();

  const payableAcct = ensureSystemAccount(db, "liability.tax_payable", baseCurrency, now);
  const expenseAcct = ensureSystemAccount(db, "expense.tax_adjustment", baseCurrency, now);

  db.run("BEGIN IMMEDIATE");
  try {
    // 1. Operation
    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "tax.adjust", businessDate, baseCurrency, now, now]
    );

    // 2. Tax event (adjustment)
    db.run(
      `INSERT INTO tax_events (
        id, operation_id, tax_kind, amount, currency, period_key, status, created_at
      ) VALUES (?, ?, 'adjustment', ?, ?, ?, 'posted', ?)`,
      [
        eventId,
        opId,
        canonicalDecimalString(delta.toFixed()),
        txnCcy,
        periodKey,
        now,
      ]
    );

    // 3. Journal for non-zero delta
    if (!isZero) {
      const amountInBase = resolveMoneyOperationFx({
        bookBaseCurrency: baseCurrency,
        transactionCurrency: txnCcy,
        fxRate,
        amount: delta.abs().toFixed(),
      }).amountInBase;

      let pair;
      if (delta.gt(0)) {
        // increase obligation: debit expense, credit payable
        pair = journalPair({
          debitAccountId: expenseAcct,
          creditAccountId: payableAcct,
          amountInBase,
          memo: `tax.adjust:${reason}`,
        });
      } else {
        // decrease: debit payable, credit expense (or income recovery)
        pair = journalPair({
          debitAccountId: payableAcct,
          creditAccountId: expenseAcct,
          amountInBase,
          memo: `tax.adjust:${reason}`,
        });
      }

      db.run(
        `INSERT INTO fin_journal_entries (id, operation_id, business_date, memo, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [entryId, opId, businessDate, reason, now]
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
            canonicalDecimalString(delta.abs().toFixed()),
            txnCcy,
            line.amount,
            fxRate || "1",
            pair.memo,
          ]
        );
      }
    }

    // 4. Mandatory audit — no catch-and-ignore
    db.run(
      `INSERT INTO fin_audit_log (
        id, actor, source, reason, operation_id, entity_type, entity_id, action, at, payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        "user",
        "ui",
        reason,
        opId,
        "tax_events",
        eventId,
        "tax.adjust",
        now,
        JSON.stringify({
          priorEventId: taxEventId,
          oldAmount: canonicalDecimalString(oldAmount.toFixed()),
          newAmount: canonicalDecimalString(newAmt.toFixed()),
          delta: canonicalDecimalString(delta.toFixed()),
          jurisdiction,
          periodKey,
          reason,
        }),
      ]
    );

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
      taxEventId: eventId,
      oldAmount: canonicalDecimalString(oldAmount.toFixed()),
      newAmount: canonicalDecimalString(newAmt.toFixed()),
      delta: canonicalDecimalString(delta.toFixed()),
      currency: txnCcy,
      reason,
      businessDate,
    },
  };
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
  const kind = code.startsWith("liability") ? "liability" : "expense";
  db.run(
    `INSERT INTO fin_accounts (id, code, name, account_kind, currency, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, code, code, kind, currency, now, now]
  );
  return id;
}
