import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { useAppState } from "./AppProviders";
import { OnboardingScreen } from "../routes/OnboardingScreen";
import { RecoveryScreen } from "../routes/RecoveryScreen";
import { HomeScreen } from "../routes/HomeScreen";
import { MoneyScreen } from "../routes/MoneyScreen";
import { TransactionsScreen } from "../routes/TransactionsScreen";
import { InvestmentsScreen } from "../routes/InvestmentsScreen";
import { LoansScreen } from "../routes/LoansScreen";
import { MoreScreen } from "../routes/MoreScreen";
import { SheetHost } from "../sheets/SheetHost";
<<<<<<< HEAD
import { Button } from "../components/common/Button";

function BootstrappingScreen() {
  return (
    <section className="onboarding" dir="rtl" lang="fa">
      <h1>در حال آماده‌سازی</h1>
      <p className="muted">باز کردن پایگاه داده محلی (sql.js + IndexedDB)…</p>
=======

function BootstrappingScreen() {
  return (
    <section className="onboarding">
      <h1>در حال آماده‌سازی</h1>
      <p className="muted">باز کردن پایگاه داده محلی…</p>
>>>>>>> origin/main
    </section>
  );
}

function AwaitingHostScreen() {
<<<<<<< HEAD
  const { bootstrapNote, lastError } = useAppState();
  return (
    <section className="onboarding" dir="rtl" lang="fa">
      <h1>اتصال موتور مالی</h1>
      <p className="muted">
        موتور مالی هنوز آماده نیست. این صفحه فقط وقتی دیده می‌شود که boot شکست خورده باشد.
      </p>
      {lastError ? (
        <p role="alert" className="error">
          <code>{lastError.code}</code>
          <br />
          {lastError.message}
        </p>
      ) : null}
      {bootstrapNote ? <p className="muted">{bootstrapNote}</p> : null}
      <ol className="muted" style={{ textAlign: "right", lineHeight: 1.8 }}>
        <li>
          از ریشهٔ ریپو: <code>cd apps/web-react && npm install</code>
        </li>
        <li>
          مطمئن شوید <code>public/schema.sql</code> وجود دارد
        </li>
        <li>
          <code>npm run dev</code> و صفحه را یک‌بار hard-refresh کنید
        </li>
        <li>دسترسی شبکه برای WASM sql.js (cdn sql.js.org) لازم است مگر اینکه بسته نصب شده باشد</li>
      </ol>
      <Button type="button" onClick={() => window.location.reload()}>
        تلاش مجدد
      </Button>
=======
  const { bootstrapNote } = useAppState();
  return (
    <section className="onboarding">
      <h1>اتصال موتور مالی</h1>
      <p className="muted">
        FinancialHost هنوز bind نشده است. برای توسعه: <code>window.__PF_HOST__</code> یا{" "}
        <code>setFinancialHost</code> پس از sql.js+IndexedDB.
      </p>
      {bootstrapNote ? <p className="muted">{bootstrapNote}</p> : null}
>>>>>>> origin/main
    </section>
  );
}

export function App() {
  const { phase } = useAppState();

  if (phase === "bootstrapping") return <BootstrappingScreen />;
  if (phase === "awaiting_host") return <AwaitingHostScreen />;
  if (phase === "onboarding") return <OnboardingScreen />;
  if (phase === "recovery") return <RecoveryScreen />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/money" element={<MoneyScreen />} />
          <Route path="/transactions" element={<TransactionsScreen />} />
          <Route path="/investments" element={<InvestmentsScreen />} />
          <Route path="/loans" element={<LoansScreen />} />
          <Route path="/more/*" element={<MoreScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <SheetHost />
    </HashRouter>
  );
}
