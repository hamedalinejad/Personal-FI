import React, { useState } from "react";
import { useGateway } from "../app/AppProviders";

export function LoanPaymentSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await gateway.execute("loan.recordPayment", {
      operationId: crypto.randomUUID(),
      payload: {
        loanId,
        amount: amount.trim(),
        currency: "IRR",
        businessDate: new Date().toISOString().slice(0, 10),
      },
    });
    setStatus(res.ok ? "ok" : `${res.code}: ${res.message}`);
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <h2 id="sheet-title">پرداخت وام</h2>
      <label>
        شناسه وام
        <input value={loanId} onChange={(e) => setLoanId(e.target.value)} required />
      </label>
      <label>
        مبلغ
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required />
      </label>
      <p className="muted">تخصیص: penalty → fee → interest → principal</p>
      {status ? <p role="status">{status}</p> : null}
      <div className="actions">
        <button type="submit">ثبت</button>
        <button type="button" onClick={onClose}>
          انصراف
        </button>
      </div>
    </form>
  );
}
