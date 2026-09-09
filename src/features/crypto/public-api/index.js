import { buyCrypto } from "../commands/buy.js";

export function capabilities() {
  return {
    edition: "crypto-only",
    status: "PARTIAL",
    implements: ["crypto.buy"],
  };
}

export const commands = {
  buy: buyCrypto,
};

export { buyCrypto };
export const queries = {};
