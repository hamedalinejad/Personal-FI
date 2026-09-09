import { buyStock } from "../commands/buy.js";

export function capabilities() {
  return {
    edition: "stocks-only",
    status: "PARTIAL",
    implements: ["stocks.buy"],
  };
}

export const commands = { buy: buyStock };
export { buyStock };
export const queries = {};
