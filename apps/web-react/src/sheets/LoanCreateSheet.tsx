import React, { useState } from "react";
import { useGateway } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

export function LoanCreateSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("0");
  const [currency, setCurrency] = useState("IRR");
  const [method, setMethod] = useState("declining_balance");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await gateway.execute("loan.create", {
      role: "lent",
      principal,
      currency,
      interestRate: rate,
      calculationMethod: method,
      businessDate: new Date().toISOString().slice(0, 10),
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
      <h2>وام جدید (قرض‌دهنده)</h2>
      <label>
        اصل
        <input value={principal} onChange={(e) => setPrincipal(e.target.value)} required inputMode="decimal" />
      </label>
      <label>
        نرخ
        <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
      </label>
      <label>
        ارز
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="IRR">IRR</option>
          <option value="USD">USD</option>
        </select>
      </label>
      <label>
        روش
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="declining_balance">مانده نزولی</option>
          <option value="qarz_al_hasaneh">قرض‌الحسنه</option>
          <option value="flat_rate">نرخ ثابت</option>
        </select>
      </label>
      {error ? <InlineError message={error} /> : null}
      <Button type="submit" disabled={busy}>
        ثبت
      </Button>
    </form>
  );
}
