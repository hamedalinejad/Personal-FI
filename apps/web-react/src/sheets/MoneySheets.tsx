import React, { useEffect, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

type Props = { kind: string; onClose: () => void };

export function MoneySheets({ kind, onClose }: Props) {
  const gateway = useGateway();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("IRR");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<{ id: string; name: string; currency: string }[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [inflowKind, setInflowKind] = useState("external_deposit");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (kind === "deposit" || kind === "withdraw") {
      void gateway.execute("accounts.list", {}).then((res) => {
        if (res.ok) {
          const d = res.data as any;
          const list = d.accounts || d.rows || [];
          setAccounts(list);
          if (list[0]) setAccountId(list[0].id);
        }
      });
    }
  }, [gateway, kind]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (kind === "account.create") {
        const res = await gateway.execute("accounts.create", {
          name,
          currency,
          accountKind: "asset.cash",
        });
        if (!res.ok) throw new Error(res.message || res.code);
      } else if (kind === "deposit") {
        const res = await gateway.execute("accounts.deposit", {
          accountId,
          amount,
          businessDate: date,
          inflowKind,
        });
        if (!res.ok) throw new Error(res.message || res.code);
      } else if (kind === "withdraw") {
        const res = await gateway.execute("accounts.withdraw", {
          accountId,
          amount,
          businessDate: date,
        });
        if (!res.ok) throw new Error(res.message || res.code);
      }
      onClose();
    } catch (err) {
      setError(String((err as Error).message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit} dir="rtl">
      <h2>
        {kind === "account.create" ? "حساب جدید" : kind === "deposit" ? "واریز" : "برداشت"}
      </h2>
      {kind === "account.create" ? (
        <>
          <label>
            نام
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            ارز
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="IRR">IRR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
        </>
      ) : (
        <>
          <label>
            حساب
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </label>
          <label>
            مبلغ
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              required
              placeholder="مثلاً 1000000"
            />
          </label>
          <label>
            تاریخ کسب‌وکار
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          {kind === "deposit" ? (
            <label>
              نوع ورودی
              <select value={inflowKind} onChange={(e) => setInflowKind(e.target.value)}>
                <option value="external_deposit">واریز خارجی</option>
                <option value="opening_balance">موجودی اول دوره</option>
                <option value="transfer_in">انتقال ورودی</option>
              </select>
            </label>
          ) : null}
        </>
      )}
      {error ? <InlineError message={error} /> : null}
      <div className="row gap">
        <Button type="submit" disabled={busy}>
          {busy ? "…" : "ثبت"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
