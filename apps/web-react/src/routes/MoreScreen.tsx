import React, { useState } from "react";
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
    </section>
  );
}
