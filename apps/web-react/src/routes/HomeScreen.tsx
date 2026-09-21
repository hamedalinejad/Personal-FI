import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppState, useGateway } from "../app/AppProviders";
import { metricLoading, metricUnavailable, type MetricVM } from "../viewModels/dashboardVm";
import { formatMoney } from "../formatters";
import { Button } from "../components/common/Button";

export function HomeScreen() {
  const { book } = useAppState();
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<MetricVM[]>([
    metricLoading("cash", "نقدینگی"),
    metricUnavailable("netWorth", "ارزش خالص", "…"),
    metricUnavailable("investments", "سرمایه‌گذاری", "…"),
    metricUnavailable("loans", "وام", "…"),
  ]);
  const [ops, setOps] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const totals = await gateway.execute<any>("money.totals", {});
      const loans = await gateway.execute<any>("loans.list", {});
      const inv = await gateway.execute<any>("investments.holdings", {});
      const nw = await gateway.execute<any>("reports.netWorth", {});
      const recent = await gateway.execute<any>("operations.list", { limit: 8 });
      if (cancelled) return;

      const next: MetricVM[] = [];
      const nextAlerts: string[] = [];

      if (!totals.ok) {
        next.push(metricUnavailable("cash", "نقدینگی", totals.code));
        nextAlerts.push(`نقدینگی: ${totals.code}`);
      } else if (totals.data?.netCash == null) {
        next.push(metricUnavailable("cash", "نقدینگی", totals.data?.netCashState || "چندارزی"));
      } else {
        next.push({
          id: "cash",
          label: "نقدینگی",
          state: "ready",
          display: formatMoney(totals.data.netCash, book?.baseCurrency || "IRR"),
          hint: "Money",
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

      if (!inv.ok) {
        next.push(metricUnavailable("investments", "سرمایه‌گذاری", inv.code));
      } else {
        const st = inv.data?.valuationState || inv.data?.state || "unpriced";
        if (st !== "ready") nextAlerts.push(`ارزش‌گذاری: ${st}`);
        next.push({
          id: "investments",
          label: "سرمایه‌گذاری",
          state: st === "ready" ? "ready" : "unavailable",
          display: st === "ready" ? String(inv.data?.totals?.totalCost ?? "—") : "—",
          hint: st,
        });
      }

      if (!loans.ok) next.push(metricUnavailable("loans", "وام", loans.code));
      else {
        const n = Array.isArray(loans.data?.loans) ? loans.data.loans.length : 0;
        next.push({ id: "loans", label: "وام فعال", state: "ready", display: String(n) });
      }

      setMetrics(next);
      setAlerts(nextAlerts);
      if (recent.ok) setOps(recent.data?.operations || recent.data?.rows || []);
      else setOps([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [gateway, book?.baseCurrency]);

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>خانه</h1>
          <p className="subtitle">سلامت دفتر، نقدینگی، سرمایه‌گذاری و وام</p>
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

      <div className="panel stack">
        <div className="section-title">سلامت سیستم</div>
        <div className="row gap" style={{ flexWrap: "wrap" }}>
          <span className="badge">آفلاین / محلی</span>
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "backup" })}>
            پشتیبان
          </Button>
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "recovery" })}>
            بازیابی سیستم
          </Button>
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "price.sync" })}>
            قیمت‌ها
          </Button>
        </div>
      </div>

      <div className="metric-grid" role="list">
        {metrics.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`metric-card${m.state !== "ready" ? " is-muted" : ""}`}
            style={{ textAlign: "start", cursor: "pointer", border: "1px solid var(--color-border)" }}
            onClick={() => {
              if (m.id === "cash") navigate("/money");
              else if (m.id === "investments") navigate("/investments");
              else if (m.id === "loans") navigate("/loans");
              else if (m.id === "netWorth") dispatch({ type: "OPEN_SHEET", sheet: "report.netWorth" });
            }}
          >
            <div className="label">{m.label}</div>
            <div className="value">{m.display ?? "—"}</div>
            {m.hint ? <div className="hint">{m.hint}</div> : null}
          </button>
        ))}
      </div>

      {alerts.length > 0 ? (
        <div className="panel stack">
          <div className="section-title">هشدارها</div>
          <ul className="simple-list">
            {alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="panel stack">
        <div className="section-title">آخرین فعالیت</div>
        {ops.length === 0 ? (
          <p className="muted">هنوز عملیاتی ثبت نشده</p>
        ) : (
          <ul className="menu-list">
            {ops.map((op) => (
              <li key={op.id || String(op.created_at)}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "transaction.detail" })}
                >
                  <span>
                    {op.operation_type || op.type || "operation"} · {op.business_date || ""}
                  </span>
                  <span className="chev">‹</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button type="button" variant="ghost" onClick={() => navigate("/transactions")}>
          همه تراکنش‌ها
        </Button>
      </div>
    </section>
  );
}
