import React from "react";
import { useAppDispatch } from "../app/AppProviders";

type Item = { sheet: string; label: string };

const TOOLS: Item[] = [
  { sheet: "backup", label: "پشتیبان" },
  { sheet: "restore", label: "بازیابی از فایل" },
  { sheet: "recovery", label: "بازیابی سیستم" },
  { sheet: "import", label: "ورود داده" },
  { sheet: "license", label: "مجوز و نسخه" },
];

const SETTINGS: Item[] = [
  { sheet: "settings", label: "تنظیمات نمایش / زبان / تقویم" },
  { sheet: "price.sync", label: "همگام‌سازی قیمت" },
  { sheet: "reconcile", label: "سلامت داده / تطبیق" },
  { sheet: "tax.tools", label: "ابزار مالیات" },
];

const REPORTS: Item[] = [
  { sheet: "report.trialBalance", label: "تراز آزمایشی" },
  { sheet: "report.balanceSheet", label: "ترازنامه" },
  { sheet: "report.incomeStatement", label: "سود و زیان" },
  { sheet: "report.cashFlow", label: "جریان وجوه نقد" },
  { sheet: "report.generalLedger", label: "دفتر کل" },
  { sheet: "report.netWorth", label: "ارزش خالص" },
  { sheet: "report.investmentHoldings", label: "موجودی سرمایه‌گذاری" },
];

function MenuGroup({ title, items, open }: { title: string; items: Item[]; open: (s: string) => void }) {
  return (
    <div>
      <div className="section-title">{title}</div>
      <ul className="menu-list">
        {items.map((it) => (
          <li key={it.sheet}>
            <button type="button" onClick={() => open(it.sheet)}>
              <span>{it.label}</span>
              <span className="chev">‹</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MoreScreen() {
  const dispatch = useAppDispatch();
  const open = (sheet: string) => dispatch({ type: "OPEN_SHEET", sheet });

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>بیشتر</h1>
          <p className="subtitle">گزارش، پشتیبان، import، مجوز، تنظیمات</p>
        </div>
      </header>
      <MenuGroup title="ابزارها" items={TOOLS} open={open} />
      <MenuGroup title="تنظیمات" items={SETTINGS} open={open} />
      <MenuGroup title="گزارش‌ها" items={REPORTS} open={open} />
    </section>
  );
}
