<<<<<<< HEAD
/**
 * /investments — unified holdings. BUG-P1-01..07:
 * - no silent crypto fallback on unified failure
 * - no coerce unknown asset → crypto
 * - missing quantity stays unavailable (not "0")
 * - valuation state never defaults to ready
 * - shared valuation vocabulary
 * - asset-aware action registry + edition capability filter
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useGateway } from "../app/AppProviders";
import {
  VALUATION_STATES,
  normalizeValuationState,
  normalizeAssetClass,
  ALLOWED_ASSET_CLASSES,
} from "../contracts/valuationState";

type HoldingRow = {
  instrumentId: string;
  symbol?: string | null;
  assetClass: string | null;
  quantity: string | null;
  costBasis?: string | null;
  costCurrency?: string | null;
  marketValue?: string | null;
  unrealizedPnl?: string | null;
  valuationState?: string;
  reason?: string | null;
  invalid?: boolean;
};

type ValuationState = (typeof VALUATION_STATES)[number];

const ACTION_REGISTRY: Record<string, string[]> = {
  crypto: ["buy", "sell", "transfer"],
  stocks: ["buy", "sell", "settle", "dividend"],
  funds: ["subscribe", "redeem", "distribution"],
  metals: ["buy", "sell", "delivery"],
};

function quantityDisplay(q: unknown): string {
  if (q === null || q === undefined || q === "") return "—"; // unavailable, not zero
  return String(q);
}

export function InvestmentsScreen() {
  const gateway = useGateway();
  const [rows, setRows] = useState<HoldingRow[]>([]);
  const [valuationState, setValuationState] = useState<ValuationState | "invalid_context">("loading");
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<string[] | null>(null);
  const [activeAsset, setActiveAsset] = useState<string>("crypto");
  const [sheet, setSheet] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setValuationState("loading");
    try {
      const res = await gateway.execute("investments.holdings", {});
      // Prefer query path when host supports it
      const q = await gateway.execute("investments.holdings" as string, {}).catch(() => res);

      if (!q || (q as { ok?: boolean }).ok === false) {
        // BUG-P1-01: do NOT fall back to crypto-only
        const code = (q as { code?: string })?.code || "UNIFIED_HOLDINGS_FAILED";
        const message = (q as { message?: string })?.message || "Unified investment holdings failed";
        setError(`${code}: ${message}`);
        // keep prior rows if any
        setValuationState("error");
        return;
      }

      const data = (q as { data?: unknown }).data as {
        rows?: unknown[];
        valuationState?: string;
        state?: string;
      } | null;

      const rawState = data?.valuationState ?? data?.state;
      // BUG-P1-04: never default to ready
      const state = normalizeValuationState(rawState);
      if (rawState != null && !VALUATION_STATES.includes(rawState as ValuationState)) {
        setError(`INVALID_VALUATION_STATE:${String(rawState)}`);
        setValuationState("error");
      } else {
        setValuationState(state as ValuationState);
      }

      const mapped: HoldingRow[] = [];
      for (const h of data?.rows || []) {
        const row = h as Record<string, unknown>;
        const assetClass = normalizeAssetClass(row.assetClass ?? row.asset_class);
        if (!assetClass) {
          // BUG-P1-02: do not coerce to crypto
          mapped.push({
            instrumentId: String(row.instrumentId || row.instrument_id || "?"),
            symbol: (row.symbol as string) || null,
            assetClass: null,
            quantity: null,
            invalid: true,
            reason: `QUERY_CONTRACT_INVALID:assetClass=${String(row.assetClass ?? row.asset_class)}`,
            valuationState: "error",
          });
          continue;
        }
        const qtyRaw = row.quantity;
        mapped.push({
          instrumentId: String(row.instrumentId || row.instrument_id || ""),
          symbol: (row.symbol as string) || null,
          assetClass,
          quantity: qtyRaw === null || qtyRaw === undefined || qtyRaw === "" ? null : String(qtyRaw),
          costBasis: row.costBasis != null ? String(row.costBasis) : row.cost_basis != null ? String(row.cost_basis) : null,
          costCurrency: (row.costCurrency || row.cost_currency) as string | null,
          marketValue: row.marketValue != null ? String(row.marketValue) : null,
          unrealizedPnl: row.unrealizedPnl != null ? String(row.unrealizedPnl) : null,
          valuationState: normalizeValuationState(row.valuationState),
          reason: (row.reason as string) || null,
        });
      }
      setRows(mapped);
    } catch (e) {
      setError(String((e as Error)?.message || e));
      setValuationState("error");
    }
  }, [gateway]);
=======
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppState, useGateway } from "../app/AppProviders";
import type { HoldingRowVM, ValuationContextVM } from "../viewModels/investmentVm";
import { moneyOrDash } from "../viewModels/investmentVm";
import { formatMoney } from "../formatters";

const TABS = ["all", "crypto", "stocks", "funds", "metals"] as const;
type Tab = (typeof TABS)[number];

type ReportHolding = {
  id?: string;
  holdingId?: string;
  assetClass?: string;
  assetType?: string;
  instrumentId?: string;
  symbol?: string;
  quantity?: string;
  cost?: string;
  costCurrency?: string;
  marketValue?: string | null;
  marketCurrency?: string | null;
  unrealizedPnl?: string | null;
  priceAsOf?: string | null;
  priceSource?: string | null;
  valuationState?: string;
};

/** Unified holdings from Core investmentHoldings — no fake empty shells */
export function InvestmentsScreen() {
  const { book } = useAppState();
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  const [tab, setTab] = useState<Tab>("all");
  const [holdings, setHoldings] = useState<HoldingRowVM[]>([]);
  const [totals, setTotals] = useState<{
    totalCost: string | null;
    totalMarket: string | null;
    totalUnrealized: string | null;
    mixed?: boolean;
  }>({ totalCost: null, totalMarket: null, totalUnrealized: null });
  const [valuationState, setValuationState] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);
  const [asOf, setAsOf] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const res = await gateway.execute<{
      holdings?: ReportHolding[];
      totals?: Record<string, unknown>;
      valuationState?: string;
      valuationContext?: { degraded?: boolean };
    }>("listInvestmentHoldings", {
      valuationContext: {
        reportCurrency: book?.baseCurrency || null,
        asOf: asOf || null,
      },
    });
    if (!res.ok) {
      // fallback crypto-only list if report fails
      const crypto = await gateway.execute<{ holdings?: Array<Record<string, string>> }>("listCryptoHoldings", {});
      if (crypto.ok) {
        setHoldings(
          (crypto.data?.holdings || []).map((h) => ({
            id: String(h.id),
            assetType: "crypto" as const,
            instrumentLabel: String(h.instrumentId || h.id),
            quantityDisplay: String(h.quantity || "0"),
            cost: moneyOrDash(h.costBasis, h.costBasis ? "ok" : "unavailable"),
            marketValue: moneyOrDash(null, "unavailable"),
            unrealizedPnl: moneyOrDash(null, "unavailable"),
            priceDate: null,
            fxStatus: "n/a" as const,
          })),
        );
        setValuationState("unpriced");
        setTotals({ totalCost: null, totalMarket: null, totalUnrealized: null });
        return;
      }
      setError(res.code);
      setHoldings([]);
      setValuationState("error");
      return;
    }
    const rows = (res.data?.holdings || []).map((h) => {
      const assetType = (h.assetClass || h.assetType || "crypto") as HoldingRowVM["assetType"];
      const mv = h.marketValue;
      const cost = h.cost;
      return {
        id: String(h.id || h.holdingId || h.instrumentId),
        assetType: (["crypto", "stocks", "funds", "metals"].includes(assetType)
          ? assetType
          : "crypto") as HoldingRowVM["assetType"],
        instrumentLabel: String(h.symbol || h.instrumentId || h.id),
        quantityDisplay: String(h.quantity || "0"),
        cost: moneyOrDash(cost, cost != null ? "ok" : "unavailable"),
        marketValue: moneyOrDash(mv, mv == null ? "unavailable" : "ok"),
        unrealizedPnl: moneyOrDash(
          h.unrealizedPnl,
          h.unrealizedPnl == null ? "unavailable" : "ok",
        ),
        priceDate: h.priceAsOf || null,
        fxStatus: (res.data?.valuationState === "missing_fx" ? "missing" : "n/a") as HoldingRowVM["fxStatus"],
      };
    });
    setHoldings(rows);
    const t = res.data?.totals || {};
    setTotals({
      totalCost: (t.totalCost as string) ?? null,
      totalMarket: (t.totalMarketValue as string) ?? null,
      totalUnrealized: (t.totalUnrealizedPnl as string) ?? null,
      mixed: Boolean(t.mixedCurrencyWithoutReportCurrency),
    });
    setValuationState(String(res.data?.valuationState || "ready"));
  }, [gateway, book?.baseCurrency, asOf]);
