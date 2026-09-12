export const LOAN_ROLES = Object.freeze(["borrower", "lender"]);

export function normalizeLoanRole(role) {
  if (!role) throw new Error("LOAN_ROLE_REQUIRED");
  const r = String(role).toLowerCase();
  if (r === "borrowed" || r === "borrower") return "borrower";
  if (r === "lent" || r === "lender") return "lender";
  throw new Error(`LOAN_ROLE_UNSUPPORTED:${role}`);
}
