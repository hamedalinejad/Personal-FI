import React, { useState } from "react";
<<<<<<< HEAD
import { useCompleteOnboarding } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

export function OnboardingScreen() {
  const complete = useCompleteOnboarding();
  const [name, setName] = useState("کتاب شخصی");
  const [baseCurrency, setBaseCurrency] = useState("IRR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await complete({ bookName: name.trim() || "کتاب شخصی", baseCurrency });
    } catch (err) {
      setError(String((err as Error)?.message || err));
    } finally {
      setBusy(false);
=======
import { useCompleteOnboarding, useAppState } from "../app/AppProviders";
import { InlineError } from "../components/common/InlineError";
import { Button } from "../components/common/Button";

/** First-run book bootstrap — requires bound FinancialHost (P0-01/P0-02) */
export function OnboardingScreen() {
  const complete = useCompleteOnboarding();
  const { hostBound, bootstrapNote } = useAppState();
  const [name, setName] = useState("دفتر شخصی");
  const [baseCurrency, setBaseCurrency] = useState("IRR");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ccy = baseCurrency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(ccy)) {
      setError("ارز پایه باید سه حرفی باشد (مثلاً IRR).");
      return;
    }
    if (!hostBound) {
      setError("HOST_BRIDGE_UNWIRED — موتور مالی هنوز وصل نشده است.");
      return;
    }
    setSubmitting(true);
    try {
      await complete({ bookName: name.trim() || "Personal Book", baseCurrency: ccy });
    } catch (err) {
      setError(String((err as Error).message || err));
    } finally {
      setSubmitting(false);
>>>>>>> origin/main
    }
  }

  return (
<<<<<<< HEAD
    <section className="onboarding" dir="rtl" lang="fa">
      <h1>راه‌اندازی Personal-FI</h1>
      <p className="muted">دفتر مالی آفلاین شما — ارز پایه پس از ایجاد قابل تغییر نیست.</p>
      <form onSubmit={onSubmit} className="stack">
        <label>
          نام دفتر
          <input
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            required
            aria-required="true"
          />
        </label>
        <label>
          ارز پایه
          <select value={baseCurrency} onChange={(ev) => setBaseCurrency(ev.target.value)}>
            <option value="IRR">ریال ایران (IRR)</option>
            <option value="USD">دلار (USD)</option>
            <option value="EUR">یورو (EUR)</option>
          </select>
        </label>
        {error ? <InlineError message={error} /> : null}
        <Button type="submit" disabled={busy}>
          {busy ? "در حال ایجاد…" : "ایجاد دفتر"}
=======
    <section className="onboarding">
      <h1>راه‌اندازی</h1>
      <p className="muted">داده روی همین دستگاه · آفلاین · book از دیتابیس نه localStorage</p>
      {!hostBound ? (
        <p className="form-error" role="alert">
          در انتظار اتصال FinancialHost… {bootstrapNote || ""}
        </p>
      ) : null}
      <form className="form" onSubmit={onSubmit}>
        <label>
          نام دفتر
          <input value={name} onChange={(e) => setName(e.target.value)} required aria-required />
        </label>
        <label>
          ارز پایه
          <input
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            required
          />
        </label>
        {error ? <InlineError message={error} /> : null}
        <Button type="submit" variant="primary" disabled={submitting || !hostBound}>
          {submitting ? "…" : "شروع"}
>>>>>>> origin/main
        </Button>
      </form>
    </section>
  );
}
