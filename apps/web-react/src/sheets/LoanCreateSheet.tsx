import React, { useEffect, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

type Acct = { id: string; name: string; currency: string };

export function LoanCreateSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [name, setName] = useState("وام قرض‌دهنده");
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("0");
  const [periods, setPeriods] = useState("12");
  const [currency, setCurrency] = useState("IRR");
  const [method, setMethod] = useState("declining_balance");
  const [role, setRole] = useState<"lent" | "borrowed">("lent");
  const [cashAccountId, setCashAccountId] = useState("");
  const [accounts, setAccounts] = useState<Acct[]>([]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void gateway.execute("accounts.list", {}).then((res) => {
      if (!res.ok) return;
      const d = res.data as any;
      const list: Acct[] = d.accounts || d.rows || [];
      setAccounts(list);
      if (list[0]) {
        setCashAccountId(list[0].id);
        setCurrency(list[0].currency || "IRR");
      }
    });
  }, [gateway]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await gateway.execute("loan.create", {
      name,
      role,
      principal,
      currency,
      annualRate: rate,
      interestRate: rate,
      periods,
      startDate,
      businessDate: startDate,
      calculationMethod: method,
      cashAccountId,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message || res.code);
      return;
    }
    onClose();
  }

  return (
    <form className="stack" onSubmit={submit} dir="rtl">
      <h2>وام جدید</h2>
      <label>
        نام
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        نقش
        <select value={role} onChange={(e) => setRole(e.target.value as "lent" | "borrowed")}>
          <option value="lent">قرض‌دهنده (طلب)</option>
          <option value="borrowed">قرض‌گیرنده (بدهی)</option>
        </select>
      </label>
      <label>
        حساب نقد
        <select value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} required>
          <option value="">انتخاب حساب…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </label>
      <label>
        اصل
        <input value={principal} onChange={(e) => setPrincipal(e.target.value)} required inputMode="decimal" />
      </label>
      <label>
        نرخ سالانه
        <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
      </label>
      <label>
        تعداد اقساط
        <input value={periods} onChange={(e) => setPeriods(e.target.value)} required inputMode="numeric" />
      </label>
      <label>
        تاریخ شروع
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </label>
      <label>
        ارز
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="IRR">IRR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </label>
      <label>
        روش محاسبه
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="declining_balance">مانده نزولی</option>
          <option value="flat_rate">نرخ ثابت</option>
          <option value="qarz_al_hasaneh">قرض‌الحسنه</option>
          <option value="bullet">بالون / bullet</option>
        </select>
      </label>
      {error ? <InlineError message={error} /> : null}
      <Button type="submit" disabled={busy || !cashAccountId}>
        ثبت
      </Button>
    </form>
  );
}
