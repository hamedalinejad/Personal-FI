import React, { useState } from "react";
import { useAppDispatch, useGateway } from "../app/AppProviders";
import { REPORT_IDS } from "./reportIds";

export function MoreScreen() {
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  const [reportHint, setReportHint] = useState<string | null>(null);

  async function openReport(queryId: string, label: string) {
    const res = await gateway.execute(queryId, {});
    if (!res.ok) {
      setReportHint(`${label}: ${res.code}`);
      return;
    }
    setReportHint(`${label} آماده است`);
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>بیشتر</h1>
          <p className="subtitle">گزارش‌ها، پشتیبان، مجوز و ورود داده</p>
        </div>
      </header>

      <div>
        <div className="section-title">ابزارها</div>
        <ul className="menu-list">
          <li>
            <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "backup" })}>
              <span>پشتیبان و بازیابی</span>
              <span className="chev">‹</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "import" })}>
              <span>ورود داده</span>
              <span className="chev">‹</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => dispatch({ type: "OPEN_SHEET", sheet: "license" })}>
              <span>مجوز و نسخه</span>
              <span className="chev">‹</span>
            </button>
          </li>
        </ul>
      </div>

      <div>
        <div className="section-title">گزارش‌ها</div>
        <ul className="menu-list">
          {REPORT_IDS.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => void openReport(r.queryId, r.label)}>
                <span>{r.label}</span>
                <span className="chev">‹</span>
              </button>
            </li>
          ))}
        </ul>
        {reportHint ? <p className="muted" style={{ marginTop: 8 }}>{reportHint}</p> : null}
      </div>
    </section>
  );
}
