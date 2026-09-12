import { buyCrypto } from "../commands/buy.js";
import { sellCrypto } from "../commands/sell.js";

export function capabilities() {
  return {
    edition: "crypto-only",
    status: "PARTIAL",
    implements: ["crypto.buy", "crypto.sell"],
  };
}

export const commands = { buy: buyCrypto, sell: sellCrypto };
export { buyCrypto, sellCrypto };
export const queries = {};
