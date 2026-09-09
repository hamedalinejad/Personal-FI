import { buyMetal } from "../commands/buy.js";

export function capabilities() {
  return {
    edition: "metals-only",
    status: "PARTIAL",
    implements: ["metals.buy"],
  };
}

export const commands = { buy: buyMetal };
export { buyMetal };
export const queries = {};
