import { getLoanById } from "../ledger/loanRepository.js";

export function getLoan(loanId, { dataDir }) {
  const row = getLoanById(dataDir, loanId);
  if (!row) throw new Error("LOAN_NOT_FOUND");
  return row;
}
