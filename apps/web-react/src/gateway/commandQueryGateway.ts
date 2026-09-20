/**
 * Application gateway — orchestration only.
 * Production browser: inject PersistenceProvider + setGatewayBackend.
 * Node/tests: use src/web/hostGateway.js via setGatewayBackend.
 */

export type ApiResult<T = unknown> =
  | { ok: true; data: T; invalidated?: string[] }
  | { ok: false; code: string; message: string };

export interface Gateway {
  execute<T = unknown>(commandOrQueryId: string, input?: unknown): Promise<ApiResult<T>>;
}

type Backend = (id: string, input?: unknown) => Promise<ApiResult<unknown>>;

let backend: Backend | null = null;

export function setGatewayBackend(next: Backend | null) {
  backend = next;
}

export function getGatewayBackend(): Backend | null {
  return backend;
}

function toFailure(error: unknown): ApiResult<never> {
  const e = error as { code?: string; message?: string };
  const message = e?.message || String(error);
  const code = e?.code || (typeof message === "string" ? message.split(":")[0] : "APPLICATION_ERROR");
  return { ok: false, code, message };
}

export function createBrowserGateway(_edition = "full"): Gateway {
  return {
    async execute<T = unknown>(id: string, input?: unknown) {
      if (!backend) {
        return {
          ok: false,
          code: "HOST_BRIDGE_UNWIRED",
          message: `"${id}" awaits PersistenceProvider / setGatewayBackend.`,
        };
      }
      try {
        const result = await backend(id, input);
        return result as ApiResult<T>;
      } catch (error) {
        return toFailure(error);
      }
    },
  };
}

import { useMemo } from "react";
import { createHostBoundGateway } from "../persistence/browserHostBridge";

/** React hook — gateway bound to FinancialHost or fail-closed */
export function useGateway(): Gateway {
  return useMemo(() => createHostBoundGateway(), []);
}
