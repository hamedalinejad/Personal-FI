/**
 * Browser boot: sql.js WASM + schema + IndexedDB durable host.
 * Falls closed if SQL.js cannot load — UI shows awaiting_host.
 */

import { setFinancialHost, type FinancialHostLike } from "./browserHostBridge";

declare global {
  interface Window {
    __PF_HOST__?: FinancialHostLike;
    initSqlJs?: (cfg?: { locateFile?: (f: string) => string }) => Promise<any>;
  }
}

async function loadSchemaSql(): Promise<string> {
  // Prefer bundled schema via fetch from public path or import raw
  try {
    const res = await fetch("/schema.sql");
    if (res.ok) return await res.text();
  } catch {
    /* continue */
  }
  // Minimal embed if public schema missing — openOrCreate still needs real schema for full app
  throw new Error("SCHEMA_SQL_REQUIRED: place docs/core/db/schema.sql at public/schema.sql");
}

async function loadSqlJs(): Promise<any> {
  if (typeof window === "undefined") throw new Error("NOT_BROWSER");
  // Dynamic script from CDN (sql.js official)
  if (!window.initSqlJs) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://sql.js.org/dist/sql-wasm.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("SQLJS_SCRIPT_LOAD_FAILED"));
      document.head.appendChild(s);
    });
  }
  if (!window.initSqlJs) throw new Error("SQLJS_RUNTIME_MISSING");
  const SQL = await window.initSqlJs({
    locateFile: (f) => `https://sql.js.org/dist/${f}`,
  });
  return SQL;
}

/**
 * Attempt production boot. Returns host or null.
 */
export async function tryBootProductionHost(opts?: {
  edition?: string;
  baseCurrency?: string;
}): Promise<{ host: FinancialHostLike; bookId: string | null; created: boolean } | null> {
  // Injected host wins (tests / native)
  if (window.__PF_HOST__) {
    setFinancialHost(window.__PF_HOST__);
    return { host: window.__PF_HOST__, bookId: null, created: false };
  }

  try {
    // Dynamic import of production boot (bundler resolves from monorepo alias if configured)
    const schemaSql = await loadSchemaSql().catch(() => null);
    const SQL = await loadSqlJs();
    let bootBrowserProductionHost: any = null;
    try {
      const mod = await import("../../../src/platform/web/browserProductionHost.js");
      bootBrowserProductionHost = mod.bootBrowserProductionHost;
    } catch (e) {
      console.warn("[PF] cannot import browserProductionHost", e);
    }

    if (!bootBrowserProductionHost) {
      console.warn("[PF] browserProductionHost module not reachable from Vite; inject __PF_HOST__");
      return null;
    }
    if (!schemaSql) {
      console.warn("[PF] schema.sql not found at /schema.sql");
      return null;
    }

    const result = await bootBrowserProductionHost({
      SQL,
      schemaSql,
      edition: opts?.edition || "standalone",
      baseCurrency: opts?.baseCurrency || "IRR",
    });

    // Adapt host to ApiResult shape expected by bridge (ok/success)
    const raw = result.host;
    const adapted: FinancialHostLike = {
      execute: async (id, input) => {
        const r = await raw.execute(id, input || {});
        return adapt(r);
      },
      query: async (id, input) => {
        const r = await raw.query(id, input || {});
        return adapt(r);
      },
      backup: raw.backup
        ? async (label) => adapt(await raw.backup(label))
        : undefined,
      restore: raw.restore
        ? async (pkg) => adapt(await raw.restore(pkg))
        : undefined,
    };

    setFinancialHost(adapted);
    return { host: adapted, bookId: result.bookId, created: result.created };
  } catch (e) {
    console.warn("[PF] production boot failed", e);
    return null;
  }
}

function adapt(r: any) {
  if (!r) return { ok: false, code: "EMPTY_RESULT", message: "empty" };
  if (typeof r.ok === "boolean") {
    if (r.ok) return { ok: true, data: r.data, invalidated: r.invalidated };
    return { ok: false, code: r.code || "ERROR", message: r.message || r.code || "ERROR" };
  }
  if (typeof r.success === "boolean") {
    if (r.success) return { ok: true, data: r.data, invalidated: r.invalidated };
    const err = r.errors?.[0];
    return {
      ok: false,
      code: err?.code || r.code || "ERROR",
      message: err?.message || r.message || "ERROR",
    };
  }
  return { ok: true, data: r };
}
