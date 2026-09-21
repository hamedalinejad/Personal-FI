<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { EmptyState } from "../components/common/EmptyState";
import { InlineError } from "../components/common/InlineError";
import { LoadingState } from "../components/common/LoadingState";

export function TransactionsScreen() {
  const gateway = useGateway();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await gateway.execute<{ operations?: any[]; rows?: any[] }>("operations.list", {
        limit: 50,
      });
      if (cancelled) return;
      if (!res.ok) {
        // operations.list may not be wired — soft empty
        if (res.code === "COMMAND_NOT_WIRED" || res.code === "UNKNOWN_QUERY_ID" || res.code === "QUERY_NOT_WIRED") {
          setRows([]);
          setError(null);
        } else {
          setError(res.message || res.code);
        }
      } else {
        const d = res.data as any;
        setRows(d.operations || d.rows || []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [gateway]);

  return (
    <section dir="rtl" lang="fa" className="screen">
      <h1>تراکنش‌ها</h1>
      {loading ? <LoadingState /> : null}
      {error ? <InlineError message={error} /> : null}
      {!loading && rows.length === 0 ? (
        <EmptyState title="تراکنشی نیست" hint="پس از واریز یا هزینه، عملیات اینجا دیده می‌شود." />
      ) : null}
      <ul className="simple-list">
        {rows.map((r, i) => (
          <li key={r.id || i}>
            <code>{r.operation_type || r.type || "op"}</code>{" "}
            <span className="muted">{r.business_date || r.created_at || ""}</span>
          </li>
        ))}
      </ul>
=======
import React, { useMemo, useState } from "react";
import { useAppDispatch } from "../app/AppProviders";
import { useTransactions } from "../queries/useTransactions";
import { formatMoney, formatBusinessDate } from "../formatters";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingState } from "../components/common/LoadingState";
import { InlineError } from "../components/common/InlineError";
import { Button } from "../components/common/Button";
import { userMessageForError } from "../i18n/errorUx";
import { TransactionDetailSheet, type TxRow } from "../sheets/TransactionDetailSheet";

const FILTERS = ["all", "in", "out"] as const;

/** Step 7 — /transactions + detail/reversal */
export function TransactionsScreen() {
  const dispatch = useAppDispatch();
  const { data, loading, errorCode, refresh } = useTransactions(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<TxRow | null>(null);

  const rows = useMemo(() => {
    return data.filter((t) => {
      if (filter !== "all" && t.direction !== filter) return false;
      if (q && !(`${t.memo || ""} ${t.amount} ${t.operationId}`).includes(q)) return false;
      return true;
    });
  }, [data, filter, q]);

  return (
    <section>
      <header className="page-header">
        <h1>تراکنش‌ها</h1>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "tx-quick" })}>
          + تراکنش
        </Button>
      </header>

      <div className="filters" role="tablist">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <label className="filter">
        جستجو
        <input value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      {loading === "initial" ? <LoadingState /> : null}
      {errorCode ? <InlineError message={userMessageForError(errorCode)} /> : null}

      {rows.length === 0 && loading === "idle" ? (
        <EmptyState title="تراکنشی نیست" hint="درآمد / هزینه / انتقال ثبت کنید." />
      ) : (
        <ul className="list">
          {rows.map((t) => (
            <li key={t.id}>
              <button type="button" className="list-row-btn" onClick={() => setDetail(t as TxRow)}>
                <strong>{formatBusinessDate(t.businessDate)}</strong> · {t.direction} ·{" "}
                {formatMoney(t.amount, t.currency)}
                {t.memo ? <span className="muted"> · {t.memo}</span> : null}
                <div className="muted">op {t.operationId.slice(0, 8)}…</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="ghost" onClick={() => void refresh("refreshing")}>
        تازه‌سازی
      </Button>

      {detail ? (
        <div className="sheet-backdrop" role="presentation" onClick={() => setDetail(null)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <TransactionDetailSheet
              row={detail}
              onClose={() => setDetail(null)}
              onReversed={() => {
                void refresh("refreshing");
                setDetail(null);
              }}
            />
          </div>
        </div>
      ) : null}
>>>>>>> origin/main
    </section>
  );
}
