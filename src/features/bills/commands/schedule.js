import { randomUUID } from "node:crypto";
import { openDb } from "../../../core/persistence/port.js";
import { requirePayload, requireCurrency, requirePositiveMoney, requireDate } from "../../_shared/commandGuard.js";

/** bill.schedule — planning; no journal until pay path */
export async function scheduleBill(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.title) throw new Error("VALIDATION_ERROR:title");
  const amount = requirePositiveMoney(p.amount);
  const currency = requireCurrency(p.currency);
  const dueDate = requireDate(p.dueDate, "VALIDATION_ERROR:dueDate");
  const itemId = p.itemId || randomUUID();
  const occId = randomUUID();
  const now = new Date().toISOString();
  const db = openDb(dataDir);
  db.prepare(
    `INSERT INTO br_items (id, title, amount, currency, recurrence_rule, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?)`,
  ).run(itemId, p.title, amount.toFixed(), currency, p.recurrenceRule || null, now);
  db.prepare(
    `INSERT INTO br_occurrences (id, item_id, occurrence_key, due_date, scheduled_amount, status, operation_id)
     VALUES (?, ?, ?, ?, ?, 'pending', NULL)`,
  ).run(occId, itemId, p.occurrenceKey || dueDate, dueDate, amount.toFixed());
  return { itemId, occurrenceId: occId, journalTouched: false };
}
