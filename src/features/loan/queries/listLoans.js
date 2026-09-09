import { listAllLoans } from "../ledger/loanRepository.js";

export function listLoans({ dataDir }) {
  return listAllLoans(dataDir);
}
