<<<<<<< HEAD
/**
 * Bridges React gateway to FinancialHost.
 * Query detection: QUERY_CATALOG membership only.
 */
import { setGatewayBackend } from "../gateway/commandQueryGateway.js";
import { isQueryId } from "./queryIds.js";
=======
/** JS twin of browserHostBridge.ts for Node tests */
import { setGatewayBackend } from "../gateway/commandQueryGateway.js";
>>>>>>> origin/main

let host = null;

export function setFinancialHost(next) {
  host = next;
  if (!next) {
    setGatewayBackend(null);
    return;
  }
  setGatewayBackend(async (id, input) => {
<<<<<<< HEAD
    if (isQueryId(id) && next.query) {
      return next.query(id, input);
    }
=======
    const isQuery =
      id.startsWith("list") ||
      id.startsWith("get") ||
      id === "accountActivity" ||
      id.endsWith("Summary") ||
      id === "dashboardSummary" ||
      id === "reportPack" ||
      id === "trialBalance" ||
      id === "book.get" ||
      id === "transactionReadModel";
    if (isQuery && next.query) return next.query(id, input);
>>>>>>> origin/main
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
<<<<<<< HEAD
          message: `"${id}" awaits FinancialHost (sql.js + IndexedDB or injection).`,
        };
      }
      try {
        if (isQueryId(id) && host.query) {
          return await host.query(id, input);
        }
=======
          message: `"${id}" awaits FinancialHost (sql.js + IndexedDB or Node dataDir).`,
        };
      }
      const isQuery =
        id.startsWith("list") ||
        id.startsWith("get") ||
        id === "accountActivity" ||
        id === "dashboardSummary" ||
        id === "reportPack" ||
        id === "trialBalance" ||
        id === "book.get" ||
        id === "transactionReadModel";
      try {
        if (isQuery && host.query) return await host.query(id, input);
>>>>>>> origin/main
        return await host.execute(id, input);
      } catch (e) {
        const message = String(e?.message || e);
        return { ok: false, code: message.split(":")[0] || "HOST_ERROR", message };
      }
    },
  };
}
