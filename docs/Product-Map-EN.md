> **SoT Scope v1:** این نقشه لیست Featureهای محصول است و بر تفسیر محدود Blueprint قدیمی مقدم است.

English Version - Product Map
Product Map
Personal Finance & Investment Management System
Document Type: Product Architecture
Version: 1.8.0
Date: 2026-07-16
Status: Final
Introduction
This document defines the complete product map. Each feature is designed as a fully independent module.
Main Features
1. Accounts & Banking
Management of bank accounts, account balances, and transfers between bank accounts.
2. Currency & Multi-Currency
Management of multiple currencies, live exchange rates, offline caching, and asset conversion.
3. Income
Recording, editing, and management of all types of income, including recurring income.
4. Expense
Recording, editing, and management of all types of expenses, including recurring and installment expenses.
5. Cheque Management
Management of issued and received cheques, due dates, clearing, and bouncing.
6. Debt & Loan Management
Management of debts, receivables, loans, installments, interest, and late fees.
7. Investment Management
Includes crypto, Iran equities, fixed-income funds, metals (gold/silver, etc.), portfolio tracking, and fees.
8. Physical Assets
Management of vehicles, real estate, and other non-market physical assets (investment metals are under Investment — Metals).
9. Budget Management
Monthly and yearly budgeting using Envelope (Zero-Based) method with controls and alerts.
10. Financial Goals
Defining financial goals, progress tracking, and achievement reports.
11. Bills & Recurring Transactions
Management of bills, periodic payments, and recurring incomes with reminders.
12. Notification & Reminder System
Notifications for due dates, budgets, goals, and transactions.
13. Reports & Analytics
Comprehensive reports and analytics across the entire system.
14. Dashboard
Main page with financial summary and key charts (including Net Worth Trend).
15. Portfolio & Wealth Overview
Overall portfolio and net worth view with trend analysis.
16. Tax Management
Tax calculation and reporting.
17. Document Management
Uploading and managing invoices, contracts, cheque images, and financial documents.
18. Settings & Tools
General settings, themes, language, backup, and utility tools.
19. Security & Privacy
Data encryption, authentication, PIN, biometric, and audit logging.
20. Price Fetching
Live price fetching for all investment asset types in v1 (crypto, Iran stocks, fixed-income fund NAV, metals) — via manual entry or optional Auto-Sync from external APIs, with full offline caching in price_history. No dedicated page — accessed from within the Investments and Settings pages.

---

## Common Categories

Shared category tables used across all features (`common_categories`) — no dedicated page. These tables are the shared infrastructure for income, expense, budget, and goals, and are managed from within Settings. Documentation: `docs/features/99-Common-Categories/Categories.md`.

---

## Feature Number to Documentation Folder Mapping

The numbering in this document follows product/logical order and does not match the folder numbers under `docs/features/`.

| Product-Map # | Feature | `docs/features/` folder |
|---|---|---|
| 1 | Accounts & Banking | `00-Accounts-Banking/` |
| 2 | Currency & Multi-Currency | `17-Currency-CrossRate/` |
| 3 | Income | `01-Income/` |
| 4 | Expense | `02-Expense/` |
| 5 | Cheque Management | `03-Cheque-Management/` |
| 6 | Debt & Loan Management | `04-Debt-Loan-Management/` |
| 7 | Investment Management | `05-Investment/` (4 sub-features) |
| 8 | Physical Assets | `06-Physical-Assets/` |
| 9 | Budget Management | `07-Budget-Management/` |
| 10 | Financial Goals | `08-Financial-Goals/` |
| 11 | Bills & Recurring Transactions | `09-Bills-Recurring-Transactions/` |
| 12 | Notification & Reminder System | `10-Notification-Reminder-System/` |
| 13 | Reports & Analytics | `11-Reports-Analytics/` |
| 14 | Dashboard | `12-Dashboard/` |
| 15 | Portfolio & Wealth Overview | `13-Portfolio-Wealth-Overview/` |
| 16 | Tax Management | `14-Tax-Management/` |
| 17 | Document Management | `15-Document-Management/` |
| 18 | Settings & Tools | `16-Settings-Tools/` |
| 19 | Security & Privacy | `18-Security-Privacy/` |
| 20 | Price Fetching | `19-Price-Fetching/` (4 sub-features) |
| — | Common Categories | `99-Common-Categories/` |