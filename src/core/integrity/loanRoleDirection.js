/**
 * role is canonical; direction is legacy alias.
 * Reject rows where both are set and disagree.
 */
export function scanLoanRoleDirectionConflicts(db) {
  const rows = db
    .prepare(
      `SELECT id, role, direction FROM ln_loans
       WHERE direction IS NOT NULL AND role IS NOT NULL`,
    )
    .all();
  const bad = [];
  for (const r of rows) {
    const d = String(r.direction).toLowerCase();
    const role = String(r.role).toLowerCase();
    const ok =
      (d === "borrowed" && role === "borrower") ||
      (d === "lent" && role === "lender");
    if (!ok) bad.push(r.id);
  }
  return { ok: bad.length === 0, conflicts: bad };
}
