import React, { useEffect, useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { useAccounts } from "../queries/useAccounts";
import { userMessageForError } from "../i18n/errorUx";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";
import { AccountSelect } from "../components/finance/AccountSelect";

export function TransferSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const { data: accounts, refresh } = useAccounts(true);
  const [fromAccount, setFrom] = useState("");
  const [toAccount, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IRR");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const opRef = useRef(crypto.randomUUID());

  useEffect(() => {
    const from = accounts.find((a) => a.id === fromAccount);
    if (from) setCurrency(from.balance.currency);
  }, [fromAccount, accounts]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromAccount || !toAccount) {
      setError("حساب مبدأ و مقصد را انتخاب کنید.");
      return;
    }
    if (fromAccount === toAccount) {
      setError("حساب مبدأ و مقصد یکسان است.");
      return;
    }
    const from = accounts.find((a) => a.id === fromAccount);
    const to = accounts.find((a) => a.id === toAccount);
    if (from && to && from.balance.currency !== to.balance.currency) {
      setError("عدم تطابق ارز حساب‌ها — انتقال هم‌ارز لازم است.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("accounts.transfer", {
      operationId: opRef.current,
      payload: {
        fromAccountId: fromAccount,
        toAccountId: toAccount,
        amount: amount.trim(),
        currency,
        businessDate: new Date().toISOString().slice(0, 10),
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    await refresh("refreshing");
    onClose();
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <h2 id="sheet-title">انتقال</h2>
      <AccountSelect label="از حساب" accounts={accounts} value={fromAccount} onChange={setFrom} required />
      <AccountSelect
        label="به حساب"
        accounts={accounts}
        value={toAccount}
        onChange={setTo}
        currencyFilter={currency}
        required
      />
      <label>
        مبلغ (decimal string)
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required />
      </label>
      <label>
        ارز
        <input value={currency} readOnly />
      </label>
      <p className="muted">جمع مانده‌ها از journal · تبدیل بی‌صدا ممنوع</p>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? "…" : "اجرا"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
