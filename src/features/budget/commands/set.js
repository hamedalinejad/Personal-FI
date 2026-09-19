import { randomUUID } from "node:crypto";
import { openDb } from "../../../core/persistence/port.js";
import { requirePayload, requireCurrency } from "../../_shared/commandGuard.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/** budget.set — planning only; journal forbidden */
export async function setBudget(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.periodKey) throw new Error("VALIDATION_ERROR:periodKey");
  const currency = requireCurrency(p.currency);
  const db = openDb(dataDir);
  const now = new Date().toISOString();
  let budget = db.prepare(`SELECT * FROM bg_budgets WHERE period_key = ?`).get(p.periodKey);
  let budgetId;
  if (!budget) {
    budgetId = randomUUID();
    db.prepare(
      `INSERT INTO bg_budgets (id, period_key, currency, total_income, status, created_at)
       VALUES (?, ?, ?, ?, 'active', ?)`,
    ).run(budgetId, p.periodKey, currency, p.totalIncome != null ? String(p.totalIncome) : null, now);
  } else {
    budgetId = budget.id;
    db.prepare(`UPDATE bg_budgets SET total_income = COALESCE(?, total_income), status = 'active' WHERE id = ?`)
      .run(p.totalIncome != null ? String(p.totalIncome) : null, budgetId);
  }
  const envelopes = [];
  for (const env of p.envelopes || []) {
    if (env.assigned == null) throw new Error("VALIDATION_ERROR:assigned");
    toDecimal(String(env.assigned)); // validate decimal
    const eid = randomUUID();
    db.prepare(
      `INSERT INTO bg_envelopes (id, budget_id, category_id, assigned, spent_snapshot, created_at)
       VALUES (?, ?, ?, ?, '0', ?)`,
    ).run(eid, budgetId, env.categoryId || null, String(env.assigned), now);
    envelopes.push(eid);
  }
  return { budgetId, envelopes, journalTouched: false };
}
