import React, { useEffect, useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { userMessageForError } from "../i18n/errorUx";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

type LoanPayment = {
  id: string;
  operationId: string;
  amount: string;
  principal?: string;
  interest?: string;
  fee?: string;
  penalty?: string;
  businessDate?: string;
};

export function LoanReverseSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [loanId, setLoanId] = useState("");
  const [loans, setLoans] = useState<Array<{ id: string; label: string }>>([]);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [selectedOp, setSelectedOp] = useState("");
  const [reason, setReason] = useState("");
  const [businessDate, setBusinessDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const opRef = useRef(crypto.randomUUID());

  useEffect(() => {
    void (async () => {
      const res = await gateway.execute<{ loans?: Array<{ id: string; status?: string }> }>("listLoans", {});
      if (res.ok && res.data?.loans) {
        setLoans(res.data.loans.map((l) => ({ id: l.id, label: `${l.id.slice(0, 8)}… (${l.status || "?"})` })));
      }
    })();
  }, [gateway]);

  useEffect(() => {
    if (!loanId) {
      setPayments([]);
      return;
    }
    void (async () => {
      const res = await gateway.execute<{
        payments?: LoanPayment[];
        transactions?: LoanPayment[];
      }>("getStatement", { loanId });
      const rows = res.ok ? res.data?.payments || res.data?.transactions || [] : [];
      setPayments(rows.filter((p) => p.operationId));
    })();
  }, [loanId, gateway]);

  const selected = payments.find((p) => p.operationId === selectedOp);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOp) {
      setError("پرداخت را انتخاب کنید.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("loan.reversePayment", {
      operationId: opRef.current,
      payload: {
        originalOperationId: selectedOp,
        businessDate,
        reason: reason || undefined,
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
      <h2 id="sheet-title">برگشت پرداخت وام</h2>
      <label>
        وام
        <select value={loanId} onChange={(e) => setLoanId(e.target.value)} required>
          <option value="">—</option>
          {loans.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        پرداخت اصلی
        <select value={selectedOp} onChange={(e) => setSelectedOp(e.target.value)} required>
          <option value="">—</option>
          {payments.map((p) => (
            <option key={p.operationId} value={p.operationId}>
              {p.businessDate || ""} · {p.amount} · {p.operationId.slice(0, 8)}…
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <ul className="muted">
          <li>اصل: {selected.principal ?? "—"}</li>
          <li>سود: {selected.interest ?? "—"}</li>
          <li>کارمزد: {selected.fee ?? "—"}</li>
          <li>جریمه: {selected.penalty ?? "—"}</li>
        </ul>
      ) : null}
      <label>
        تاریخ کسب‌وکار
        <input type="date" value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} required />
      </label>
      <label>
        دلیل
        <input value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <p className="muted">پرداخت اصلی posted می‌ماند · operation برگشت جدید</p>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? "…" : "ثبت برگشت"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
