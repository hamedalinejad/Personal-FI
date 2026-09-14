import { subscribeFund } from "../commands/subscribe.js";
import { redeemFund } from "../commands/redeem.js";
import { distributeFund } from "../commands/distribution.js";

export function capabilities() {
  return {
    edition: "fund-only",
    status: "PARTIAL",
    implements: ["funds.subscribe", "funds.redeem", "funds.distribute"],
  };
}

export const commands = {
  subscribe: subscribeFund,
  redeem: redeemFund,
  distribution: distributeFund,
};
export { subscribeFund, redeemFund, distributeFund };
export const queries = {};
