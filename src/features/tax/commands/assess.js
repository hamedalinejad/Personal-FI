import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { ensureAccount, scopedAccountId } from "../../../core/accounting/chartOfAccounts.js";
import { requireOperationId, requirePayload, requirePositiveMoney, requireDate, requireCurrency } from "../../_shared/commandGuard.js";

/** tax.assess — Dr tax expense / Cr tax payable; does NOT mark paid */
export async function assessTax(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  const amount = requirePositiveMoney(p.amount);
  const currency = requireCurrency(p.currency);
  const businessDate = requireDate(p.businessDate);
  if (!p.periodKey) throw new Error("VALIDATION_ERROR:periodKey");
  if (!p.jurisdiction) throw new Error("VALIDATION_ERROR:jurisdiction");

  const expenseId = scopedAccountId("tax_expense", currency);
  const payableId = scopedAccountId("tax_payable", currency);
  const amt = amount.toFixed();
  const eventId = randomUUID();
  const recordId = p.taxRecordId || randomUUID();
  const now = new Date().toISOString();

  // ensure accounts outside txn is OK for master; also ensure inside
  const journalLines = [
    { accountId: expenseId, side: "debit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "tax" },
    { accountId: payableId, side: "credit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "tax" },
  ];

  return runAtomicFinancialOperation({
    operationId,
    type: "tax.assess",
    dataDir,
    businessDate,
    baseCurrency: currency,
    status: "posted",
    payload: { ...p, eventId, recordId },
    journalLines,
    withinTransaction(db) {
      ensureAccount(db, {
        id: expenseId,
        name: `Tax expense (${currency})`,
        accountKind: "expense",
        currency,
        systemRole: "tax_expense",
      });
      ensureAccount(db, {
        id: payableId,
        name: `Tax payable (${currency})`,
        accountKind: "liability",
        currency,
        systemRole: "tax_payable",
      });
      db.prepare(
        `INSERT INTO tax_events (
          id, source_operation_id, operation_id, tax_kind, amount, currency, period_key, jurisdiction,
          status, is_deductible, is_manual_adjustment, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'posted', 0, 0, ?, ?)`,
      ).run(
        eventId,
        operationId,
        operationId,
        p.taxKind || "income",
        amt,
        currency,
        p.periodKey,
        p.jurisdiction,
        now,
        now,
      );
      const existing = db.prepare(`SELECT id FROM tax_records WHERE id = ?`).get(recordId);
      if (!existing) {
        db.prepare(
          `INSERT INTO tax_records (
            id, period_key, jurisdiction, linked_tax_event_id, amount_due, amount_paid, currency, due_date, status, created_at
          ) VALUES (?, ?, ?, ?, ?, '0', ?, ?, 'pending', ?)`,
        ).run(recordId, p.periodKey, p.jurisdiction, eventId, amt, currency, p.dueDate || null, now);
      } else {
        db.prepare(
          `UPDATE tax_records SET amount_due = ?, linked_tax_event_id = ?, status = 'pending', updated_at = ? WHERE id = ?`,
        ).run(amt, eventId, now, recordId);
      }
    },
  }).then((r) => ({ ...r, taxEventId: eventId, taxRecordId: recordId }));
}
