import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useGateway } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { InlineError } from "../components/common/InlineError";
import { LoadingState } from "../components/common/LoadingState";
import {
  normalizeValuationState,
  normalizeAssetClass,
} from "../contracts/valuationState";

const TABS = [
  { id: "all", label: "همه" },
  { id: "crypto", label: "کریپتو" },
  { id: "stocks", label: "سهام ایران" },
  { id: "funds", label: "صندوق" },
  { id: "metals", label: "فلزات" },
] as const;

const ACTIONS: Record<string, { sheet: string; label: string }[]> = {
  crypto: [
    { sheet: "crypto.buy", label: "خرید" },
    { sheet: "crypto.sell", label: "فروش" },
    { sheet: "crypto.transfer", label: "انتقال" },
    { sheet: "crypto.c2c", label: "C2C" },
  ],
  stocks: [
    { sheet: "stocks.buy", label: "خرید" },
    { sheet: "stocks.sell", label: "فروش" },
    { sheet: "stocks.dividend", label: "سود" },
    { sheet: "stocks.corporateAction", label: "رویداد شرکتی" },
  ],
  funds: [
    { sheet: "fund.subscribe", label: "خرید واحد" },
    { sheet: "fund.redeem", label: "ابطال" },
    { sheet: "fund.nav", label: "NAV" },
    { sheet: "fund.distribution", label: "توزیع" },
    { sheet: "fund.reinvest", label: "Reinvest" },
  ],
  metals: [
    { sheet: "metals.buy", label: "خرید" },
    { sheet: "metals.sell", label: "فروش" },
    { sheet: "metals.delivery", label: "تحویل فیزیکی" },
  ],
  all: [
    { sheet: "crypto.buy", label: "کریپتو" },
    { sheet: "stocks.buy", label: "سهام" },
    { sheet: "fund.subscribe", label: "صندوق" },
    { sheet: "metals.buy", label: "فلز" },
  ],
};

export function InvestmentsScreen() {
  const gateway = useGateway();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [rows, setRows] = useState<any[]>([]);
  const [state, setState] = useState<string>("unpriced");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const open = (sheet: string) => dispatch({ type: "OPEN_SHEET", sheet });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await gateway.execute<any>("investments.holdings", {});
    if (!res.ok) {
      setError(res.message || res.code);
      setRows([]);
    } else {
      const data = res.data || {};
      setRows(data.rows || []);
      setState(normalizeValuationState(data.valuationState || data.state || "unpriced"));
    }
    setLoading(false);
  }, [gateway]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => normalizeAssetClass(r.assetClass) === tab);
  }, [rows, tab]);

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>سرمایه‌گذاری</h1>
          <p className="subtitle">پرتفوی یکپارچه · valuation: {state}</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => void load()}>
          تازه‌سازی
        </Button>
      </header>

      <div className="row gap" style={{ flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={tab === t.id ? "soft" : "ghost"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="panel stack">
        <div className="section-title">عملیات {TABS.find((t) => t.id === tab)?.label}</div>
        <div className="row gap" style={{ flexWrap: "wrap" }}>
          {(ACTIONS[tab] || ACTIONS.all).map((a) => (
            <Button key={a.sheet} type="button" variant="ghost" onClick={() => open(a.sheet)}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <InlineError message={error} /> : null}
      {!loading && visible.length === 0 ? (
        <EmptyState title="موجودی نیست" hint="از عملیات بالا یک معامله ثبت کنید." />
      ) : null}

      <ul className="card-list">
        {visible.map((r, i) => (
          <li key={r.instrumentId || i} className="list-card">
            <strong>{r.symbol || r.instrumentId || "—"}</strong>
            <span className="muted">
              {" "}
              {normalizeAssetClass(r.assetClass) || "?"} · qty {r.quantity ?? "—"}
            </span>
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              {r.valuationState || state}
              {r.reason ? ` · ${r.reason}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
