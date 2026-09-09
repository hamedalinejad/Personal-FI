import { getStatement as build } from "../reports/statement.js";

export function getStatement(loanId, opts) {
  return build(loanId, opts);
}
