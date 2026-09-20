/**
 * cheque.bounce — never silent direct update without operation identity (BUG-P1-11).
 * If prior clear posted cash, bounce creates reversal-style journal.
 * Always writes fin_operations + fin_audit_log.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";
import { assertTransition, isFinancialTransition } from "./stateMachine.js";
import { journalPair } from "../../_shared/operationFx.js";
import { canonicalDecimalString } from "../../../core/money/canonicalDecimal.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function bounceCheque({ db, payload, baseCurrency }) {
  assertDbPassed(db, "cheque.bounce");

  const {
    chequeId,
    businessDate,
    operationId = null,
    memo = null,
    reverseClearJournal = true,
  } = payload || {};

  if (!chequeId) throw Object.assign(new Error("CHEQUE_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const stmt = db.prepare(
    "SELECT id, status, amount, currency, direction, account_id, operation_id FROM chk_cheques WHERE id = ?"
  );
  stmt.bind([chequeId]);
  if (!stmt.step()) {
    stmt.free();
    throw Object.assign(new Error("CHEQUE_NOT_FOUND"), { code: "CHEQUE_NOT_FOUND" });
  }
  const cheque = stmt.getAsObject();
  stmt.free();

  assertTransition(cheque.status, "bounced");

  const opId =
    operationId ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`);
  const now = new Date().toISOString();
  const needsJournal = isFinancialTransition("bounced") && cheque.status === "cleared" && reverseClearJournal;

  db.run("BEGIN IMMEDIATE");
  try {
    // Always create operation identity
    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "cheque.bounce", businessDate, baseCurrency, now, now]
    );

    if (needsJournal) {
      // Reverse prior clear: opposite of cash effect
      const cashAcct = cheque.account_id;
      const clearingAcct = ensureSystemAccount(db, "asset.cheque_clearing", baseCurrency, now);
      if (cashAcct) {
        const pair = journalPair({
          debitAccountId: clearingAcct,
          creditAccountId: cashAcct,
          amountInBase: canonicalDecimalString(String(cheque.amount)),
          memo: memo || `cheque.bounce:${chequeId}`,
        });
        const entryId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `je-${Date.now()}`;
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
      }
    }

    db.run(
      `UPDATE chk_cheques SET status = 'bounced', bounced_date = ?, operation_id = ? WHERE id = ?`,
      [businessDate, opId, chequeId]
    );

    // Mandatory audit
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
        memo || "bounce",
        opId,
        "chk_cheques",
        chequeId,
        "cheque.bounce",
        now,
        JSON.stringify({
          from: cheque.status,
          to: "bounced",
          cashEffect: needsJournal,
          amount: cheque.amount,
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
      chequeId,
      operationId: opId,
      from: cheque.status,
      to: "bounced",
      cashEffect: needsJournal,
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
