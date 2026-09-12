import { buyCrypto } from "../commands/buy.js";
import { sellCrypto } from "../commands/sell.js";
import { transferCrypto } from "../commands/transfer.js";

export function capabilities() {
  return {
    edition: "crypto-only",
    status: "PARTIAL",
    implements: ["crypto.buy", "crypto.sell", "crypto.transfer"],
  };
}

export const commands = { buy: buyCrypto, sell: sellCrypto, transfer: transferCrypto };
export { buyCrypto, sellCrypto, transferCrypto };
export const queries = {};
