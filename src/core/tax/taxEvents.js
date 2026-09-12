import { toDecimal } from "../money/canonicalDecimal.js";
import { openDb } from "../persistence/port.js";
import { randomUUID } from "node:crypto";

/**
 * Append-only tax facts aligned with schema tax_events.
 * Never mutates journal to "apply tax".
 */
export function recordTaxEvent(dataDir, {
  operationId = null,
  taxKind,
  taxAmount,
  currency,
  periodKey,
  businessDate,
  jurisdiction = "IR",
  policyVersion = null,
  baseAmount = null,
  isManualAdjustment = false,
  adjustmentReason = null,
}) {
  if (!taxKind || !taxAmount || !currency) throw new Error("TAX_EVENT_INVALID");
  if (toDecimal(taxAmount).isNegative()) throw new Error("TAX_AMOUNT_NEGATIVE");
  // Tax facts should prefer same txn as financial op via withinTransaction when available;
  // standalone recordTaxEvent is for assessment-only / manual adjustment paths.
  if (!operationId && !isManualAdjustment) throw new Error("TAX_EVENT_NEEDS_OPERATION_OR_MANUAL");
  const period = periodKey || (businessDate ? businessDate.slice(0, 4) : null);
  if (!period) throw new Error("TAX_EVENT_PERIOD_REQUIRED");

  const db = openDb(dataDir);
  const id = randomUUID();
  const now = new Date().toISOString();
  const cols = db.prepare(`PRAGMA table_info(tax_events)`).all().map((c) => c.name);
  const hasPeriod = cols.includes("tax_year");
  if (hasPeriod) {
    db.prepare(
      `INSERT INTO tax_events (
        id, operation_id, tax_kind, amount, currency, period_key,
        jurisdiction, rule_version, basis_amount, is_deductible, is_manual_adjustment,
        adjustment_reason, status, tax_year, calendar_system, period_start, period_end,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'posted', ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      operationId,
      taxKind,
      taxAmount,
      currency,
      period,
      jurisdiction,
      policyVersion,
      baseAmount,
      isManualAdjustment ? 1 : 0,
      adjustmentReason,
      period,
      "gregorian",
      businessDate || null,
      businessDate || null,
      now,
      now,
    );
  } else {
    db.prepare(
      `INSERT INTO tax_events (
        id, operation_id, tax_kind, amount, currency, period_key,
        jurisdiction, rule_version, basis_amount, is_deductible, is_manual_adjustment,
        adjustment_reason, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'posted', ?, ?)`,
    ).run(
      id,
      operationId,
      taxKind,
      taxAmount,
      currency,
      period,
      jurisdiction,
      policyVersion,
      baseAmount,
      isManualAdjustment ? 1 : 0,
      adjustmentReason,
      now,
      now,
    );
  }
  return { id, persisted: true, operationId, taxKind, taxAmount, currency, periodKey: period };
}

export function listTaxEvents(dataDir, { operationId = null } = {}) {
  const db = openDb(dataDir);
  if (operationId) {
    return db.prepare(`SELECT * FROM tax_events WHERE operation_id = ? ORDER BY created_at`).all(operationId);
  }
  return db.prepare(`SELECT * FROM tax_events ORDER BY period_key, created_at`).all();
}

/**
 * P0-TAX-001 — forbid direct paid status mutation without payTax operation.
 */
export function changeTaxRecordStatus(dataDir, taxRecordId, status) {
  // P0-013: paid only via payTax
  if (status === "paid") {
    throw new Error("TAX_PAID_REQUIRES_PAYTAX_OPERATION");
  }
  const allowed = new Set(["draft", "pending", "overdue", "filed", "cancelled", "amended"]);
  if (!allowed.has(status)) throw new Error(`TAX_STATUS_INVALID:${status}`);
  const db = openDb(dataDir);
  const now = new Date().toISOString();
  const row = db.prepare(`SELECT id, status FROM tax_records WHERE id = ?`).get(taxRecordId);
  if (!row) throw new Error("TAX_RECORD_NOT_FOUND");
  if (row.status === "paid" && status !== "amended" && status !== "cancelled") {
    throw new Error("TAX_PAID_LOCKED");
  }
  db.prepare(`UPDATE tax_records SET status = ?, updated_at = ? WHERE id = ?`).run(status, now, taxRecordId);
  return { id: taxRecordId, status };
}

/** Mark paid only from payTax after journal success */
export function markTaxRecordPaidAfterPayTax(dataDir, taxRecordId, { operationId, paidDate }) {
  if (!operationId) throw new Error("TAX_PAY_NEEDS_OPERATION");
  const db = openDb(dataDir);
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE tax_records SET status = 'paid', payment_operation_id = ?, paid_at = ?, updated_at = ? WHERE id = ?`,
  ).run(operationId, paidDate || now, now, taxRecordId);
  return { id: taxRecordId, status: "paid", operationId, paidDate: paidDate || null };
}
