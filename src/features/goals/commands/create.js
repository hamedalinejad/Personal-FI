import { randomUUID } from "node:crypto";
import { openDb } from "../../../core/persistence/port.js";
import { requirePayload, requireCurrency, requirePositiveMoney } from "../../_shared/commandGuard.js";

/** goal.create — planning only */
export async function createGoal(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.name) throw new Error("VALIDATION_ERROR:name");
  const currency = requireCurrency(p.currency);
  const target = requirePositiveMoney(p.targetAmount);
  const id = p.id || randomUUID();
  const now = new Date().toISOString();
  const db = openDb(dataDir);
  db.prepare(
    `INSERT INTO fg_goals (id, name, currency, target_amount, current_amount_snapshot, target_date, status, created_at)
     VALUES (?, ?, ?, ?, '0', ?, 'active', ?)`,
  ).run(id, p.name, currency, target.toFixed(), p.targetDate || null, now);
  return { goalId: id, journalTouched: false };
}
