import { buyStock } from "../commands/buy.js";
import { sellStock } from "../commands/sell.js";
import { settleStock } from "../commands/settle.js";
import { stockDividend } from "../commands/dividend.js";

export function capabilities() {
  return {
    edition: "stocks-only",
    status: "PARTIAL",
    implements: ["stocks.buy", "stocks.sell", "stocks.settle", "stocks.dividend"],
  };
}

export const commands = {
  buy: buyStock,
  sell: sellStock,
  settle: settleStock,
  dividend: stockDividend,
};
export { buyStock, sellStock, settleStock, stockDividend };
export const queries = {};
