import { buyMetal } from "../commands/buy.js";
import { sellMetal } from "../commands/sell.js";
import { deliverMetal } from "../commands/delivery.js";

export function capabilities() {
  return {
    edition: "metals-only",
    status: "PARTIAL",
    implements: ["metals.buy", "metals.sell", "metals.delivery"],
  };
}

export const commands = { buy: buyMetal, sell: sellMetal, delivery: deliverMetal };
export { buyMetal, sellMetal, deliverMetal };
export const queries = {};
