import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAppState } from "../app/AppProviders";

const TABS = [
  {
    to: "/",
    label: "خانه",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/money",
    label: "پول",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18M12 12.5v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/transactions",
    label: "تراکنش",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M7 7h11M7 12h11M7 17h7" strokeLinecap="round" />
        <path d="M4 7h.01M4 12h.01M4 17h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/investments",
    label: "سرمایه",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 19V5M4 19h16" strokeLinecap="round" />
        <path d="M8 15v-3M12 15V9M16 15v-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/loans",
    label: "وام",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M9.5 10.5c.5-1 1.5-1.5 2.5-1.5s2 .6 2 1.75-1 1.5-2.5 1.9-2.5.7-2.5 1.85 1 1.75 2.5 1.75 2-.5 2.5-1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/more",
    label: "بیشتر",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const TITLES: Record<string, string> = {
  "/": "خانه",
  "/money": "حساب‌ها و پول",
  "/transactions": "تراکنش‌ها",
  "/investments": "سرمایه‌گذاری",
  "/loans": "وام‌ها",
  "/more": "تنظیمات و ابزارها",
};

export function AppShell() {
  const { offline, book } = useAppState();
  const location = useLocation();
  const path = location.pathname.startsWith("/more") ? "/more" : location.pathname;
  const pageTitle = TITLES[path] || "Personal-FI";

  return (
    <div className="app-shell" dir="rtl" lang="fa">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo" aria-hidden>
            FI
          </div>
          <div className="topbar-title">
            <strong>{pageTitle}</strong>
            <span>{book?.name ? `${book.name} · ${book.baseCurrency}` : "دفتر مالی آفلاین"}</span>
          </div>
        </div>
        <div className="topbar-actions">
          {offline ? (
            <span className="badge" title="ذخیره محلی">
              آفلاین
            </span>
          ) : (
            <span className="badge neutral">آنلاین</span>
          )}
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="منوی اصلی">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
