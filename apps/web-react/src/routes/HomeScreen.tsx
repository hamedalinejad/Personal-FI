import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppState, useGateway } from "../app/AppProviders";
import { metricLoading, metricUnavailable, type MetricVM } from "../viewModels/dashboardVm";
import { formatMoney } from "../formatters";

/** Dashboard — gateway queries only; missing ≠ zero */
export function HomeScreen() {
  const { book } = useAppState();
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  const [metrics, setMetrics] = useState<MetricVM[]>([
    metricLoading("cash", "Cash"),
    metricUnavailable("netWorth", "Net Worth", "await reportPack"),
    metricUnavailable("investments", "Investments", "await valuation"),
    metricUnavailable("loans", "Loans", "await listLoans"),
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
      }
      setMetrics(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [gateway, book?.baseCurrency]);

  return (
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
    </section>
  );
}
