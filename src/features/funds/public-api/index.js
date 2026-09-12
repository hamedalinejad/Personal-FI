import { subscribeFund } from "../commands/subscribe.js";
import { redeemFund } from "../commands/redeem.js";

export function capabilities() {
  return {
    edition: "fund-only",
    status: "PARTIAL",
    implements: ["fund.subscribe", "fund.redeem"],
  };
}

export const commands = { subscribe: subscribeFund, redeem: redeemFund };
export { subscribeFund, redeemFund };
export const queries = {};
