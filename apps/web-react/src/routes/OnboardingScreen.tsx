import React, { useState } from "react";
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
    }
  }

  return (
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
        </Button>
      </form>
    </section>
  );
}
