<<<<<<< HEAD
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
=======
import React, { useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { userMessageForError } from "../i18n/errorUx";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

type Preview = {
  installmentCount?: number;
  principalTotal?: string;
  interestTotal?: string;
  firstDue?: string;
  lastDue?: string;
  rows?: Array<{ dueDate?: string; principal?: string; interest?: string; total?: string }>;
};

export function LoanCreateSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [role, setRole] = useState("lender");
  const [principal, setPrincipal] = useState("");
  const [currency, setCurrency] = useState("IRR");
  const [annualRate, setRate] = useState("12");
  const [periods, setPeriods] = useState("12");
  const [frequency, setFrequency] = useState("monthly");
  const [method, setMethod] = useState("declining_balance");
  const [dayCount, setDayCount] = useState("period_based");
  const [originationKind, setOrigination] = useState("disburse_now");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const opRef = useRef(crypto.randomUUID());

  async function onPreview() {
    setError(null);
    const res = await gateway.execute<Preview>("loan.previewSchedule", {
      payload: {
        principal: principal.trim(),
        annualRate: annualRate.trim(),
        periods,
        frequency,
        method,
        startDate,
        dayCount,
        currency,
      },
    });
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      setPreview(null);
      return;
    }
    setPreview(res.data || null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute("loan.create", {
      operationId: opRef.current,
      payload: {
        role,
        principal: principal.trim(),
        currency,
        annualRate: annualRate.trim(),
        periods,
        frequency,
        method,
        startDate,
        businessDate: startDate,
        dayCount,
        originationKind,
        notes: notes || undefined,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
>>>>>>> origin/main
      return;
    }
    onClose();
  }

  return (
<<<<<<< HEAD
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
=======
    <form onSubmit={onSubmit} className="form">
      <h2 id="sheet-title">وام جدید</h2>
      <label>
        نقش
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="lender">قرض‌دهنده (lent)</option>
          <option value="borrower">قرض‌گیرنده (v1 ممکن است رد شود)</option>
        </select>
      </label>
      <label>
        اصل
        <input value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" required />
      </label>
      <label>
        ارز
        <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} required />
      </label>
      <label>
        نرخ سالانه (%)
        <input value={annualRate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" required />
      </label>
      <label>
        تعداد اقساط
        <input value={periods} onChange={(e) => setPeriods(e.target.value)} inputMode="numeric" required />
      </label>
      <label>
        تناوب
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="monthly">monthly</option>
          <option value="weekly">weekly</option>
          <option value="quarterly">quarterly</option>
          <option value="annual">annual</option>
>>>>>>> origin/main
        </select>
      </label>
      <label>
        روش
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
<<<<<<< HEAD
          <option value="declining_balance">مانده نزولی</option>
          <option value="qarz_al_hasaneh">قرض‌الحسنه</option>
          <option value="flat_rate">نرخ ثابت</option>
        </select>
      </label>
      {error ? <InlineError message={error} /> : null}
      <Button type="submit" disabled={busy}>
        ثبت
      </Button>
=======
          <option value="declining_balance">declining_balance</option>
          <option value="flat_rate">flat_rate</option>
          <option value="qarz_al_hasaneh">qarz_al_hasaneh</option>
          <option value="bullet">bullet</option>
        </select>
      </label>
      <label>
        dayCount
        <select value={dayCount} onChange={(e) => setDayCount(e.target.value)}>
          <option value="period_based">period_based</option>
        </select>
      </label>
      <label>
        origination
        <select value={originationKind} onChange={(e) => setOrigination(e.target.value)}>
          <option value="disburse_now">disburse_now</option>
          <option value="record_outstanding">record_outstanding</option>
        </select>
      </label>
      <label>
        تاریخ شروع
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </label>
      <label>
        یادداشت
        <input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Button type="button" variant="ghost" onClick={() => void onPreview()}>
        پیش‌نمایش اقساط (Core)
      </Button>
      {preview ? (
        <div className="muted">
          <p>
            اقساط: {preview.installmentCount ?? preview.rows?.length ?? "—"} · اصل: {preview.principalTotal ?? "—"} ·
            سود: {preview.interestTotal ?? "—"}
          </p>
          <p>
            اول: {preview.firstDue ?? preview.rows?.[0]?.dueDate ?? "—"} · آخر:{" "}
            {preview.lastDue ?? preview.rows?.[preview.rows.length - 1]?.dueDate ?? "—"}
          </p>
        </div>
      ) : null}
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? "…" : "ایجاد"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
>>>>>>> origin/main
    </form>
  );
}