>>>>>>> origin/main

  useEffect(() => {
    void load();
  }, [load]);

<<<<<<< HEAD
  useEffect(() => {
    // BUG-P1-07: capability query for UX gating (host still enforces)
    void (async () => {
      try {
        const res = await gateway.execute("meta.license", {});
        if ((res as { ok?: boolean; success?: boolean }).ok !== false && (res as { success?: boolean }).success !== false) {
          const data = (res as { data?: { capabilities?: string[] } }).data;
          setCapabilities(data?.capabilities || null);
        }
      } catch {
        setCapabilities(null);
      }
    })();
  }, [gateway]);

  const actions = useMemo(() => {
    const list = ACTION_REGISTRY[activeAsset] || [];
    if (!capabilities) return list;
    // filter by capability if edition restricts
    return list.filter((action) => {
      const cmd = `${activeAsset === "stocks" ? "stocks" : activeAsset}.${action === "subscribe" ? "subscribe" : action}`;
      if (capabilities.includes("*")) return true;
      return capabilities.some(
        (c) => c === cmd || c === `${activeAsset}.*` || c.endsWith(".*") && cmd.startsWith(c.slice(0, -1))
      );
    });
  }, [activeAsset, capabilities]);

  return (
    <div className="screen investments" dir="rtl" lang="fa">
      <header className="screen-header">
        <h1>سرمایه‌گذاری‌ها</h1>
        <button type="button" onClick={() => void load()}>
          بروزرسانی
        </button>
      </header>

      <div className="valuation-banner" data-state={valuationState} role="status">
        وضعیت ارزش‌گذاری: <strong>{valuationState}</strong>
      </div>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
          <p className="muted">خطای گزارش یکپارچه — بدون fallback خودکار به crypto</p>
        </div>
      ) : null}

      <div className="asset-tabs" role="tablist">
        {ALLOWED_ASSET_CLASSES.map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={activeAsset === a}
            onClick={() => setActiveAsset(a)}
          >
            {a}
=======
  const valuation: ValuationContextVM = useMemo(
    () => ({
      reportCurrency: book?.baseCurrency || "IRR",
      asOf: asOf || null,
      priceFreshness:
        valuationState === "stale" ? "stale" : valuationState === "ready" ? "fresh" : "unknown",
      fxStatus:
        valuationState === "missing_fx"
          ? "missing"
          : valuationState === "mixed_currency_needs_report_currency"
            ? "partial"
            : valuationState === "ready"
              ? "ok"
              : "missing",
    }),
    [book?.baseCurrency, asOf, valuationState],
  );

  const filtered = holdings.filter((h) => tab === "all" || h.assetType === tab);

  function metricDisplay(v: string | null, mixed?: boolean) {
    if (mixed) return "— (mixed ccy)";
    if (v == null) return "—";
    if (v === "0") return "0";
    return formatMoney(v, book?.baseCurrency || "IRR");
  }

  return (
    <section>
      <header className="page-header">
        <h1>سرمایه‌گذاری</h1>
      </header>

      <div className="valuation-bar" aria-label="valuation context">
        <span>ارز گزارش: {valuation.reportCurrency}</span>
        <span>
          As of:{" "}
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            aria-label="as-of"
          />
        </span>
        <span>قیمت: {valuation.priceFreshness}</span>
        <span>FX: {valuation.fxStatus}</span>
        <span>state: {valuationState}</span>
      </div>

      <div className="metrics">
        <span className="metric">Cost {metricDisplay(totals.totalCost, totals.mixed)}</span>
        <span className="metric">Market {metricDisplay(totals.totalMarket, totals.mixed)}</span>
        <span className="metric">uPnL {metricDisplay(totals.totalUnrealized, totals.mixed)}</span>
      </div>

      <div className="filters" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
>>>>>>> origin/main
          </button>
        ))}
      </div>

