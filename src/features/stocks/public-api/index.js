import { buyStock } from "../commands/buy.js";
import { settleStock } from "../commands/settle.js";

export function capabilities() {
  return {
    edition: "stocks-only",
    status: "PARTIAL",
    implements: ["stocks.buy", "stocks.settle"],
  };
}

export const commands = { buy: buyStock, settle: settleStock };
export { buyStock, settleStock };
export const queries = {};
