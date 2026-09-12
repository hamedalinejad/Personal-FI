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
  if (!operationId && !isManualAdjustment) throw new Error("TAX_EVENT_NEEDS_OPERATION_OR_MANUAL");
  const period = periodKey || (businessDate ? businessDate.slice(0, 4) : null);
  if (!period) throw new Error("TAX_EVENT_PERIOD_REQUIRED");

  const db = openDb(dataDir);
  const id = randomUUID();
  const now = new Date().toISOString();
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
  return { id, persisted: true, operationId, taxKind, taxAmount, currency, periodKey: period };
}

export function listTaxEvents(dataDir, { operationId = null } = {}) {
  const db = openDb(dataDir);
  if (operationId) {
    return db.prepare(`SELECT * FROM tax_events WHERE operation_id = ? ORDER BY created_at`).all(operationId);
  }
  return db.prepare(`SELECT * FROM tax_events ORDER BY period_key, created_at`).all();
}