<<<<<<< HEAD
      <div className="actions-bar">
        {actions.map((action) => (
          <button key={action} type="button" onClick={() => setSheet(`${activeAsset}.${action}`)}>
            {action}
          </button>
        ))}
      </div>

      <table className="holdings-table">
        <thead>
          <tr>
            <th>نماد</th>
            <th>کلاس</th>
            <th>مقدار</th>
            <th>بهای تمام‌شده</th>
            <th>ارزش بازار</th>
            <th>سود/زیان</th>
            <th>وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7}>نگهداری ثبت‌نشده</td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.instrumentId} data-invalid={r.invalid ? "1" : "0"}>
                <td>{r.symbol || r.instrumentId}</td>
                <td>{r.assetClass ?? "INVALID"}</td>
                <td>{quantityDisplay(r.quantity)}</td>
                <td>{r.costBasis ?? "—"}</td>
                <td>{r.marketValue ?? "—"}</td>
                <td>{r.unrealizedPnl ?? "—"}</td>
                <td>{r.invalid ? r.reason : r.valuationState}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {sheet ? (
        <p className="muted">
          اکشن انتخاب‌شده: {sheet} (sheet جدا در SheetHost باز می‌شود)
          <button type="button" onClick={() => setSheet(null)}>
            بستن
          </button>
        </p>
      ) : null}
    </div>
  );
}

export default InvestmentsScreen;
=======
      {error ? <p className="form-error">{error}</p> : null}

      {filtered.length === 0 ? (
        <p className="empty">Holdingی نیست · state={valuationState}</p>
      ) : (
        <ul className="list">
          {filtered.map((h) => (
            <li key={h.id}>
              <strong>{h.instrumentLabel}</strong> · {h.assetType} · qty {h.quantityDisplay}
              <br />
              cost {h.cost.display} · market {h.marketValue.display} · uPnL {h.unrealizedPnl.display}
              {h.priceDate ? <span className="muted"> · priceAsOf {h.priceDate}</span> : null}
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button type="button" onClick={() => void load()}>
          تازه‌سازی
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "crypto-buy" })}>
          Crypto Buy
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "crypto-sell" })}>
          Crypto Sell
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "stocks-buy" })}>
          Stocks Buy
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "stocks-sell" })}>
          Stocks Sell
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "funds-subscribe" })}>
          Funds Subscribe
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "funds-redeem" })}>
          Funds Redeem
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "metals-buy" })}>
          Metals Buy
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "metals-delivery" })}>
          Metals Delivery
        </button>
      </div>
    </section>
  );
}
>>>>>>> origin/main
