import React, { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useGateway } from "../app/AppProviders";
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

  const open = (sheet: string) => dispatch({ type: "OPEN_SHEET", sheet });

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await gateway.execute<any>("loans.list", {});
    if (!res.ok) {
      if (["QUERY_NOT_WIRED", "UNKNOWN_QUERY_ID"].includes(res.code)) {
        setLoans([]);
        setError(null);
      } else setError(res.message || res.code);
    } else setLoans(res.data?.loans || res.data?.rows || []);
    setLoading(false);
  }, [gateway]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>وام‌ها</h1>
          <p className="subtitle">{loans.length} وام · جزئیات و پرداخت در sheet</p>
        </div>
        <Button type="button" onClick={() => open("loan.create")}>
          وام جدید
        </Button>
      </header>

      <div className="panel stack">
        <div className="section-title">عملیات وام</div>
        <div className="row gap" style={{ flexWrap: "wrap" }}>
          <Button type="button" variant="ghost" onClick={() => open("loan.payment")}>پرداخت</Button>
          <Button type="button" variant="ghost" onClick={() => open("loan.schedule")}>برنامه اقساط</Button>
          <Button type="button" variant="ghost" onClick={() => open("loan.fees")}>کارمزد/جریمه</Button>
          <Button type="button" variant="ghost" onClick={() => open("loan.statement")}>صورتحساب</Button>
          <Button type="button" variant="ghost" onClick={() => open("loan.reversal")}>برگشت پرداخت</Button>
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <InlineError message={error} /> : null}
      {!loading && loans.length === 0 ? (
        <EmptyState title="وامی ثبت نشده" hint="با «وام جدید» شروع کنید." />
      ) : null}

      <ul className="menu-list">
        {loans.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => open("loan.statement")}>
              <span>
                {l.role || "loan"} · {l.principal} {l.currency} · {l.status}
              </span>
              <span className="chev">‹</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
