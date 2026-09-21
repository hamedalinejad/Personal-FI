/**
 * Bridges React gateway to FinancialHost.
 * Query detection: QUERY_CATALOG membership only.
 */
import { setGatewayBackend } from "../gateway/commandQueryGateway.js";
import { isQueryId } from "./queryIds.js";

let host = null;

export function setFinancialHost(next) {
  host = next;
  if (!next) {
    setGatewayBackend(null);
    return;
  }
  setGatewayBackend(async (id, input) => {
    if (isQueryId(id) && next.query) {
      return next.query(id, input);
    }
    return next.execute(id, input);
  });
}

export function getFinancialHost() {
  return host;
}

export function createHostBoundGateway() {
  return {
    async execute(id, input) {
      if (!host) {
        return {
          ok: false,
          code: "HOST_BRIDGE_UNWIRED",
          message: `"${id}" awaits FinancialHost (sql.js + IndexedDB or injection).`,
        };
      }
      try {
        if (isQueryId(id) && host.query) {
          return await host.query(id, input);
        }
        return await host.execute(id, input);
      } catch (e) {
        const message = String(e?.message || e);
        return { ok: false, code: message.split(":")[0] || "HOST_ERROR", message };
      }
    },
  };
}
