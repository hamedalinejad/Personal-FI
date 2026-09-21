import React from "react";
import { useAppState } from "../app/AppProviders";

/** Step 17 — Settings (display prefs only; no economic mutation) */
export function SettingsScreen() {
  const { book } = useAppState();
  return (
    <section>
      <h1>تنظیمات</h1>
      <ul className="list">
        <li>دفتر: {book?.name || "—"}</li>
        <li>ارز پایه (نمایش): {book?.baseCurrency || "—"}</li>
        <li>قالب عدد / تاریخ — فقط نمایش</li>
        <li>قفل محلی — اختیاری</li>
        <li>پیش‌فرض پشتیبان</li>
      </ul>
      <p className="muted">تغییر ترجیح نمایش ≠ جهش اقتصادی</p>
    </section>
  );
}
