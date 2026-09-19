import { randomUUID } from "node:crypto";
import { openDb } from "../../../core/persistence/port.js";
import { requirePayload, requirePositiveMoney, requireCurrency } from "../../_shared/commandGuard.js";

/** cheque.register — state only; NO cash journal */
export async function registerCheque(input, { dataDir } = {}) {
  const p = requirePayload(input);
  const amount = requirePositiveMoney(p.amount);
  const currency = requireCurrency(p.currency);
  if (!p.direction || !["payable", "receivable"].includes(p.direction)) {
    throw new Error("VALIDATION_ERROR:direction");
  }
  const id = p.id || randomUUID();
  const now = new Date().toISOString();
  const db = openDb(dataDir);
  db.prepare(
    `INSERT INTO chk_cheques (
      id, account_id, direction, amount, currency, due_date, sayadi_id, cheque_number,
      status, operation_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', NULL, ?)`,
  ).run(
    id,
    p.accountId || null,
    p.direction,
    amount.toFixed(),
    currency,
    p.dueDate || null,
    p.sayadiId || null,
    p.chequeNumber || null,
    now,
  );
  return { chequeId: id, status: "issued" };
}
