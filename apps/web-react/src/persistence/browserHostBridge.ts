/**
<<<<<<< HEAD
 * Bridges React gateway to FinancialHost (browser sql.js + IDB or injected).
 * P1-21: query detection uses QUERY_CATALOG exact membership only.
 */
import type { ApiResult, Gateway } from "../gateway/commandQueryGateway";
import { setGatewayBackend } from "../gateway/commandQueryGateway";
import { isQueryId } from "./queryIds";
=======
 * Bridges React gateway to FinancialHost (Node/dev) or fail-closed browser.
 */
import type { ApiResult, Gateway } from "../gateway/commandQueryGateway";
import { setGatewayBackend } from "../gateway/commandQueryGateway";
>>>>>>> origin/main

export type FinancialHostLike = {
  execute(commandId: string, input?: unknown): Promise<ApiResult<unknown>>;
  query(queryId: string, input?: unknown): Promise<ApiResult<unknown>>;
  backup?(label?: string): Promise<ApiResult<unknown>>;
<<<<<<< HEAD
  restore?(pkg: unknown): Promise<ApiResult<unknown>>;
=======
  restore?(path: unknown): Promise<ApiResult<unknown>>;
>>>>>>> origin/main
  getRecoveryState?(): Promise<ApiResult<unknown>>;
};

let host: FinancialHostLike | null = null;

export function setFinancialHost(next: FinancialHostLike | null) {
  host = next;
  if (!next) {
    setGatewayBackend(null);
    return;
  }
  setGatewayBackend(async (id, input) => {
<<<<<<< HEAD
    if (isQueryId(id) && next.query) {
      return next.query(id, input) as Promise<ApiResult<unknown>>;
    }
    return next.execute(id, input) as Promise<ApiResult<unknown>>;
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
    return next.execute(id, input);
>>>>>>> origin/main
  });
}

export function getFinancialHost(): FinancialHostLike | null {
  return host;
}

export function createHostBoundGateway(): Gateway {
  return {
    async execute<T = unknown>(id: string, input?: unknown) {
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
          return (await host.query(id, input)) as ApiResult<T>;
        }
=======
          message: `"${id}" awaits FinancialHost (sql.js + IndexedDB or Node dataDir).`,
        };
      }
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
      try {
        if (isQuery && host.query) return (await host.query(id, input)) as ApiResult<T>;
>>>>>>> origin/main
        return (await host.execute(id, input)) as ApiResult<T>;
      } catch (e) {
        const message = String((e as Error)?.message || e);
        return { ok: false, code: message.split(":")[0] || "HOST_ERROR", message };
      }
    },
  };
}
