/**
 * cheque.clear — financially meaningful: posts journal cash effect + status cleared.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";
import { assertTransition } from "./stateMachine.js";
import { journalPair } from "../../_shared/operationFx.js";
import { canonicalDecimalString } from "../../../core/money/canonicalDecimal.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function clearCheque({ db, payload, baseCurrency }) {
  assertDbPassed(db, "cheque.clear");
  const { chequeId, businessDate, operationId = null, memo = null, cashAccountId = null } =
    payload || {};

  if (!chequeId) throw Object.assign(new Error("CHEQUE_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const stmt = db.prepare(
    "SELECT id, status, amount, currency, direction, account_id FROM chk_cheques WHERE id = ?"
  );
  stmt.bind([chequeId]);
  if (!stmt.step()) {
    stmt.free();
    throw Object.assign(new Error("CHEQUE_NOT_FOUND"), { code: "CHEQUE_NOT_FOUND" });
  }
  const cheque = stmt.getAsObject();
  stmt.free();
  assertTransition(cheque.status, "cleared");

  const opId =
    operationId ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`);
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const now = new Date().toISOString();
  const cashId = cashAccountId || cheque.account_id;
  const clearing = ensureSystemAccount(db, "asset.cheque_clearing", baseCurrency, now);

  // Receivable clear: debit cash, credit clearing (or reverse for payable)
  const pair =
    cheque.direction === "payable"
      ? journalPair({
          debitAccountId: clearing,
          creditAccountId: cashId || clearing,
          amountInBase: canonicalDecimalString(String(cheque.amount)),
          memo: memo || `cheque.clear:${chequeId}`,
        })
      : journalPair({
          debitAccountId: cashId || clearing,
          creditAccountId: clearing,
          amountInBase: canonicalDecimalString(String(cheque.amount)),
          memo: memo || `cheque.clear:${chequeId}`,
        });

  db.run("BEGIN IMMEDIATE");
  try {
    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "cheque.clear", businessDate, baseCurrency, now, now]
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
          cheque.amount,
          cheque.currency || baseCurrency,
          line.amount,
          "1",
          pair.memo,
        ]
      );
    }
    db.run(
      `UPDATE chk_cheques SET status = 'cleared', cleared_date = ?, operation_id = ? WHERE id = ?`,
      [businessDate, opId, chequeId]
    );
    const auditId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `aud-${Date.now()}`;
    db.run(
      `INSERT INTO fin_audit_log (
        id, actor, source, reason, operation_id, entity_type, entity_id, action, at, payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        "user",
        "ui",
        memo || "clear",
        opId,
        "chk_cheques",
        chequeId,
        "cheque.clear",
        now,
        JSON.stringify({ from: cheque.status, to: "cleared", amount: cheque.amount }),
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
      chequeId,
      operationId: opId,
      from: cheque.status,
      to: "cleared",
      cashEffect: true,
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
  db.run(
    `INSERT INTO fin_accounts (id, code, name, account_kind, currency, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, 'asset', ?, 0, ?, ?)`,
    [id, code, code, currency, now, now]
  );
  return id;
}
