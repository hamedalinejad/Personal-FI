import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppState, useGateway } from "../app/AppProviders";
import { metricLoading, metricUnavailable, type MetricVM } from "../viewModels/dashboardVm";
import { formatMoney } from "../formatters";
import { Button } from "../components/common/Button";

export function HomeScreen() {
  const { book } = useAppState();
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  const [metrics, setMetrics] = useState<MetricVM[]>([
    metricLoading("cash", "نقد"),
    metricUnavailable("netWorth", "ارزش خالص", "…"),
    metricUnavailable("investments", "سرمایه‌گذاری", "…"),
    metricUnavailable("loans", "وام", "…"),
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const totals = await gateway.execute<{
        netCash: string | null;
        netCashState?: string;
        byCurrency?: { currency: string; balance: string }[];
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
      if (!totals.ok) next.push(metricUnavailable("cash", "نقد", totals.code));
      else if (totals.data.netCash == null) {
        next.push(metricUnavailable("cash", "نقد", totals.data.netCashState || "چندارزی"));
      } else {
        next.push({
          id: "cash",
          label: "نقد",
          state: "ready",
          display: formatMoney(totals.data.netCash, book?.baseCurrency || "IRR"),
          hint: (totals.data.byCurrency || []).map((c) => `${c.currency}`).join(" · ") || undefined,
        });
      }

      if (!nw.ok) next.push(metricUnavailable("netWorth", "ارزش خالص", nw.code));
      else {
        next.push({
          id: "netWorth",
          label: "ارزش خالص",
          state: "ready",
          display: formatMoney(nw.data?.netWorth ?? "0", book?.baseCurrency || "IRR"),
        });
      }

      if (!inv.ok) next.push(metricUnavailable("investments", "سرمایه‌گذاری", inv.code));
      else {
        const st = inv.data?.valuationState || inv.data?.state || "unpriced";
        const hc = inv.data?.totals?.holdingCount ?? 0;
        next.push({
          id: "investments",
          label: "سرمایه‌گذاری",
          state: st === "ready" ? "ready" : "unavailable",
          display: st === "ready" ? String(inv.data?.totals?.totalCost ?? "—") : "—",
          hint: hc ? `${hc} دارایی` : "بدون موجودی",
        });
      }

      if (!loans.ok) next.push(metricUnavailable("loans", "وام", loans.code));
      else {
        const n = Array.isArray(loans.data?.loans) ? loans.data.loans.length : 0;
        next.push({ id: "loans", label: "وام فعال", state: "ready", display: String(n) });
      }
      setMetrics(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [gateway, book?.baseCurrency]);

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>خلاصه مالی</h1>
          <p className="subtitle">نمای کلی دفتر — مقادیر ناموجود صفر نشان داده نمی‌شوند</p>
        </div>
        <div className="screen-actions">
          <Button type="button" variant="soft" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "account.create" })}>
            حساب جدید
          </Button>
          <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "deposit" })}>
            واریز
          </Button>
        </div>
      </header>

      <div className="metric-grid" role="list">
        {metrics.map((m) => (
          <article
            key={m.id}
            className={`metric-card${m.state !== "ready" ? " is-muted" : ""}`}
            role="listitem"
          >
            <div className="label">{m.label}</div>
            <div className="value">{m.display ?? "—"}</div>
            {m.hint ? <div className="hint">{m.hint}</div> : null}
          </article>
        ))}
      </div>

      <div className="panel stack">
        <div className="section-title">دسترسی سریع</div>
        <div className="row gap" style={{ flexWrap: "wrap" }}>
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "deposit" })}>
            واریز
          </Button>
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "withdraw" })}>
            برداشت
          </Button>
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "loan.create" })}>
            وام جدید
          </Button>
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "backup" })}>
            پشتیبان
          </Button>
        </div>
      </div>
    </section>
  );
}
