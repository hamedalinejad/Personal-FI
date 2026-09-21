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
import { Button } from "../components/common/Button";

function BootstrappingScreen() {
  return (
    <section className="onboarding" dir="rtl" lang="fa">
      <div className="topbar-logo" style={{ width: 48, height: 48, fontSize: "1rem" }} aria-hidden>
        FI
      </div>
      <h1>در حال آماده‌سازی</h1>
      <p className="muted">باز کردن پایگاه داده محلی…</p>
    </section>
  );
}

function AwaitingHostScreen() {
  const { bootstrapNote, lastError } = useAppState();
  return (
    <section className="onboarding" dir="rtl" lang="fa">
      <h1>اتصال موتور مالی</h1>
      <p className="muted">موتور مالی هنوز آماده نیست.</p>
      {lastError ? (
        <p role="alert" className="error">
          <code>{lastError.code}</code>
          <br />
          {lastError.message}
        </p>
      ) : null}
      {bootstrapNote ? <p className="muted">{bootstrapNote}</p> : null}
      <Button type="button" onClick={() => window.location.reload()}>
        تلاش مجدد
      </Button>
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
