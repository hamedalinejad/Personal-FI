# آمادهٔ شروع کدنویسی

**وضعیت:** می‌توانید کدنویسی **Core hardening + Loan vertical** را شروع کنید.  
**Production / انتشار کامل:** هنوز **NO-GO**.

## ۱) قبل از هر commit بخوانید

1. `docs/core/CODING-GATE.md` — قوانین مطلق  
2. `docs/core/GO-NO-GO.md` — دروازه‌ها  
3. `docs/core/IMPLEMENTATION-READY-LOAN-SLICE.md` — قرارداد Loan  
4. `docs/core/LOAN-V1-RESOLUTIONS.md` — فرمول و role
5. `docs/core/LOAN-V1-SCHEMA-DISPOSITION.md` — ستون‌های v1 / DEFERRED
6. `docs/core/DEFERRED-AND-CLOSED.md` — بسته در برابر باز  

## ۲) دستورات پایه

```bash
npm install
npm test
npm run gates
```

همه باید سبز باشند قبل از ادعای پیشرفت.

## ۳) محدوده مجاز الان

| مجاز | ممنوع تا Loan RELEASE-PROVEN |
|------|------------------------------|
| `src/core/**` hardening | Crypto / Stocks / Funds / Metals packages |
| `src/features/loan/**` تکمیل | UI navigation > 6 |
| golden / recovery Loan | second cash/journal SoT |
| schema migration additive | silent formula change |

## ۴) Authority

`docs/core/DOC-AUTHORITY-CHAIN.md`  
UX: `docs/00-Product/Pages-IA.md`  
Schema: `docs/core/db/schema.sql`

## ۵) Checklist Loan RELEASE-PROVEN

ببینید `MASTER-SPEC-VERDICT.md` بخش A1–A12.  
فایل به‌تنهایی = implemented نیست.
