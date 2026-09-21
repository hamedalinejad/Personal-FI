import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppState, useGateway } from "../app/AppProviders";
import { metricLoading, metricUnavailable, type MetricVM } from "../viewModels/dashboardVm";
import { formatMoney } from "../formatters";
import { Button } from "../components/common/Button";

/** Dashboard — gateway queries only; missing ≠ zero */
export function HomeScreen() {
  const { book } = useAppState();
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  const [metrics, setMetrics] = useState<MetricVM[]>([
    metricLoading("cash", "نقد"),
    metricUnavailable("netWorth", "ارزش خالص", "در انتظار گزارش"),
    metricUnavailable("investments", "سرمایه‌گذاری", "در انتظار ارزش‌گذاری"),
    metricUnavailable("loans", "وام", "در انتظار فهرست"),
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const totals = await gateway.execute<{
        netCash: string | null;
        netCashState?: string;
        byCurrency?: { currency: string; balance: string }[];
        currencies?: string[];
      }>("money.totals", {});
      const loans = await gateway.execute<{ loans: unknown[] }>("loans.list", {});
      const inv = await gateway.execute<{
        valuationState?: string;
        state?: string;
        totals?: { totalCost?: string | null; holdingCount?: number };
      }>("investments.holdings", {});
      const nw = await gateway.execute<{ netWorth?: string }>("reports.netWorth", {});
      if (cancelled) return;
      const next: MetricVM[] = [];
      if (!totals.ok) {
        next.push(metricUnavailable("cash", "نقد", totals.code));
      } else if (totals.data.netCash == null) {
        next.push(
          metricUnavailable(
            "cash",
            "نقد",
            totals.data.netCashState || "mixed currency"
          )
        );
      } else {
        next.push({
          id: "cash",
          label: "نقد",
          state: "ready",
          display: formatMoney(totals.data.netCash, book?.baseCurrency || "IRR"),
          hint: (totals.data.byCurrency || [])
            .map((c) => `${c.currency}: ${c.balance}`)
            .join(" · "),
        });
      }
      if (!nw.ok) next.push(metricUnavailable("netWorth", "ارزش خالص", nw.code));
      else
        next.push({
          id: "netWorth",
          label: "ارزش خالص",
          state: "ready",
          display: formatMoney(nw.data?.netWorth ?? "0", book?.baseCurrency || "IRR"),
        });
      if (!inv.ok) next.push(metricUnavailable("investments", "سرمایه‌گذاری", inv.code));
      else {
        const st = inv.data?.valuationState || inv.data?.state || "unpriced";
        const hc = inv.data?.totals?.holdingCount ?? 0;
        next.push({
          id: "investments",
          label: "سرمایه‌گذاری",
          state: st === "ready" ? "ready" : "unavailable",
          display: st === "ready" ? String(inv.data?.totals?.totalCost ?? "—") : "—",
          hint: `state=${st}; n=${hc}`,
        });
      }
      if (!loans.ok) next.push(metricUnavailable("loans", "وام", loans.code));
      else {
        const n = Array.isArray(loans.data?.loans) ? loans.data.loans.length : 0;
        next.push({ id: "loans", label: "وام", state: "ready", display: String(n) });
      }
      setMetrics(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [gateway, book?.baseCurrency]);

  return (
    <section dir="rtl" lang="fa" className="screen">
      <header className="screen-header">
        <div>
          <h1>خانه</h1>
          {book ? (
            <p className="muted">
              {book.name} · {book.baseCurrency}
            </p>
          ) : null}
        </div>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "deposit" })}>
          واریز سریع
        </Button>
      </header>
      <ul className="card-list">
        {metrics.map((m) => (
          <li key={m.id} className="account-card">
            <strong>{m.label}</strong>
            <div className="money">{m.display ?? "—"}</div>
            {m.hint ? <p className="muted">{m.hint}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
