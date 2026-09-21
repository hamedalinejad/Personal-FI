import React, { useEffect, useState } from "react";
import { useAppDispatch, useGateway } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { InlineError } from "../components/common/InlineError";
import { LoadingState } from "../components/common/LoadingState";

export function TransactionsScreen() {
  const gateway = useGateway();
  const dispatch = useAppDispatch();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await gateway.execute<any>("operations.list", { limit: 100 });
      if (cancelled) return;
      if (!res.ok) {
        if (["COMMAND_NOT_WIRED", "UNKNOWN_QUERY_ID", "QUERY_NOT_WIRED"].includes(res.code)) {
          setRows([]);
          setError(null);
        } else setError(res.message || res.code);
      } else setRows(res.data?.operations || res.data?.rows || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [gateway]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = `${r.operation_type || ""} ${r.business_date || ""} ${r.status || ""}`.toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>تراکنش‌ها</h1>
          <p className="subtitle">دفتر عملیات مالی · detail و reversal در sheet</p>
        </div>
      </header>

      <label>
        جست‌وجو
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="نوع، تاریخ، وضعیت…" />
      </label>

      {loading ? <LoadingState /> : null}
      {error ? <InlineError message={error} /> : null}
      {!loading && filtered.length === 0 ? (
        <EmptyState title="تراکنشی نیست" hint="پس از واریز یا هزینه اینجا دیده می‌شود." />
      ) : null}

      <ul className="menu-list">
        {filtered.map((r, i) => (
          <li key={r.id || i}>
            <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "transaction.detail" })}>
              <span>
                <strong>{r.operation_type || r.type || "op"}</strong>
                <span className="muted"> · {r.business_date || r.created_at || ""} · {r.status || ""}</span>
              </span>
              <span className="chev">‹</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
