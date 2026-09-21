import React, { useState } from "react";
<<<<<<< HEAD
import { useAppDispatch } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { REPORT_IDS } from "./reportIds";

export function MoreScreen() {
  const dispatch = useAppDispatch();
  const [reportHint, setReportHint] = useState<string | null>(null);

  return (
    <section dir="rtl" lang="fa" className="screen">
      <h1>بیشتر</h1>
      <div className="stack gap">
        <h2>گزارش‌ها</h2>
        <p className="muted">بدون مسیر جدا — از همین‌جا.</p>
        <ul className="simple-list">
          {REPORT_IDS.map((r) => (
            <li key={r.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReportHint(`${r.label} → query ${r.queryId}`)}
              >
                {r.label}
              </Button>
            </li>
          ))}
        </ul>
        {reportHint ? <p className="muted">{reportHint}</p> : null}

        <h2>ابزارها</h2>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "backup" })}>
          پشتیبان / بازیابی
        </Button>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "license" })}>
          مجوز و نسخه
        </Button>
        <Button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "import" })}>
          ورود داده
        </Button>
      </div>
=======
import { Link, Routes, Route } from "react-router-dom";
import { useAppDispatch, useAppState, useGateway } from "../app/AppProviders";
import { SettingsScreen } from "./SettingsScreen";
import { LicenseScreen } from "./LicenseScreen";

function ReportsPanel() {
  const gateway = useGateway();
  const { book } = useAppState();
  const [reportId, setReportId] = useState("trialBalance");
  const [asOf, setAsOf] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<string>("");
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const REPORTS = [
    { id: "trialBalance", label: "Trial Balance" },
    { id: "reportPack", label: "Report Pack (GL/BS/IS/CF)" },
    { id: "listInvestmentHoldings", label: "Investment Holdings" },
    { id: "accountActivity", label: "Account Activity" },
    { id: "dashboardSummary", label: "Dashboard Summary" },
  ];

  async function run() {
    setState("loading");
    setError(null);
    const input: Record<string, unknown> = {
      asOf: asOf || undefined,
      fromDate: from || undefined,
      toDate: to || undefined,
      valuationContext: { reportCurrency: book?.baseCurrency || "IRR", asOf: asOf || null },
    };
    const res = await gateway.execute(reportId, input);
    if (!res.ok) {
      setState("error");
      setError(res.message || res.code);
      setResult("");
      return;
    }
    setResult(JSON.stringify(res.data, null, 2));
    setState("ready");
  }

  return (
    <section>
      <h2>گزارش‌ها</h2>
      <label>
        گزارش
        <select value={reportId} onChange={(e) => setReportId(e.target.value)}>
          {REPORTS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        as-of
        <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
      </label>
      <label>
        from
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </label>
      <label>
        to
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </label>
      <p className="muted">ارز گزارش: {book?.baseCurrency} · TWR/MWR deferred</p>
      <button type="button" onClick={() => void run()}>
        اجرا
      </button>
      {state === "loading" ? <p>loading…</p> : null}
      {state === "error" ? <p className="form-error">{error}</p> : null}
      {state === "ready" ? (
        <pre className="report-out" style={{ maxHeight: 320, overflow: "auto", fontSize: 12 }}>
          {result}
        </pre>
      ) : null}
      {state === "idle" ? <p className="muted">گزارش را انتخاب و اجرا کنید · بدون داده ساختگی</p> : null}
    </section>
  );
}

function PlanningPanel() {
  return (
    <section>
      <h2>برنامه‌ریزی</h2>
      <h3>Budget</h3>
      <p className="muted">planned vs actual · actual از operations · بدون journal</p>
      <h3>Goals</h3>
      <p className="muted">target · progress derived/manual per contract</p>
      <h3>Bills</h3>
      <p className="muted">schedule only · due ≠ auto cash journal</p>
    </section>
  );
}

function SettingsPanelLegacy() {
  return (
    <section>
      <h2>تنظیمات</h2>
      <ul className="list">
        <li>Book · base currency (display)</li>
        <li>Number / date format</li>
        <li>Categories · default accounts</li>
        <li>Policies · privacy / app lock</li>
        <li>Backup defaults</li>
      </ul>
      <p className="muted">Display preference ≠ economic mutation</p>
    </section>
  );
}

function LicensePanelLegacy() {
  return (
    <section>
      <h2>لایسنس / Edition</h2>
      <p className="muted">enabled vs locked capabilities · history readable when locked</p>
      <p className="muted">new command → LICENSE_REQUIRED</p>
    </section>
  );
}

/** WAVE 7 — More utility center */
export function MoreScreen() {
  const dispatch = useAppDispatch();
  return (
    <section>
      <h1>بیشتر</h1>
      <ul className="list">
        <li>
          <Link to="/more/reports">گزارش‌ها</Link>
        </li>
        <li>
          <Link to="/more/planning">برنامه‌ریزی</Link>
        </li>
        <li>
          <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "backup" })}>
            پشتیبان و بازیابی
          </button>
        </li>
        <li>
          <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "import-export" })}>
            Import / Export
          </button>
        </li>
        <li>
          <Link to="/more/settings">تنظیمات</Link>
        </li>
        <li>
          <Link to="/more/license">لایسنس</Link>
        </li>
      </ul>
      <Routes>
        <Route path="reports" element={<ReportsPanel />} />
        <Route path="planning" element={<PlanningPanel />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="license" element={<LicenseScreen />} />
      </Routes>
>>>>>>> origin/main
    </section>
  );
}
