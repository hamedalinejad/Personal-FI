export function isActive(loan) {
  return loan && loan.status === "active";
}

export function assertLoanPayable(loan, currency) {
  if (!loan) throw new Error("LOAN_NOT_FOUND");
  if (loan.status !== "active") throw new Error("LOAN_NOT_ACTIVE");
  if (currency && loan.currency !== currency) throw new Error("LOAN_CURRENCY_MISMATCH");
  return true;
}
