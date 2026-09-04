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

## Report modes (CROSS-CUTTING BATCH-2 §7–§8)

API queries declare `mode`: `current` | `asOf` | `period` | `sinceInception`.  
Investment period P&L exposes opening qty/cost, period txs, realized, closing valuation/unrealized separately (bridge), not a single opaque number.

## Export preflight (CROSS-CUTTING BATCH-5 §3–§4)

Before Excel/PDF/CSV financial export: detect stale snapshots via watermark; rebuild or fail with `STALE_DATA`.  
Pipeline keeps decimal **strings** — no IEEE float conversion before write.

## One SoT per metric (X-016)

Do not aggregate the same fact from domain + journal + cash snapshots. Each report metric names a single SoT path.

## P1 ValuationContext & attribution (21–23)

Global `ValuationContext`; multi-currency attribution; wealth change ≠ investment P&L. See `P1-GLOBAL-CONTRACTS.md` §§21–23.

## P0-FINAL-024…026

Period Return v1 formula; cash FX wealth matrix; full SnapshotWatermark — `Financial-Invariants.md`.

---

## Period / Wealth bridges (canonical)

```text
Wealth = Opening + ExternalFlows + InvestmentReturn + CashFX + LiabilityFX + OtherPolicy

InvestmentReturn = Realized + Unrealized + RecognizedIncome − RecognizedInvestmentExpense
```

Mixed legacy formulas that double-count sales/profit are **forbidden**.
