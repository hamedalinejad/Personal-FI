<<<<<<< HEAD
import React from "react";
import { useAppState, useAppDispatch } from "../app/AppProviders";
import { Button } from "../components/common/Button";

export function RecoveryScreen() {
  const { lastError } = useAppState();
  const dispatch = useAppDispatch();
  return (
    <section className="onboarding" dir="rtl" lang="fa">
      <h1>بازیابی</h1>
      <p className="muted">خطایی در باز کردن دفتر رخ داد.</p>
      {lastError ? (
        <p>
          <code>{lastError.code}</code>: {lastError.message}
        </p>
      ) : null}
      <Button type="button" onClick={() => dispatch({ type: "CLEAR_RECOVERY" })}>
        تلاش مجدد
      </Button>
=======
import React, { useState } from "react";
import { useAppDispatch, useAppState, useGateway } from "../app/AppProviders";
import { InlineError } from "../components/common/InlineError";
import { Button } from "../components/common/Button";
import { userMessageForError } from "../i18n/errorUx";
import { getFinancialHost } from "../persistence/browserHostBridge";

/** Recovery — reopen / backup entry; never overwrite live DB on invalid backup */
export function RecoveryScreen() {
  const { lastError, book } = useAppState();
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function tryReopen() {
    setBusy(true);
    setStatus(null);
    const host = getFinancialHost();
    if (host?.getRecoveryState) {
      const r = await host.getRecoveryState();
      setBusy(false);
      if (r.ok) {
        dispatch({ type: "CLEAR_RECOVERY" });
        setStatus("بازیابی وضعیت میزبان موفق بود.");
        return;
      }
      setStatus(userMessageForError(r.code, r.message));
      return;
    }
    setBusy(false);
    dispatch({ type: "CLEAR_RECOVERY" });
    setStatus("بازگشت به دفتر (metadata). برای دادهٔ کامل FinancialHost لازم است.");
  }

  async function tryBackup() {
    setBusy(true);
    const host = getFinancialHost();
    if (!host?.backup) {
      setBusy(false);
      setStatus("پشتیبان در این میزبان هنوز متصل نیست.");
      return;
    }
    const r = await host.backup("recovery");
    setBusy(false);
    setStatus(r.ok ? "پشتیبان آماده شد." : userMessageForError(r.code, r.message));
  }

  return (
    <section className="recovery">
      <h1>بازیابی</h1>
      {book ? (
        <p className="muted">
          دفتر: {book.name} · {book.baseCurrency}
        </p>
      ) : null}
      {lastError ? <InlineError message={userMessageForError(lastError.code, lastError.message)} /> : null}
      {status ? <p role="status">{status}</p> : null}
      <div className="actions">
        <Button type="button" disabled={busy} onClick={() => void tryReopen()}>
          تلاش مجدد / بازگشایی
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void tryBackup()}>
          پشتیبان
        </Button>
        <Button type="button" variant="ghost" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "backup" })}>
          پشتیبان و بازیابی…
        </Button>
      </div>
      <p className="muted">بازیابی نامعتبر هرگز فایل زنده را جایگزین نمی‌کند.</p>
      <span hidden>{String(!!gateway)}</span>
>>>>>>> origin/main
    </section>
  );
}
