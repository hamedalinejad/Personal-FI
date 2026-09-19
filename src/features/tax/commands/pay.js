import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/port.js";
import { assertAccountUsable, scopedAccountId } from "../../../core/accounting/chartOfAccounts.js";
import { requireOperationId, requirePayload, requirePositiveMoney, requireDate, requireCurrency } from "../../_shared/commandGuard.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/** tax.pay — ONLY path that marks tax_records.status = paid */
export async function payTax(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.taxRecordId) throw new Error("VALIDATION_ERROR:taxRecordId");
  if (!p.accountId) throw new Error("VALIDATION_ERROR:accountId");
  const amount = requirePositiveMoney(p.amount);
  const currency = requireCurrency(p.currency);
  const businessDate = requireDate(p.businessDate);
  const db = openDb(dataDir);
  const rec = db.prepare(`SELECT * FROM tax_records WHERE id = ?`).get(p.taxRecordId);
  if (!rec) throw new Error("TAX_RECORD_NOT_FOUND");
  if (!["pending", "overdue", "filed"].includes(rec.status)) throw new Error("TAX_INVALID_STATUS");
  const acc = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(p.accountId);
  if (!acc) throw new Error("ACCOUNT_NOT_FOUND");
  assertAccountUsable(db, acc.fin_account_id, currency);

  const payableId = scopedAccountId("tax_payable", currency);
  const amt = amount.toFixed();
  const journalLines = [
    { accountId: payableId, side: "debit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "tax" },
    { accountId: acc.fin_account_id, side: "credit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "tax" },
  ];
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    operationId,
    type: "tax.pay",
    dataDir,
    businessDate,
    baseCurrency: currency,
    status: "posted",
    payload: p,
    journalLines,
    withinTransaction(db) {
      const paid = toDecimal(rec.amount_paid || "0").plus(amount);
      const due = toDecimal(rec.amount_due || "0");
      const status = paid.gte(due) ? "paid" : "pending";
      db.prepare(
        `UPDATE tax_records SET amount_paid = ?, status = ?, payment_operation_id = ?, paid_at = CASE WHEN ? = 'paid' THEN ? ELSE paid_at END, updated_at = ? WHERE id = ?`,
      ).run(paid.toFixed(), status, operationId, status, now, now, p.taxRecordId);
      if (rec.linked_tax_event_id) {
        db.prepare(`UPDATE tax_events SET payment_operation_id = ? WHERE id = ?`)
          .run(operationId, rec.linked_tax_event_id);
      }
    },
  });
}
