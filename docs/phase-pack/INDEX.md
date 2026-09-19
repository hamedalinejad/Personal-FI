# Personal-FI — Phase Documentation Pack

**تاریخ تهیه:** 2026-09-19  
**دامنه:** Phase 0 تا Phase 6  
**HEAD مبنا (در زمان نگارش این بازبینی):** `27b465c` (main)  
**هدف:** مجموعه مستندات مستقل و اجرایی برای هر فاز، با تفکیک روشن بین «مشخصات»، «پیاده‌سازی واقعی»، «اثبات CI»، «موارد باز» و «شرایط عبور».

## اصل کلیدی

این مجموعه جایگزین Owner Documentهای normative پروژه نیست. Source of Truth واقعی همچنان کد، schema، registryهای machine-readable، تست‌ها و Owner Documentهای زنده داخل repository است. این فایل‌ها برای تحویل فاز، onboarding کدنویس/AI، audit trail و اجرای مرحله‌ای تهیه شده‌اند.

Owner documents زنده:

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/FINANCIAL-CORE.md`
- `docs/DATA-MODEL.md`
- `docs/API.md`
- `docs/REPORTING.md`
- `docs/OFFLINE-RELEASE.md`
- `docs/DEVELOPMENT.md`
- `docs/QUALITY-STATUS.md`
- `docs/core/registry/*`
- `docs/core/db/schema.sql`

## وضعیت فازها — 2026-09-19 (synced to main)

| فاز | موضوع | وضعیت اجرایی | اثبات فعلی |
|---|---|---|---|
| Phase 0 | Semantic / Contract / Registry Closure | **پیاده‌سازی‌شده** | field-preservation / command-catalog / constraints gates؛ Freeze هنوز اثبات نشده |
| Phase 1 | Money / FX / Accounting Foundations | **پیاده‌سازی‌شده** | Decimal boundary + FX + journal matrices؛ carry-overها در Phase 2 بسته شده‌اند |
| Phase 2 | Accounting Kernel | **پیاده‌سازی‌شده** | journal invariants، economic identity، fee/reversal kernel؛ GitHub Actions Run 390 = SUCCESS (438/438) در تاریخ snapshot قبلی |
| Phase 3 | Persistence / Recovery | **پیاده‌سازی‌شده** | durability state machine، integrity firewall، backup/restore؛ Run 396 = SUCCESS در تاریخ snapshot قبلی |
| Phase 4 | Loan Reference Lifecycle | **پیاده‌سازی‌شده** | as-of filter، paid_off ↔ active، signed reversal؛ acceptance محلی سبز (`as-of-close.test.js` 2/2) — failure تاریخی Run 400 برطرف شده در کد |
| Phase 5 | Investment Reporting | **پیاده‌سازی‌شده روی main** | `investmentHoldings` یکپارچه crypto/stocks/funds/metals؛ 5 تست acceptance سبز |
| Phase 6 | Accounts / Income / Expense / Cheque / Tax / Assets / Planning | **پیاده‌سازی‌شده روی main** | 10 تست acceptance سبز؛ planning بدون journal leakage |

### تفکیک وضعیت‌های proof

| وضعیت | معنا |
|--------|------|
| پیاده‌سازی‌شده | code path + domain tests برای scope ادعا‌شده وجود دارد |
| acceptance محلی سبز | `node --test` برای fixture/acceptance همان فاز پاس است |
| CI SUCCESS (historical) | یک run مشخص GitHub Actions در گذشته سبز بوده |
| FREEZE_PROVEN | **false** — semantic freeze کامل هنوز machine-proven نیست |
| RELEASE_PROVEN | **false** |
| PRODUCTION | **NO-GO** |

## قوانین وضعیت (canonical)

- `IMPLEMENTED` = وجود code path، نه release proof.
- `GOLDEN-GREEN` = fixtureهای ادعاشده سبز هستند.
- `RECOVERY-GREEN` = recovery matrix سبز است.
- `RELEASE-PROVEN` فقط وقتی مجاز است که golden + recovery + standalone + CI برای scope مربوطه اثبات شده باشد.
- `FREEZE_PROVEN` و `RELEASE_PROVEN` فعلاً **false** هستند.
- Production فعلاً **NO-GO** است.

هرگز این‌ها را یکی نکنید:

```text
code exists  ≠  golden green  ≠  recovery green  ≠  release proven
```

## مسیرهای اجرایی مرتبط با هر فاز

| فاز | مسیرهای اصلی کد |
|-----|------------------|
| 0 | `docs/core/registry/*`, `scripts/field-preservation-check.js`, `scripts/command-constraints-check.js` |
| 1 | `src/core/money/*`, `src/core/domain/fx/*`, `src/core/domain/invariants/*` |
| 2 | `src/core/domain/operation/operationEngine.js`, `src/core/domain/fee/*`, `src/core/accounting/*` |
| 3 | `src/core/persistence/worker.js`, `src/core/persistence/integrity.js` |
| 4 | `src/features/loan/**` |
| 5 | `src/core/accounting/reports/investment.js` |
| 6 | `src/features/{accounts,income,expense,cheque,tax,assets,budget,goals,bills}/**` |

## Acceptance محلی (حداقل gate قبل از ادعای فاز)

```bash
# Phase 4
node --test src/features/loan/tests/as-of-close.test.js

# Phase 5
node --test src/core/accounting/reports/investment.test.js

# Phase 6
node --test src/features/accounts/tests/phase6-core-finance.test.js
```

در HEAD `27b465c` این سه مجموعه با هم **17/17** پاس شده‌اند.

## موارد عمداً باز (خارج از بستن فاز 0–6)

- Browser sql.js + IndexedDB RELEASE E2E
- FREEZE_PROVEN / RELEASE_PROVEN
- TWR / MWR / Corporate Actions
- Advanced loan day-count / variable rate / borrower role
- Crypto deferred commands (swap/deposit/withdraw/airdrop)
- UI expansion beyond locked IA

## فهرست فایل‌های این pack

- `INDEX.md` ← این فایل (وضعیت زنده pack)
- `PHASE-PACK-METADATA.md` ← جدول commit/CI/state فشرده
- مشخصات اجرایی فازها در conversation/attachments نگهداری شده‌اند؛ authority نهایی = owner docs + registry + code
- جزئیات وضعیت هر فاز در `docs/QUALITY-STATUS.md` منعکس شده است

## قانون به‌روزرسانی این INDEX

هر بار که یک فاز تکمیل یا اصلاح می‌شود:

1. ردیف جدول وضعیت این فایل به‌روز شود.
2. `docs/QUALITY-STATUS.md` بخش همان فاز به‌روز شود.
3. proof محلی (`node --test` یا `npm run gates`) ذکر شود.
4. هیچ ادعای `RELEASE-PROVEN` بدون evidence bundle ساخته نشود.

## End state هدف بعد از Phase 0–6

```text
SEMANTIC_CODING_READY     = true
PHASE_0 … PHASE_6         = implemented (local acceptance green)
FREEZE_PROVEN             = false
RELEASE_PROVEN            = false
PRODUCTION                = NO-GO
```

یک Kernel مشترک حسابداری، Loan reference، investment valuation یکپارچه، و ماژول‌های حسابداری روزمره (accounts/income/expense/cheque/tax/assets) + planning جدا از journal truth.
