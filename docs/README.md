# Personal-FI Documentation

**برای هر AI یا توسعه‌دهنده — فقط این مسیر را دنبال کنید.**

## شروع (۵ دقیقه)

| # | سند | چرا |
|---|-----|-----|
| 1 | `core/CODING-GATE.md` | قوانین مطلق DO NOT |
| 2 | `core/GO-NO-GO.md` | وضعیت زنده + ترتیب کار |
| 3 | `core/EXECUTION-HANDOFF.md` | handoff کامل §45–57 |
| 4 | `core/IMPLEMENTATION-READY-INDEX.md` | نقشهٔ پیاده‌سازی |
| 5 | `core/IMPLEMENTATION-READY-LOAN-SLICE.md` | **اولین vertical** |

## Authority

| موضوع | مرجع |
|--------|------|
| UX / صفحات (≤۶) | `00-Product/Pages-IA.md` |
| معماری حسابداری | `core/ARCHITECTURE-LOCKED.md` |
| اسکیما | `core/db/schema.sql` |
| قرارداد دامنه‌ها | `core/DOMAIN-CONTRACTS-31-44.md` |
| وضعیت | `core/OPEN-ISSUES-REGISTER.md` |

## کد موجود (نه صفر)

```text
src/core/          engines + persistence + money + invariants
src/features/loan/ Loan package scaffold (public-api, commands, ledger, …)
```

## دستورات

```bash
npm install
npm test
npm run gates
```

## ترتیب Feature

```text
Loan RELEASE-PROVEN → Crypto → Funds → Stocks → Metals → Accounts UI
```

## Production

**NO-GO** تا Gateهای GO-NO-GO سبز شوند. وجود فایل ≠ RELEASE-PROVEN.

Historical audits (`FINAL-THINK-TANK-*`, old AUDIT) مرجع اجرایی نیستند.
