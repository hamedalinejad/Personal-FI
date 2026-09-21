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
    </section>
  );
}
