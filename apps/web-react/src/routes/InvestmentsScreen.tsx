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
import { useGateway } from "../gateway/commandQueryGateway";
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

  useEffect(() => {
    void load();
  }, [load]);

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
          </button>
        ))}
      </div>

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
