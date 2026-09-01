# Implementation Priority (قبل از Code)

## P0 — حتماً قبل از کدنویسی

| مورد | وضعیت مستند |
|------|-------------|
| Account name NOT unique | ✅ Accounts-Banking |
| Standalone Loan / SettlementPort | ✅ Loan + Cash-Settlement-Adapter |
| Operation → Domain → Journal → Cash SoT | ✅ Canonical-Financial-Operation |
| Currency ≠ Instrument | ✅ Instrument-Identity |
| Rate semantics explicit | ✅ Currency-CrossRate |
| Capability API layer | ✅ Capability-API.md |
| Persistence State Machine | ✅ Persistence-State-Machine.md |
| Snapshot ≠ SoT + Rebuild APIs | ✅ Rebuild-API-Contract.md |
| calculationContext / roundingPolicyVersion | ✅ Canonical op + Rounding |
| Decimal / Field-Level SoT / Operation Matrix | ✅ موجود |
| Product Principle (complexity in domain) | ✅ Product-Principle.md |

## P1 — قبل از implementation کامل MVP

| مورد | سند |
|------|-----|
| Business Calendar (Iran) | iran/README |
| Fee Engine / Fee Policy | Fee-Treatment-Matrix |
| Import Lineage + showOrigin | Import-Lineage.md |
| Feature Enablement + Nav Visibility | Pages-IA |
| Capability API تکمیل | Capability-API.md |
| Rebuild API contract | Rebuild-API-Contract.md |
| Snapshot consistency | Raw-vs-Derived · reconcile |

## P2 — بعداً

License · Cloud Sync · Multi-device · Mobile · Desktop · Advanced Tax · Advanced FIFO · Advanced Loan models

## وضعیت کیفی (بررسی)

| بخش | وضعیت |
|------|--------|
| ایده محصول | عالی |
| تعداد صفحات | خیلی خوب |
| Modular + Standalone | خوب → تکمیل با Isolation/Port |
| Accounting / Journal / Decimal | بسیار خوب |
| Offline / Preservation / API | بسیار خوب |
| Crypto / Cost Basis / Stocks / Funds / Metals | قوی تا خوب |
| Loans | کامل + یکپارچه با Operation SoT |
| License future | جهت درست |
| ایران / Calendar | خوب؛ Calendar قرارداد P1 |
| خطر پیچیدگی | متوسط اگر Capability تثبیت نشود |

---

## Day-1 code checklist (اضافه)

- [ ] ESLint `no-restricted-imports` بین Featureها
- [ ] UI success فقط state PERSISTED
- [ ] Reconcile job برای orphan polymorphic links → `ref_integrity_queue`
- [ ] CA stocks: fixture break-even افزایش سرمایه / حق تقدم
- [ ] Rounding نمایشی فقط UI؛ DB full precision

---

## ترتیب پیشنهادی پیاده‌سازی کد

| فاز | محتوا |
|-----|--------|
| **P0** | core/db + types + Canonical-Cash + rounding + Persistence SM + MoneyString |
| **P1** | 00-Accounts + Income + Expense |
| **P2** | 04-Loan + Loan-Engine + 03-Cheque |
| **P3** | 17-Currency + 19-Price + 05-Investment + Cost-Basis |
| **P4** | 13-Portfolio + 11-Reports + 14-Tax Iran |

هر فاز فقط از public/Capability API؛ ESLint مرز فیچر از روز اول.

---

## Gate اجباری

قبل از code مالی: مرور `P0-Risk-Register.md` (۹ مورد). همه باید در docs ✅ و در روز اول کد enforce شوند.

---

## Gate P1

قبل از MVP کامل: `P1-Risk-Register.md` (۱۱ مورد) — شامل Fiscal Period Lock و Lot/CA/Fund/FX history/Audit.

---

## Gate P2 / P3

- P2: `P2-P3-Risk-Register.md` — Import preview، Backup تست‌شده، attachments hash، اعداد فارسی، API errors
- P3: گزارش stale-aware، Workspace/Role، License offline token (هسته را بلوکه نکند)

---

## کاتالوگ‌های اجباری قبل از کد

- Canonical-Financial-Operation-Catalog
- Financial-Invariant-Catalog
- Side-Effect-Matrix
- Accounting-Event-Mapping-Matrix
- Feature-Capability-Matrix
- Financial-Scenario-Catalog (+ golden fixtures)
- Layer-Separation · Versioning-Policy · Field-Write-Contract

PR بدون به‌روزرسانی Data Dictionary برای field مالی جدید ممنوع.
هر endpoint جدید: Purpose, Request, Response, Errors, Idempotency, Side effects, SoT, Permissions, Offline.
