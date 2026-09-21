/**
 * Bind FinancialHost in browser: sql.js (CDN) + schema + IndexedDB Core.
 */

import { setFinancialHost, type FinancialHostLike } from "./browserHostBridge";

export type BootResult =
  | { ok: true; host: FinancialHostLike; bookId: string | null; created: boolean }
  | { ok: false; code: string; message: string };

declare global {
  interface Window {
    __PF_HOST__?: FinancialHostLike;
    initSqlJs?: (cfg?: { locateFile?: (f: string) => string }) => Promise<any>;
  }
}

function adapt(r: any) {
  if (!r) return { ok: false as const, code: "EMPTY_RESULT", message: "empty" };
  if (typeof r.ok === "boolean") {
    if (r.ok) return { ok: true as const, data: r.data, invalidated: r.invalidated };
    return { ok: false as const, code: r.code || "ERROR", message: r.message || r.code || "ERROR" };
  }
  if (typeof r.success === "boolean") {
    if (r.success) return { ok: true as const, data: r.data, invalidated: r.invalidated };
    const err = r.errors?.[0];
    return {
      ok: false as const,
      code: err?.code || r.code || "ERROR",
      message: err?.message || r.message || "ERROR",
    };
  }
  return { ok: true as const, data: r };
}

async function loadSchemaSql(): Promise<string> {
  const res = await fetch("/schema.sql");
  if (!res.ok) {
    throw Object.assign(new Error("SCHEMA_SQL_REQUIRED: public/schema.sql missing"), {
      code: "SCHEMA_SQL_REQUIRED",
    });
  }
  return res.text();
}

/** CDN only — no static import("sql.js") so Vite never requires the npm package at transform time. */
async function loadSqlJs(): Promise<any> {
  if (typeof window === "undefined") {
    throw Object.assign(new Error("NOT_BROWSER"), { code: "NOT_BROWSER" });
  }
  const localJs = "/sqljs/sql-wasm.js";
  const localWasm = (f: string) => `/sqljs/${f}`;
  const cdnJs = "https://sql.js.org/dist/sql-wasm.js";
  const cdnWasm = (f: string) => `https://sql.js.org/dist/${f}`;

  async function inject(src: string): Promise<void> {
    if (window.initSqlJs) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[data-pf-sqljs="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(Object.assign(new Error("SQLJS_SCRIPT_LOAD_FAILED"), { code: "SQLJS_SCRIPT_LOAD_FAILED" }))
        );
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.dataset.pfSqljs = src;
      s.onload = () => resolve();
      s.onerror = () =>
        reject(Object.assign(new Error("SQLJS_SCRIPT_LOAD_FAILED"), { code: "SQLJS_SCRIPT_LOAD_FAILED" }));
      document.head.appendChild(s);
    });
  }

  let locate = localWasm;
  try {
    await inject(localJs);
  } catch {
    locate = cdnWasm;
    await inject(cdnJs);
  }
  if (!window.initSqlJs) {
    throw Object.assign(new Error("SQLJS_RUNTIME_MISSING"), { code: "SQLJS_RUNTIME_MISSING" });
  }
  const SQL = await window.initSqlJs({ locateFile: locate });
  if (!SQL?.Database) {
    throw Object.assign(new Error("SQLJS_DATABASE_MISSING"), { code: "SQLJS_DATABASE_MISSING" });
  }
  return SQL;
}

export async function tryBootProductionHost(opts?: {
  edition?: string;
  baseCurrency?: string;
}): Promise<BootResult> {
  try {
    if (typeof window !== "undefined" && window.__PF_HOST__) {
      setFinancialHost(window.__PF_HOST__);
      return { ok: true, host: window.__PF_HOST__, bookId: null, created: false };
    }

    const schemaSql = await loadSchemaSql();
    const SQL = await loadSqlJs();

    const [{ openOrCreateBrowserDb }, { createFinancialHost }, registry, investment, backup] =
      await Promise.all([
        import("@pf/core/persistence/browser/browserSqlAdapter.js"),
        import("@pf/platform/web/financialHost.js"),
        import("@pf/application/publicApiRegistry.js"),
        import("@pf/core/accounting/reports/investment.js"),
        import("@pf/core/recovery/backupPackage.js"),
      ]);

    const { db, created, bookId } = await openOrCreateBrowserDb({
      SQL,
      schemaSql,
      createIfMissing: true,
      baseCurrency: opts?.baseCurrency || "IRR",
    });

    const queryHandlers = {
      ...registry.queryHandlers,
      "investments.holdings": async ({ db: d }: any) => {
        try {
          const { queryAll, getMeta } = await import("@pf/core/persistence/browser/browserSqlAdapter.js");
          const holdings = queryAll(
            d,
            `SELECT instrument_id as instrumentId, quantity, total_invested as costBasis, cost_currency as costCurrency
             FROM inv_crypto_holdings`
          ).map((h: any) => ({ ...h, assetClass: "crypto", symbol: h.instrumentId }));
          const result = investment.valueHoldings({
            holdings,
            prices: new Map(),
            reportCurrency: getMeta(d, "book_base_currency") || opts?.baseCurrency || "IRR",
          });
          return {
            rows: result.rows,
            valuationState: result.state,
            state: result.state,
            totals: result.totals,
            reason: result.reason,
            meta: result.meta,
          };
        } catch {
          return {
            rows: [],
            valuationState: "unpriced",
            state: "unpriced",
            totals: { holdingCount: 0 },
          };
        }
      },
    };

    const raw = createFinancialHost({
      db,
      edition: opts?.edition || "standalone",
      commandHandlers: registry.commandHandlers,
      queryHandlers,
    });

    (raw as any).backup = async (label?: string) => {
      const pkg = await backup.createBackupPackage(db, { label });
      return { success: true, data: pkg };
    };
    (raw as any).restore = async (pkg: any) => backup.restoreBackupPackage(pkg, { SQL, schemaSql });

    const adapted: FinancialHostLike = {
      execute: async (id, input) => adapt(await raw.execute(id, input || {})),
      query: async (id, input) => adapt(await raw.query(id, input || {})),
      backup: async (label) => adapt(await (raw as any).backup(label)),
      restore: async (pkg) => adapt(await (raw as any).restore(pkg)),
    };

    setFinancialHost(adapted);
    return { ok: true, host: adapted, bookId: bookId ?? null, created: !!created };
  } catch (e: any) {
    return {
      ok: false,
      code: e?.code || "BOOT_FAILED",
      message: e?.message || String(e),
    };
  }
}
