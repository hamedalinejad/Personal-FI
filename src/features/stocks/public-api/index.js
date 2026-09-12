import { buyStock } from "../commands/buy.js";
import { settleStock } from "../commands/settle.js";
import { sellStock } from "../commands/sell.js";

export function capabilities() {
  return {
    edition: "stocks-only",
    status: "PARTIAL",
    implements: ["stocks.buy", "stocks.sell", "stocks.settle"],
  };
}

export const commands = { buy: buyStock, sell: sellStock, settle: settleStock };
export { buyStock, sellStock, settleStock };
export const queries = {};
