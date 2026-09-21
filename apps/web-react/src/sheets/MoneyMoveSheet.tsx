import React, { useEffect, useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { useAccounts } from "../queries/useAccounts";
import { userMessageForError } from "../i18n/errorUx";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";
import { AccountSelect } from "../components/finance/AccountSelect";

export function MoneyMoveSheet({ kind, onClose }: { kind: "deposit" | "withdraw"; onClose: () => void }) {
  const gateway = useGateway();
  const { data: accounts, refresh } = useAccounts(true);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IRR");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const opRef = useRef(crypto.randomUUID());
  const cmd = kind === "deposit" ? "accounts.deposit" : "accounts.withdraw";

  useEffect(() => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) setCurrency(acc.balance.currency);
  }, [accountId, accounts]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId) {
      setError("حساب را انتخاب کنید.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute(cmd, {
      operationId: opRef.current,
      payload: {
        accountId,
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
      <h2 id="sheet-title">{kind === "deposit" ? "واریز" : "برداشت"}</h2>
      <AccountSelect label="حساب" accounts={accounts} value={accountId} onChange={setAccountId} required />
      <label>
        مبلغ
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required />
      </label>
      <label>
        ارز
        <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} required readOnly />
      </label>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? "در حال ثبت…" : "ثبت"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
