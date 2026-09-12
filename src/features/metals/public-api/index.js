import { buyMetal } from "../commands/buy.js";
import { sellMetal } from "../commands/sell.js";

export function capabilities() {
  return {
    edition: "metals-only",
    status: "PARTIAL",
    implements: ["metals.buy", "metals.sell"],
  };
}

export const commands = { buy: buyMetal, sell: sellMetal };
export { buyMetal, sellMetal };
export const queries = {};
