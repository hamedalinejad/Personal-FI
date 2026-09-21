import React, { useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { userMessageForError } from "../i18n/errorUx";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

type Family = "income" | "expense";

export function TxQuickSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [family, setFamily] = useState<Family>("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IRR");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const opRef = useRef(crypto.randomUUID());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const commandId = family === "income" ? "income.create" : "expense.create";
    const res = await gateway.execute(commandId, {
      operationId: opRef.current,
      payload: {
        amount: amount.trim(),
        currency,
        accountId,
        description,
        businessDate: new Date().toISOString().slice(0, 10),
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onClose();
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <h2 id="sheet-title">تراکنش سریع</h2>
      <div className="filters" role="tablist">
        {(["expense", "income"] as const).map((f) => (
          <button key={f} type="button" className={family === f ? "active" : ""} onClick={() => setFamily(f)}>
            {f}
          </button>
        ))}
      </div>
      <label>
        حساب
        <input value={accountId} onChange={(e) => setAccountId(e.target.value)} required />
      </label>
      <label>
        مبلغ
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required />
      </label>
      <label>
        ارز
        <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} required />
      </label>
      <label>
        شرح
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
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
