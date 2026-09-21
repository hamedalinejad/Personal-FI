import React, { useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { userMessageForError } from "../i18n/errorUx";

export function AccountCreateSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("bank_account");
  const [currency, setCurrency] = useState("IRR");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const operationIdRef = useRef(crypto.randomUUID());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("accounts.create", {
      operationId: operationIdRef.current,
      payload: { name, accountKind: kind, currency },
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
      <h2 id="sheet-title">حساب جدید</h2>
      <label>
        نام
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        نوع
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="cash">نقد</option>
          <option value="bank_account">بانک</option>
          <option value="card">کارت</option>
          <option value="wallet">کیف پول</option>
        </select>
      </label>
      <label>
        ارز
        <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} required />
      </label>
      {error ? (
        <p role="alert">{error}</p>
      ) : null}
      <div className="actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "در حال ثبت…" : "ذخیره"}
        </button>
        <button type="button" onClick={onClose}>
          انصراف
        </button>
      </div>
    </form>
  );
}
