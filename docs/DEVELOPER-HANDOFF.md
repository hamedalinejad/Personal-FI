# Developer Handoff — Personal-FI (FINAL)

**وضعیت کدنویسی کل محصول: READY**  
**وضعیت انتشار Production: NO-GO** تا CI عمومی + recovery روی محیط واقعی سبز شود.

---

## 1) شروع در ۶۰ ثانیه

```bash
git pull
npm ci    # یا npm install
npm test
npm run gates
```

همه باید سبز باشند.

**بخوانید (به ترتیب):**

1. این فایل  
2. `docs/core/CODING-GATE.md`  
3. `docs/core/DOC-AUTHORITY-CHAIN.md`  
4. `docs/core/LOAN-V1-RESOLUTIONS.md` (الگوی مرجع)  
5. `docs/core/IMPLEMENTATION-READY-FEATURES.md` (Crypto…Metals)  
6. `docs/core/db/schema.sql`

---

## 2) چه چیزی «تمام» شده و چه چیزی «شروع کد» است

| لایه | وضعیت | معنی برای تیم |
|------|--------|----------------|
| معماری + قوانین مالی | **قفل** | اختراع نکنید |
| Schema + inventory + manifest | **آماده** | additive migration فقط |
| Core runtime (money, op, journal, SQLite) | **قابل استفاده** | harden با regression test |
| Loan vertical | **الگوی کامل + تست سبز** | مرجع کپی برای بقیه |
| Crypto / Stocks / Funds / Metals / Cheque | **SPEC + قرارداد آماده** | پیاده‌سازی با همان الگو |
| UI / PWA shell | **SPEC** | بعد از data-plane |
| Production tag | **NO-GO** | تا gates روی GitHub Actions |

---

## 3) قوانین مطلق (خلاصه)

- پول/مقدار/نرخ = **string اعشاری** · بدون `Number` · بدون `CAST REAL`
- یک Cash SoT: `fin_accounts` + `fin_journal_lines`
- یک Journal · عملیات atomic در **یک** تراکنش SQLite
- `operationId` کلاینت · hash · replay / conflict
- Posted = immutable · اصلاح = reversal + op جدید
- هویت ابزار = `ref_instruments.id`
- بدون silent default برای تاریخ/ارز/FX/قیمت
- Loan declining v1 = **equal-principal** · rate API = درصد (`12`→`0.12`)
- UX ≤ ۶ مقصد (`Pages-IA.md`)

---

## 4) الگوی فیچر (اجباری)

```text
Feature Public API
  → Domain calc (pure)
  → runAtomicFinancialOperation
      → journal + domain ledger در یک COMMIT
  → queries / reports از ledger+journal
```

ممنوع: Feature A → SQL/domain خصوصی Feature B · Core → Feature

مرجع زنده: `src/features/loan/**`

---

## 5) Loan — قرارداد اجرایی (مرجع)

**create** نیاز دارد:  
`operationId, role=lent, principal, currency, annualRate, periods, method, startDate, businessDate, dayCount`

**payment:** waterfall penalty→fee→interest→principal · overpayment = reject  
**reverse:** op جدید · `ALREADY_REVERSED` روی تکرار

جزئیات: `IMPLEMENTATION-READY-LOAN-SLICE.md` · `LOAN-V1-SCHEMA-DISPOSITION.md`

---

## 6) بقیه فیچرها

همه قراردادهای v1 در:

- `IMPLEMENTATION-READY-FEATURES.md`
- `DOMAIN-CONTRACTS-31-44.md`
- `docs/features/**`

تیم می‌تواند **موازی** روی Crypto/Funds/Stocks/Metals کار کند؛ فقط الگوی Loan و Core را نقض نکند.

---

## 7) Definition of Done هر فیچر

```text
public-api + commands/queries
+ journal mapping
+ schema fields mapped
+ golden tests
+ idempotency + reverse
+ recovery smoke
= RELEASE-PROVEN برای آن فیچر
```

Production محصول = همه فیچرهای scope v1 + CI Actions سبز + offline backup.

---

## 8) نقشه اسناد

| نیاز | مسیر |
|------|------|
| این handoff | `docs/DEVELOPER-HANDOFF.md` |
| Gates | `core/GO-NO-GO.md` |
| Closed/deferred | `core/DEFERRED-AND-CLOSED.md` |
| Journal | `core/JOURNAL-LINE-CONTRACT.md` |
| Durability | `core/PERSISTENCE-DURABILITY.md` |
| UX | `00-Product/Pages-IA.md` |

---

## 9) ممنوع

```text
دفتر نقد دوم · ژورنال دوم · silent operationId/date/currency
Number برای پول · mutate posted · symbol به‌جای instrumentId
فرمول بدون version bump · «implemented» بدون تست
```
