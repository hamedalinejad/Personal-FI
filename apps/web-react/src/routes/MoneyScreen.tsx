import React, { useCallback, useEffect, useState } from "react";
import { useGateway, useAppDispatch, useAppState } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { InlineError } from "../components/common/InlineError";
import { LoadingState } from "../components/common/LoadingState";
import { AccountCard } from "../components/finance/AccountCard";
import { formatMoney } from "../formatters";

type AccountRow = {
  id: string;
  name: string;
  currency: string;
  presentationBalance?: string;
  account_kind?: string;
};

export function MoneyScreen() {
  const gateway = useGateway();
  const dispatch = useAppDispatch();
  const { book } = useAppState();
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalsNote, setTotalsNote] = useState<string | null>(null);

  const open = (sheet: string) => dispatch({ type: "OPEN_SHEET", sheet });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const list = await gateway.execute<any>("accounts.list", {});
    const totals = await gateway.execute<any>("money.totals", {});
    if (!list.ok) {
      setError(list.message || list.code);
      setRows([]);
    } else {
      const data = list.data;
      setRows(data?.accounts || data?.rows || (Array.isArray(data) ? data : []));
    }
    if (totals.ok && totals.data) {
      const t = totals.data;
      if (t.netCashState === "mixed_currency_needs_report_currency") {
        setTotalsNote("چند ارز — بدون ارز گزارش جمع خالص نیست");
      } else if (t.netCash != null) {
        setTotalsNote(`جمع: ${formatMoney(t.netCash, book?.baseCurrency || "IRR")}`);
      } else setTotalsNote(null);
    }
    setLoading(false);
  }, [gateway, book?.baseCurrency]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>پول</h1>
          <p className="subtitle">{totalsNote || "حساب‌های نقد و بانکی"}</p>
        </div>
        <div className="screen-actions">
          <Button type="button" variant="ghost" onClick={() => void refresh()}>
            تازه‌سازی
          </Button>
        </div>
      </header>

      <div className="panel stack">
        <div className="section-title">عملیات سریع</div>
        <div className="row gap" style={{ flexWrap: "wrap" }}>
          <Button type="button" onClick={() => open("account.create")}>حساب جدید</Button>
          <Button type="button" variant="soft" onClick={() => open("deposit")}>واریز</Button>
          <Button type="button" variant="ghost" onClick={() => open("withdraw")}>برداشت</Button>
          <Button type="button" variant="ghost" onClick={() => open("transfer")}>انتقال</Button>
          <Button type="button" variant="ghost" onClick={() => open("income.create")}>درآمد</Button>
          <Button type="button" variant="ghost" onClick={() => open("expense.create")}>هزینه</Button>
          <Button type="button" variant="ghost" onClick={() => open("cheque.receive")}>دریافت چک</Button>
          <Button type="button" variant="ghost" onClick={() => open("cheque.pay")}>پرداخت چک</Button>
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <InlineError message={error} /> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState title="حسابی نیست" hint="با «حساب جدید» شروع کنید." />
      ) : null}

      <ul className="card-list">
        {rows.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="account-card"
              style={{ width: "100%", textAlign: "start", cursor: "pointer", border: "1px solid var(--color-border)" }}
              onClick={() => open("account.detail")}
            >
              <AccountCard
                name={a.name}
                currency={a.currency}
                balance={a.presentationBalance ?? "0"}
                kindLabel={a.account_kind}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
