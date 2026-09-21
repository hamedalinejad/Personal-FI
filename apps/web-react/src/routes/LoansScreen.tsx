<<<<<<< HEAD
import React, { useCallback, useEffect, useState } from "react";
import { useGateway, useAppDispatch } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { InlineError } from "../components/common/InlineError";
import { LoadingState } from "../components/common/LoadingState";

export function LoansScreen() {
  const gateway = useGateway();
  const dispatch = useAppDispatch();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await gateway.execute<{ loans?: any[]; rows?: any[] }>("loans.list", {});
    if (!res.ok) {
      if (res.code === "QUERY_NOT_WIRED" || res.code === "UNKNOWN_QUERY_ID") {
        setLoans([]);
        setError(null);
      } else setError(res.message || res.code);
    } else {
      const d = res.data as any;
      setLoans(d.loans || d.rows || []);
    }
    setLoading(false);
  }, [gateway]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section dir="rtl" lang="fa" className="screen">
      <header className="screen-header">
        <h1>وام</h1>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "loan.create" })}>
          وام جدید
        </Button>
      </header>
      {loading ? <LoadingState /> : null}
      {error ? <InlineError message={error} /> : null}
      {!loading && loans.length === 0 ? (
        <EmptyState title="وامی ثبت نشده" hint="از دکمه وام جدید استفاده کنید." />
      ) : null}
      <ul className="simple-list">
        {loans.map((l) => (
          <li key={l.id}>
            {l.role || "loan"} · {l.principal} {l.currency} · {l.status}
          </li>
        ))}
      </ul>
=======
import React, { useState } from "react";
import { useAppDispatch } from "../app/AppProviders";
import { useLoans } from "../queries/useLoans";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingState } from "../components/common/LoadingState";
import { InlineError } from "../components/common/InlineError";
import { Button } from "../components/common/Button";
import { userMessageForError } from "../i18n/errorUx";
import { formatRelativeStatus } from "../formatters";

const TABS = ["overview", "schedule", "statement", "history"] as const;

/** Step 8 — /loans */
export function LoansScreen() {
  const dispatch = useAppDispatch();
  const { data, loading, errorCode, refresh } = useLoans(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");

  return (
    <section>
      <header className="page-header">
        <h1>وام‌ها</h1>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "loan-create" })}>
          وام جدید
        </Button>
      </header>

      <div className="filters" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading === "initial" ? <LoadingState /> : null}
      {errorCode ? <InlineError message={userMessageForError(errorCode)} /> : null}

      {data.length === 0 && loading === "idle" ? (
        <EmptyState title="وامی ثبت نشده" hint="وام بسازید یا پرداخت ثبت کنید." />
      ) : (
        <ul className="list">
          {data.map((raw, i) => {
            const L = raw as Record<string, unknown>;
            const id = String(L.id || L.loanId || i);
            const status = String(L.status || L.lifecycle || "active");
            return (
              <li key={id}>
                <strong>{String(L.counterparty || L.name || id.slice(0, 8))}</strong>
                <span className="muted"> · {formatRelativeStatus(status)}</span>
                {L.principal != null ? <span> · اصل {String(L.principal)}</span> : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="actions">
        <Button type="button" variant="ghost" onClick={() => void refresh("refreshing")}>
          تازه‌سازی
        </Button>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "loan-payment" })}>
          ثبت پرداخت
        </Button>
        <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "loan-reverse" })}>
          برگشت پرداخت
        </Button>
      </div>
>>>>>>> origin/main
    </section>
  );
}
