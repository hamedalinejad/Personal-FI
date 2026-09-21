import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppState, useGateway } from "../app/AppProviders";
import { metricLoading, metricUnavailable, type MetricVM } from "../viewModels/dashboardVm";
import { formatMoney } from "../formatters";
<<<<<<< HEAD
import { Button } from "../components/common/Button";
=======
>>>>>>> origin/main

/** Dashboard — gateway queries only; missing ≠ zero */
export function HomeScreen() {
  const { book } = useAppState();
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  const [metrics, setMetrics] = useState<MetricVM[]>([
<<<<<<< HEAD
    metricLoading("cash", "نقد"),
    metricUnavailable("netWorth", "ارزش خالص", "در انتظار گزارش"),
    metricUnavailable("investments", "سرمایه‌گذاری", "در انتظار ارزش‌گذاری"),
    metricUnavailable("loans", "وام", "در انتظار فهرست"),
=======
    metricLoading("cash", "Cash"),
    metricUnavailable("netWorth", "Net Worth", "await reportPack"),
    metricUnavailable("investments", "Investments", "await valuation"),
    metricUnavailable("loans", "Loans", "await listLoans"),
>>>>>>> origin/main
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
<<<<<<< HEAD
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
=======
      if (!gateway) {
        setMetrics([
          metricUnavailable("cash", "Cash", "host unwired"),
          metricUnavailable("netWorth", "Net Worth", "host unwired"),
          metricUnavailable("investments", "Investments", "host unwired"),
          metricUnavailable("loans", "Loans", "host unwired"),
        ]);
        return;
      }
      const dash = await gateway.execute<{
        netCash: string | null;
        netCashCurrency?: string | null;
        netCashNote?: string;
        accountCount: number;
      }>("dashboardSummary", {});
      const loans = await gateway.execute<{ loans: unknown[] }>("listLoans", {});
      const inv = await gateway.execute<{
        valuationState?: string;
        totals?: { totalCost?: string | null; holdingCount?: number };
      }>("listInvestmentHoldings", {
        valuationContext: { reportCurrency: book?.baseCurrency || null },
      });
      if (cancelled) return;
      const next: MetricVM[] = [];
      if (!dash.ok) {
        next.push(metricUnavailable("cash", "Cash", dash.code));
      } else if (dash.data.netCash == null) {
        next.push(metricUnavailable("cash", "Cash", dash.data.netCashNote || "mixed currency"));
      } else {
        next.push({
          id: "cash",
          label: "Cash",
          state: "ready",
          display: formatMoney(dash.data.netCash, dash.data.netCashCurrency || book?.baseCurrency || "IRR"),
          hint: `${dash.data.accountCount} accounts`,
        });
      }
      next.push(metricUnavailable("netWorth", "Net Worth", "await reportPack+valuation"));
      if (!inv.ok) {
        next.push(metricUnavailable("investments", "Investments", inv.code));
      } else {
        const st = inv.data?.valuationState || "unpriced";
        const hc = inv.data?.totals?.holdingCount ?? 0;
        const cost = inv.data?.totals?.totalCost;
        next.push({
          id: "investments",
          label: "Investments",
          state: st === "ready" && cost != null ? "ready" : "unavailable",
          display: st === "ready" && cost != null ? String(cost) : "—",
          hint: `state=${st}; holdings=${hc}`,
        });
      }
      if (!loans.ok) next.push(metricUnavailable("loans", "Loans", loans.code));
      else {
        const n = Array.isArray(loans.data?.loans) ? loans.data.loans.length : 0;
        next.push({
          id: "loans",
          label: "Loans",
          state: "ready",
          display: String(n),
          hint: "count only — balances via loan statements",
        });
>>>>>>> origin/main
      }
      setMetrics(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [gateway, book?.baseCurrency]);

  return (
<<<<<<< HEAD
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
=======
    <section>
      <h1>داشبورد</h1>
      <p className="muted">
        {book?.name} · پایه {book?.baseCurrency}
      </p>
      <div className="metrics">
        {metrics.map((m) => (
          <span key={m.id} className="metric" data-state={m.state} title={m.hint}>
            {m.label} {m.display}
          </span>
        ))}
      </div>
      <p className="muted">قیمت/FX ناموجود → «—» نه صفر · state روی هر metric</p>
      <div className="actions">
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "tx-quick" })}>
          + تراکنش
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "transfer" })}>
          انتقال
        </button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "loan-payment" })}>
          پرداخت وام
        </button>
      </div>
>>>>>>> origin/main
    </section>
  );
}
