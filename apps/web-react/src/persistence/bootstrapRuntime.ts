/**
 * P0-01 / P0-02 — Browser runtime bootstrap.
 * Financial readiness comes from bound FinancialHost + book.get, NOT localStorage alone.
 *
 * Binding order:
 * 1) window.__PF_HOST__ (tests / native shell injection)
 * 2) explicit setFinancialHost from outside
 * Until bound: UI may render shell but gateway stays fail-closed (HOST_BRIDGE_UNWIRED).
 */

import {
  setFinancialHost,
  getFinancialHost,
  type FinancialHostLike,
} from "./browserHostBridge";

export type BootstrapPhase =
  | "bootstrapping"
  | "awaiting_host"
  | "ready"
  | "onboarding"
  | "recovery";

export type BookMeta = {
  id: string;
  name: string;
  baseCurrency: string;
  createdAt: string;
};

export type BootstrapResult = {
  phase: BootstrapPhase;
  book: BookMeta | null;
  hostBound: boolean;
  error: { code: string; message: string } | null;
  adapterNote: string;
};

const UI_PREFS_KEY = "pf.web.uiPrefs.v1";

/** Non-economic UI prefs only */
export function loadUiPrefs(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUiPrefs(prefs: Record<string, unknown>) {
  try {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

declare global {
  interface Window {
    __PF_HOST__?: FinancialHostLike;
  }
}

/**
 * Attempt to bind host from injection, then resolve book from DB metadata via host.
 */
export async function bootstrapRuntime(opts?: {
  edition?: string;
}): Promise<BootstrapResult> {
  const edition = opts?.edition || "full";

  // 1) Injected host (Node e2e, native, or test harness)
  if (typeof window !== "undefined" && window.__PF_HOST__) {
    setFinancialHost(window.__PF_HOST__);
  }

  const host = getFinancialHost();
  if (!host) {
    return {
      phase: "awaiting_host",
      book: null,
      hostBound: false,
      error: null,
      adapterNote:
        "No FinancialHost bound. Inject window.__PF_HOST__ or call setFinancialHost after sql.js+IDB open. UI must not treat localStorage as book existence.",
    };
  }

  // 2) Authoritative book metadata from host (DB), not localStorage
  try {
    const bookRes = await host.query("book.get", {});
    if (!bookRes.ok) {
      // Host works but no book yet → onboarding
      return {
        phase: "onboarding",
        book: null,
        hostBound: true,
        error: null,
        adapterNote: `edition=${edition}`,
      };
    }
    const data = bookRes.data as { name?: string | null; baseCurrency?: string | null };
    if (!data?.name || !data?.baseCurrency) {
      return {
        phase: "onboarding",
        book: null,
        hostBound: true,
        error: null,
        adapterNote: `edition=${edition}`,
      };
    }
    return {
      phase: "ready",
      book: {
        id: `db:${data.name}`,
        name: data.name,
        baseCurrency: data.baseCurrency,
        createdAt: new Date().toISOString(),
      },
      hostBound: true,
      error: null,
      adapterNote: `edition=${edition};book_from=host.query(book.get)`,
    };
  } catch (e) {
    return {
      phase: "recovery",
      book: null,
      hostBound: true,
      error: {
        code: "BOOTSTRAP_BOOK_QUERY_FAILED",
        message: String((e as Error)?.message || e),
      },
      adapterNote: `edition=${edition}`,
    };
  }
}

export function bindInjectedHost(host: FinancialHostLike | null) {
  setFinancialHost(host);
}
