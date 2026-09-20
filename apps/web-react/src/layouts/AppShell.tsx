import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppState } from "../app/AppProviders";

const TABS = [
  { to: "/", label: "خانه" },
  { to: "/money", label: "پول" },
  { to: "/transactions", label: "تراکنش‌ها" },
  { to: "/investments", label: "سرمایه‌گذاری" },
  { to: "/loans", label: "وام" },
  { to: "/more", label: "بیشتر" },
];

export function AppShell() {
  const { offline } = useAppState();
  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>Personal-FI</strong>
        {offline ? (
          <span className="badge" title="Working locally">
            محلی
          </span>
        ) : null}
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="اصلی">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === "/"} className={({ isActive }) => (isActive ? "active" : undefined)}>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
