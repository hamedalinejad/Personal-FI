# گزارش‌های ضروری

گزارش‌ها از Ledger + Engine + Valuation می‌آیند؛ نه از cache به‌عنوان SoT.

## حسابداری

- دفتر روزانه
- دفتر کل
- تراز آزمایشی
- ترازنامه شخصی
- درآمد و هزینه
- جریان وجوه نقد
- دارایی‌ها و بدهی‌ها
- حساب اشخاص
- مغایرت بانکی
- بر اساس دسته‌بندی / Tag / پروژه یا هدف
- چندارزی
- دوره‌ای (جلالی و میلادی)

## سرمایه‌گذاری

- ارزش فعلی پرتفوی
- ارزش بر اساس کارگزاری / کیف پول / حساب
- سود و زیان تحقق‌یافته / تحقق‌نیافته
- قیمت تمام‌شده (cost basis)
- جریان نقدی سرمایه‌گذاری
- بازده زمانی (TWR) و IRR/XIRR (P1/P2)
- سود نقدی و کوپن
- کارمزد و مالیات
- عملکرد هر دارایی / صندوق
- وزن دارایی در پرتفوی
- اختلاف موجودی ثبت‌شده با واقعی (reconcile)

## وام

- مانده اصل
- سود / کارمزد پرداخت‌شده
- اقساط سررسیدشده / معوق
- جریمه دیرکرد
- جدول کامل اقساط
- جریان نقدی آتی
- تسویه زودهنگام
- وثیقه و ضامن
- مقایسه برنامه اولیه با اصلاح‌شده

UI: زیر صفحه **Reports** (و گزارش‌های تخصصی ماژول در همان Shell/Sheet) — نه صفحه ناوبار جدا برای هر گزارش.


---

## P0-090 — Canonical metrics

P&L and wealth metrics used by Reports, Portfolio, and Dashboard share **one definition catalog** and shared query path. Divergent formulas for the same metric name are forbidden. See ARCHIVE-NOTE-BATCH-LOCKS.md (was P0-090-100; use Essential-Reports / P0-FINAL).


---

## Report modes (Policy (ex-batch-2) §7–§8)

API queries declare `mode`: `current` | `asOf` | `period` | `sinceInception`.  
Investment period P&L exposes opening qty/cost, period txs, realized, closing valuation/unrealized separately (bridge), not a single opaque number.

## Export preflight (Policy (ex-batch-5) §3–§4)

Before Excel/PDF/CSV financial export: detect stale snapshots via watermark; rebuild or fail with `STALE_DATA`.  
Pipeline keeps decimal **strings** — no IEEE float conversion before write.

## One SoT per metric (X-016)

Do not aggregate the same fact from domain + journal + cash snapshots. Each report metric names a single SoT path.

## P1 ValuationContext & attribution (21–23)

Global `ValuationContext`; multi-currency attribution; wealth change ≠ investment P&L. See `P1-GLOBAL-CONTRACTS.md` §§21–23.

## P0-FINAL-024…026

Period Return v1 formula; cash FX wealth matrix; full SnapshotWatermark — **this file** § Period / Wealth bridges (not Financial-Invariants.md).

---

## Period / Wealth bridges (canonical)

```text
Wealth = Opening + ExternalFlows + InvestmentReturn + CashFX + LiabilityFX + OtherPolicy

InvestmentReturn = Realized + Unrealized + RecognizedIncome − RecognizedInvestmentExpense
```

Mixed legacy formulas that double-count sales/profit are **forbidden**.

---

## Requirements Lock (MR-297 … MR-309) — 100% complete 2026-09-05

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| MR-297 | Net Worth report | ✅ LOCKED | Portfolio-Wealth-Overview + Essential-Reports; assets − liabilities at asOf |
| MR-298 | Cash Flow report | ✅ LOCKED | income − expense over period from journal + domain income/expense; period filter |
| MR-299 | Income Statement | ✅ LOCKED | revenue − expenses (P&L) for period; projection from journal + categories |
| MR-300 | Balance Sheet | ✅ LOCKED | assets = liabilities + equity at asOf; journal-derived snapshot |
| MR-301 | Investment P&L | ✅ LOCKED | Cost-Basis-Engine realized + unrealized |
| MR-302 | Realized vs Unrealized P&L | ✅ LOCKED | separate columns/sections; realized from disposals, unrealized from valuation − carrying |
| MR-303 | Tax report | ✅ LOCKED | Tax-Management tax_events by period_key / jurisdiction |
| MR-304 | Loan amortization schedule | ✅ LOCKED | Loan-Schedule-Engine schedule snapshot + residual |
| MR-305 | Portfolio allocation | ✅ LOCKED | asset class / instrument weight % of total portfolio value at asOf |
| MR-306 | Historical wealth bridge | ✅ LOCKED | Essential-Reports: opening NW → flows → valuation Δ → closing NW |
| MR-307 | Period return | ✅ LOCKED | Essential-Reports TWR / simple return; explicit formula |
| MR-308 | Fee analysis | ✅ LOCKED | total fees by category / instrument / fee_kind from domain txs + journal |
| MR-309 | Category spending | ✅ LOCKED | expense by category over time (from exp_transactions / journal + cat_categories) |

All reports are **projections** from Ledger + Engines + Valuation; never a second SoT.  
UI lives under the single Reports page (Sheet), not extra nav routes.  
asOf / period parameters mandatory; multi-currency via historical FX.
