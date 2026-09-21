<<<<<<< HEAD
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
  accountKind?: string;
};

export function MoneyScreen() {
  const gateway = useGateway();
  const dispatch = useAppDispatch();
  const { book } = useAppState();
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalsNote, setTotalsNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const list = await gateway.execute<{ accounts?: AccountRow[]; rows?: AccountRow[] }>("accounts.list", {});
    const totals = await gateway.execute<{
      byCurrency?: { currency: string; balance: string }[];
      netCash?: string | null;
      netCashState?: string;
    }>("money.totals", {});
    if (!list.ok) {
      setError(list.message || list.code);
      setRows([]);
    } else {
      const data = list.data as any;
      setRows(data.accounts || data.rows || (Array.isArray(data) ? data : []));
    }
    if (totals.ok && totals.data) {
      const t = totals.data;
      if (t.netCashState === "mixed_currency_needs_report_currency") {
        setTotalsNote("چند ارز — جمع خالص بدون ارز گزارش در دسترس نیست");
      } else if (t.netCash != null) {
        setTotalsNote(`نقد: ${formatMoney(t.netCash, book?.baseCurrency || "IRR")}`);
      } else {
        setTotalsNote(null);
      }
    }
    setLoading(false);
  }, [gateway, book?.baseCurrency]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section dir="rtl" lang="fa" className="screen">
      <header className="screen-header">
        <h1>پول</h1>
        <div className="row gap">
          <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "account.create" })}>
            حساب جدید
          </Button>
          <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "deposit" })}>
            واریز
          </Button>
          <Button type="button" variant="ghost" onClick={() => void refresh()}>
            تازه‌سازی
          </Button>
        </div>
      </header>
      {totalsNote ? <p className="muted">{totalsNote}</p> : null}
      {loading ? <LoadingState /> : null}
      {error ? <InlineError message={error} /> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState title="حسابی نیست" hint="اول یک حساب بسازید، سپس واریز کنید." />
      ) : null}
      <ul className="card-list">
        {rows.map((a) => (
          <li key={a.id}>
            <AccountCard
              name={a.name}
              currency={a.currency}
              balance={a.presentationBalance ?? "0"}
            />
          </li>
        ))}
      </ul>
=======
import React, { useState } from "react";
import { useAppDispatch, useAppState } from "../app/AppProviders";
import { useAccounts } from "../queries/useAccounts";
import { userMessageForError } from "../i18n/errorUx";
import { formatMoney } from "../formatters";
import { AccountCard } from "../components/finance/AccountCard";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingState } from "../components/common/LoadingState";
import { InlineError } from "../components/common/InlineError";
import { Button } from "../components/common/Button";

export function MoneyScreen() {
  const { book } = useAppState();
  const dispatch = useAppDispatch();
  const { data: accounts, totalsByCurrency, loading, error, errorCode, refresh } = useAccounts(true);
  const [filter, setFilter] = useState("");

  const filtered = accounts.filter(
    (a) =>
      !filter ||
      a.name.includes(filter) ||
      a.kindLabel.includes(filter) ||
      a.balance.currency.includes(filter.toUpperCase()),
  );

  const totalEntries = Object.entries(totalsByCurrency || {});

  return (
    <section>
      <header className="page-header">
        <h1>حساب‌ها</h1>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "account-create" })}>
          حساب جدید
        </Button>
      </header>

      <div className="metrics">
        {totalEntries.map(([c, raw]) => (
          <span key={c} className="metric">
            نقد ({c}): {formatMoney(raw, c)}
          </span>
        ))}
        {totalEntries.length === 0 ? <span className="metric">نقد: —</span> : null}
      </div>
      <p className="muted">پایه کتاب {book?.baseCurrency} · مانده و جمع از query (journal)</p>

      <label className="filter">
        جستجو
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="نام / نوع / ارز" />
      </label>

      {loading === "initial" ? <LoadingState /> : null}
      {loading === "refreshing" ? <LoadingState label="به‌روزرسانی…" /> : null}
      {errorCode ? <InlineError message={userMessageForError(errorCode, error || undefined)} /> : null}

      {filtered.length === 0 && loading === "idle" ? (
        <EmptyState title="هنوز حسابی نیست" hint="حساب بسازید یا واریز ثبت کنید." />
      ) : (
        <ul className="list">{filtered.map((a) => <AccountCard key={a.id} account={a} />)}</ul>
      )}

      <div className="actions">
        <Button type="button" variant="ghost" onClick={() => void refresh("refreshing")}>
          تازه‌سازی
        </Button>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "deposit" })}>
          واریز
        </Button>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "withdraw" })}>
          برداشت
        </Button>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "transfer" })}>
          انتقال
        </Button>
      </div>
>>>>>>> origin/main
    </section>
  );
}
