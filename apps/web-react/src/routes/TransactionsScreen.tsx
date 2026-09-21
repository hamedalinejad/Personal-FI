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
    </section>
  );
}
