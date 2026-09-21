import React from "react";

/** Step 17 — License / edition (capability gate; history preserved) */
export function LicenseScreen() {
  return (
    <section>
      <h1>لایسنس / Edition</h1>
      <p className="muted">قابلیت‌های فعال در مقابل قفل‌شده</p>
      <ul className="list">
        <li>full — همه ماژول‌ها</li>
        <li>loan-only — /loans + /more</li>
        <li>crypto-only — /investments + /more</li>
      </ul>
      <p className="muted">قفل: دستور جدید → LICENSE_REQUIRED · تاریخچه خوانا · backup مجاز</p>
    </section>
  );
}
