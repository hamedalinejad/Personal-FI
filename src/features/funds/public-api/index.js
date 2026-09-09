import { subscribeFund } from "../commands/subscribe.js";

export function capabilities() {
  return {
    edition: "fund-only",
    status: "PARTIAL",
    implements: ["fund.subscribe"],
  };
}

export const commands = { subscribe: subscribeFund };
export { subscribeFund };
export const queries = {};
