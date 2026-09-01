# ترتیب تکمیل مستندات و پیاده‌سازی

## سه لایه معماری محصول

```text
Operational Data
        ↓
Module Sub-ledger
        ↓
Optional Main Accounting Integration
```

کاربر فقط وام / فقط صندوق و طلا / یا همه + حسابداری — با همان Core integrity.

## فاز صفر: اصلاح اسناد (قبل از کد)

- واژه‌نامه FA/EN (`Naming-Glossary.md`)
- Scope / out of scope (`Project-Blueprint` / Product-Map)
- Bounded Context ماژول‌ها
- ERD / schema tables (`db/`)
- واحد پول و دقت
- تاریخ و تقویم
- مدل دفترکل
- State machine وام / تراکنش / سرمایه‌گذاری
- OpenAPI یا معادل contract هر ماژول (`API-Requirements` · Feature contracts)
- قرارداد بین ماژول‌ها (Capability · SettlementPort)
- Import و raw data
- Backup و offline
- Test Vector و Acceptance
- Versioning و Migration
- Risk registers P0/P1/P2

## فاز یک: هسته پایدار

Foundation · Currency · Calendar · Audit · Attachment · Import/Export · Cash · Accounting Ledger

## فاز دو: وام

قرارداد · موتور اقساط · کارمزد · جرائم · پرداخت · تسویه/تغییر برنامه · گزارش مستقل

## فاز سه: سرمایه‌گذاری عمومی

Instrument · Broker/Wallet · Trade · Lot · قیمت · P&L · کارمزد · پرتفوی

## فاز چهار: صندوق، طلا، ایران

NAV · صدور/ابطال · FIF · طلا · سهام ایران · تقویم کاری · import کارگزاری · CA

## فاز پنج: رمزارز و تجاری‌سازی

Wallet/chain · tx hash · gas/fee asset · staking/airdrop · License offline · Workspace · Role · بسته‌بندی editionها

مرجع اولویت کد: `Implementation-Priority.md`
