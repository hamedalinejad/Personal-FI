## Canonical order

See `ARCHITECTURE-LOCKED.md` §10 execution order. Do not invent parallel plans.

# IMPLEMENTATION FIX PLAN — Personal-FI

> نسخه اجرایی ممیزی نهایی — 2026-09-03
>
> این فایل «نقشه کار برنامه‌نویس» است، نه فهرست ایده‌ها. هیچ Feature جدیدی قبل از عبور از P0های این سند وارد implementation نشود.

## 0. وضعیت نهایی

**Current status: BLOCKED FOR FEATURE CODING**

> Audit series (5 passes + 5 cycles) applied 2026-09-03. See `FINAL-THINK-TANK-AUDIT-2026-09-03.md` and `GO-NO-GO.md`. P0-DOC residual prose closed; schema freeze still required.

دلیل: قراردادهای اصلی خوب تثبیت شده‌اند، اما چند تضاد مستنداتی و چند شکاف schema/fixture هنوز می‌توانند به دو implementation متفاوت منجر شوند.

هدف این فایل:

```text
Audit Finding
  → Exact action
  → Acceptance criteria
  → Dependency
  → Done
```

## 1. قوانین غیرقابل مذاکره

1. `ref_instruments.id` تنها هویت canonical دارایی است.
2. `fin_accounts + fin_journal_lines` تنها SoT مانده نقد هستند.
3. `acc_transactions`، `inv_crypto_cash` و brokerage `cashBalance` فقط event/projection هستند، نه balance truth دوم.
4. همه اعداد مالی persisted/API/fixture/event = decimal string.
5. posted financial data با UPDATE مالی تغییر نمی‌کند؛ correction فقط reversal/correct operation است.
6. هر mutation مالی از مسیر `Feature Command → Operation Builder → Core → Journal/Cash → Projection` عبور می‌کند.
7. هر command مالی `operationId` اجباری دارد و idempotency با `commandHash` کنترل می‌شود.
8. قیمت و FX اینترنتی برای correctness تراکنش لازم نیستند؛ transaction value/rate تاریخی در operation ذخیره می‌شود.
9. `businessDate` = Gregorian DATE-only؛ تبدیل UTC→businessDate با timezone پروفایل انجام می‌شود؛ Jalali فقط presentation/business-calendar adapter است.
10. snapshot قابل rebuild است و هرگز SoT گزارش نیست.
11. داده RAW حذف نمی‌شود مگر migration صریح و reversible.
12. standalone Feature یعنی استقلال UI و dependency؛ Accounting Core و journal پشت آن حذف نمی‌شوند.
13. Feature-to-feature write فقط از Public API / Port / Adapter مجاز است؛ repository/table داخلی فیچر دیگر ممنوع.
14. هر rule فقط یک owner و یک canonical document دارد.

---

# 2. P0 — باید قبل از Feature Coding بسته شوند

## P0-FIX-001 — یکسان‌سازی CashSettlementPort

**محل:** `docs/core/Cash-Settlement-Adapter.md`

**مشکل:** عبارت `LocalSettlementAdapter` هنوز امکان برداشت از feature-local cash ledger را تداعی می‌کند، در حالی که Cash SoT باید فقط journal باشد.

**رفع:**

```text
LocalSettlementAdapter
  → Core fin_accounts cash account
  → fin_journal_lines
```

فقط یک cash truth وجود دارد. Local edition می‌تواند account اختصاصی داشته باشد اما ledger مستقل feature-owned نسازد.

**Done:** هیچ متن/جدول/نمونه‌ای local cash balance را SoT دوم معرفی نکند.

**تست/کنترل:** یک scenario مشابه Loan-only و Crypto-only که پس از rebuild مقدار cash journal و local projection دقیقاً یکی باشد.

---

## P0-FIX-002 — اصلاح تعریف acc_transactions

**محل:** `docs/core/db/01-schema-tables.md` و هر سندی که آن را `cash ledger` می‌نامد.

**رفع:** `acc_transactions` فقط bank/account event log یا projection linked باشد؛ مانده از journal محاسبه شود.

**ممنوع:**

```text
SUM(acc_transactions) + SUM(journal)
```

برای یک pocket.

**Done:** terminology در schema، SoT matrix و Accounts docs یکسان شود.

---

## P0-FIX-003 — حذف کامل identity قدیمی Crypto از implementation prose

**محل:** `docs/features/05-Investment/01-Crypto/Investment-Crypto.md`

**موارد ممنوع در implementation جدید:**

- `WHERE assetKey = ?` برای rebuild identity
- `WHERE symbol = ?` برای reconstruction
- `symbol` به‌عنوان کلید holding
- `assetKey` به‌عنوان PK منطقی

**قرارداد نهایی:**

```text
rebuild = holdingId
       OR exchangeId + instrumentId (+ networkId)
```

`symbol` = label
`assetKey` = SYSTEM_INDEX/provider convenience
`instrumentId` = canonical identity

**Done:** تمام snippets و API examples همین قرارداد را مصرف کنند.

---

## P0-FIX-004 — قفل نهایی Crypto quantity/fee semantics

**محل:** Crypto feature doc و Cost Basis locks.

**Raw fields که باید حفظ شوند:**

```text
feePresence
 grossQuantity
 feeQuantity
 netQuantity
```

**Semantic lock:**

| feePresence | Holding effect |
|---|---|
| `none` | gross = net |
| `fee_in_quote` | gross = net |
| `fee_from_base` | net = gross - feeQuantity |
| `fee_from_received` | net = gross - feeQuantity |
| `fee_external` | gross = net؛ fee separate |

`gross` و `fee` هیچ‌وقت دور ریخته نمی‌شوند.

**Done:** فقط یک truth table و یک set of equations باقی بماند.

---

## P0-FIX-005 — economicFeeRole را قبل از cost mutation قفل کن

**Roles:**

```text
acquisition_fee_from_received
post_acquisition_network_burn
sale_fee_from_proceeds
standalone_asset_burn
```

**قاعده:** یک CanonicalFeeEvent فقط یک economic allocation دارد.

**Done:** هیچ بخش دیگری قبل از تعیین role هزینه را از pool کم نکند.

---

## P0-FIX-006 — C2C destination cost فقط از economic consideration

**محل:** Crypto C2C examples و Cost-Basis docs.

**ممنوع:**

```text
source market mark → destination historical cost
```

**الگوی نهایی:**

```text
one operationId
SELL source leg
BUY destination leg
fee legs
source released cost
explicit swap consideration
```

در `economic_trade_or_swap` مقصد cost از economic consideration/defined trade legs ساخته می‌شود؛ carry cost فقط برای internal transfer/bridge است.

**Done:** no contradictory `toTotalBase = fromTotalBase + feeBase` example when `fromTotalBase` is market value.

---

## P0-FIX-007 — totalFeesPaidBase را Derived کن

**محل:** Crypto/Stocks/Funds holdings.

**قرارداد:**

```text
totalFeesPaidBase = Σ active fee events
```

با reversal دوباره rebuild می‌شود. مقدار cumulative stored در holding SoT نیست.

**Done:** holding API هیچ `setTotalFeesPaidBase()` مستقلی نداشته باشد؛ rebuild آن را بسازد.

---

## P0-FIX-008 — Period Return bridge فقط یک نسخه

**محل:** `Essential-Reports.md` § Period / Wealth bridges (Financial-Invariants دیگر host این فرمول نیست).

**نسخه معتبر:**

```text
Wealth = Opening Wealth
       + External Flows
       + Investment Return
       + Cash FX Translation
       + Liability FX Translation
       + Other Policy Effects

Investment Return = Realized
                  + Unrealized
                  + Recognized Income
                  - Recognized Investment Expense
```

Asset-price/FX attribution child detail است، نه additive peer.

**Done:** mixed legacy bridge حذف یا صریحاً LEGACY/SUPERSEDED شود.

---

## P0-FIX-009 — Funds standalone/accountId contradiction

**محل:** `Fixed-Income-Funds.md`

**قرارداد:**

```text
Integrated bank settlement → accountId required
Standalone/local/external → accountId nullable
```

**ETF:** brokerage route.
**Issuance/Redemption:** bank/local route.

**Done:** هیچ API/domain rule وابستگی اجباری به Accounts UI نداشته باشد.

---

## P0-FIX-010 — Canonical fund instrument identity

**محل:** `Fixed-Income-Funds.md`

`fundId` برای entity feature می‌تواند بماند، ولی investment identity باید به Core instrument registry متصل باشد:

```text
fund entity → instrumentId → ref_instruments.id
```

یا صریحاً تصمیم شود `fundId === ref_instruments.id`. دو هویت موازی مجاز نیست.

**Done:** price, holding, cost basis و reports روی identifier canonical واحد کار کنند.

---

## P0-FIX-011 — Stocks Iran از Tether hard-code جدا شود

**محل:** `Investment-Stocks-Iran.md`

**قرارداد:**

```text
transaction currency = normally IRR for Iran market
base currency = user profile baseCurrency
exchangeRateToBase = transaction currency → baseCurrency
```

Tether rate برای هر trade الزام حسابداری نیست.

**Done:** Tether فقط وقتی واقعاً بخشی از valuation/market requirement است استفاده شود.

---

## P0-FIX-012 — Brokerage cash فقط یک مسیر

**محل:** Stocks + FIF.

Cash effect مشترک:

```text
Feature
  → CashSettlementPort(route=stocks_iran_brokerage)
  → Brokerage Cash capability
  → journal
  → optional acc transaction link
```

`cashBalance` فقط projection.

**Done:** FIF مستقیماً `cashBalance` را mutation نکند.

---

## P0-FIX-013 — Stocks brokerage accountId nullable در schema

**قاعده:** bank-integrated command می‌تواند `accountId` را required کند؛ schema عمومی Feature نباید bank FK را شرط universal correctness کند.

**Done:** standalone stock/brokerage scenario بدون Accounts UI قابل اجرا باشد.

---

## P0-FIX-014 — Corporate Action ownership

**Owner:** `Corporate-Action-Engine`

**Iran market policy owner:** calendar/session/T+2/lot/tick/market rules

**Feature owner:** required fields + API boundary

**Done:** فرمول quantity/cost CA در چند فایل کپی نشود.

---

## P0-FIX-015 — Golden fixture pack را کامل کن

حداقل خانواده‌ها:

```text
Toman input
Transfer fee
Economic C2C
BTC/USDT/IRR P&L
Crypto BUY fee_in_quote
Crypto BUY fee_from_base
Crypto SELL + fee
Bridge fee
Stock buy/sell fee breakdown
Stock corporate actions
Stock T+2
Fund NAV vs transactionPrice
Fund dividend/reinvest
Loan declining balance
Loan flat
Loan qarz
Loan bullet
Loan variable rate
Loan multi-currency repayment
Opening balance
Reversal before/after
```

هر fixture:

```json
{
  "id": "...",
  "engineVersions": {},
  "input": {},
  "expected": {
    "domain": {},
    "journal": [],
    "cash": {},
    "holding": {},
    "costBasis": {},
    "realizedPnl": {},
    "unrealizedPnl": {},
    "attribution": {},
    "wealthDelta": {}
  }
}
```

همه اعداد = strings.

**Gate:** هیچ P0 Feature قبل از green شدن fixture family خودش implementation نشود.

---

## P0-FIX-016 — Schema Freeze واقعی

قبل از coding Feature، برای هر table مشخص شود:

```text
table
column
sql type
nullable
FK
unique
index
check (structural only)
field kind
owner
SoT
precision
migration
```

به‌خصوص:

- `instrumentId`
- `operationId`
- `accountId`
- `accountTransactionId`
- `relatedCorporateActionId`
- `finAccountId`
- `sourceType/sourceReference`
- fee fields
- date fields
- provenance fields

**Done:** schema drift test داشته باشیم.

---

## P0-FIX-017 — Immutable financial rows

Schema/API must prevent direct mutation of:

```text
amount
quantity
fee
financial dates
financial account
instrument identity
journal debit/credit
```

Correction = reversal + new operation.

Metadata-only amendment باید audit شود.

---

## P0-FIX-018 — Historical context کامل

Every historical report:

```text
valuationAsOf
priceAsOf
fxAsOf
cashAsOf
liabilityAsOf
baseCurrency
valuationMode
cashScope
liabilityScope
engineVersions
staleStatus
```

No mixing latest price with historical cash.

---

## P0-FIX-019 — Multi-hop FX deterministic

Persist:

```text
conversionPath
sourcePriorityRank
asOf
source
```

Selection order:

```text
applicability
→ sourcePriorityRank
→ observationTime
→ sourceId/providerId
→ stable observation id
```

**Done:** same dataset + same context = same output.

---

## P0-FIX-020 — Reconcile ≠ Repair

```text
reconcile = detect/report only
repair = explicit user command + audit + rebuild
```

No silent mutation of snapshots.

---

# 3. P1 — بعد از P0 و قبل از انتشار v1

## P1-FIX-001 — Data Dictionary completeness

Every persisted field in every Feature gets exactly one dictionary record:

```text
Kind
Owner
Currency semantics
Precision
SoT
Editable
Migration
FK
Index/Unique
```

**Acceptance:** script/checklist proves zero undocumented persisted financial fields.

## P1-FIX-002 — Field Kind enum واحد

Only:

```text
RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX
```

No second synonym such as `INDEX`.

## P1-FIX-003 — API envelope واحد

```text
apiVersion
schemaVersion
data
operationId?
engineVersions?
```

Financial errors use centralized taxonomy.

## P1-FIX-004 — List/query contract واحد

```text
cursor
offset
limit
sort
filters
asOf
```

Queries do not write DB.

## P1-FIX-005 — Provenance everywhere needed

Financial domain rows preserve:

```text
sourceType
sourceReference
sourceDocumentId?
importBatchId?
sourceTransactionId?
```

Imported facts must remain traceable.

## P1-FIX-006 — Banking identifier normalization

Before uniqueness/store:

- Persian/Arabic digits → ASCII
- strip spaces/hyphens/zero-width chars
- IBAN uppercase + no spaces
- preserve meaningful leading zeros

## P1-FIX-007 — Backup integrity

Backup manifest must contain checksum, schemaVersion, databaseId, engineVersions and attachment checksums. Restore verifies before swap.

## P1-FIX-008 — Standalone fixtures

At minimum:

```text
STANDALONE-CRYPTO
STANDALONE-LOAN
STANDALONE-FUND
STANDALONE-STOCKS
STANDALONE-METALS
```

Each must work without Accounts UI.

## P1-FIX-009 — Relationship matrix complete

Relationship matrix must enumerate actual:

```text
FK
cardinality
nullable
owner
write path
```

for all cross-table relationships, not only conceptual clusters.

---

# 4. P2 — بعد از v1 / کیفیت و نگهداری

- Generate ER/dependency diagrams from relationship matrix.
- Consolidate duplicate concept docs.
- Improve API error messages/localization.
- Add architecture lint (`no-restricted-imports`) when Feature source exists.
- Add DB/schema drift test.
- Add mutation-path architecture tests.
- Add import dedup and unknown-field envelope tests.
- Add performance indexes after actual query plans exist.
- Add optional session logs and advanced analytics only when justified.

---

# 5. ترتیب اجرای پیشنهادی

```text
STEP 01  Canonical document cleanup
STEP 02  Cash SoT / Settlement Port
STEP 03  Instrument identity
STEP 04  Crypto fee + C2C + transfer semantics
STEP 05  Stocks Iran identity + T+2 + CA + fees
STEP 06  Funds identity + NAV + settlement
STEP 07  Loan terms/schedule/accrual
STEP 08  Data Dictionary completion
STEP 09  Relationship Matrix completion
STEP 10  Schema Freeze
STEP 11  Golden Fixture Pack
STEP 12  Reversal/Idempotency/Offline scenarios
STEP 13  Architecture enforcement
STEP 14  Feature coding
```

---

# 6. Definition of Done برای Specification Freeze

همه موارد زیر باید **GREEN** یا صریحاً `EXPLICITLY_OUT_OF_SCOPE` باشند:

- [ ] یک cash SoT
- [ ] یک instrument identity
- [ ] یک field-kind enum
- [ ] یک fee vocabulary
- [ ] یک C2C policy
- [ ] یک transfer-cost policy
- [ ] یک period-return bridge
- [ ] یک settlement route per venue
- [ ] یک date semantics contract
- [ ] یک FX selection policy
- [ ] یک price selection policy
- [ ] یک reversal contract
- [ ] یک idempotency contract
- [ ] یک provenance contract
- [ ] یک schema freeze
- [ ] golden fixtures سبز برای scope v1
- [ ] standalone fixtures سبز برای scope v1
- [ ] relationship matrix کامل
- [ ] no undocumented financial field

**قانون:** وجود checklist بدون acceptance evidence = GREEN محسوب نمی‌شود.

---

# 7. فهرست حذف / ادغام اسناد

## حذف قطعی/کم‌ریسک

این دسته فقط وقتی حذف شود که هیچ reference زنده‌ای باقی نمانده باشد:

- historical archive notes که محتوای منحصربه‌فرد ندارند
- فایل‌های batch/audit قدیمی که خودشان superseded اعلام شده‌اند
- duplicate full-body docs

## Pointer-only

این‌ها می‌توانند باقی بمانند، ولی body مستقل نداشته باشند:

```text
NAMING-GLOSSARY.md
core/rounding/Rounding-Policy.md
```

## نامزد ادغام

P0های شماره‌گذاری‌شده متعدد را به مفهوم‌های canonical زیر consolidate کن:

```text
Financial Invariants
Cash
Money/Decimal/Rounding
Identity
Cost Basis & Fees
Valuation & FX
Loan Engine
Stocks Iran Policy
Funds Policy
Feature/API Architecture
Persistence/Schema
Fixtures/Acceptance
```

شماره P0 نباید خودش authority مستقل باشد؛ authority = canonical concept document + explicit lock section.

## ممنوع برای حذف

تا پایان Schema Freeze این دسته‌ها حذف نشوند:

- Data Dictionary
- Field-Level Ownership
- Source-of-Truth Matrix
- Domain Dependency Matrix
- Feature API Contract
- Feature Independence Contract
- Cash Settlement Adapter
- Canonical Cash Model
- Instrument Identity
- Canonical Financial Requirements
- Coding Gate
- Golden fixtures
- Feature main docs

---

# 8. اصول Product / UX که هنگام coding باید حفظ شوند

**حدود ناوبری:** حدود ۹ صفحه اصلی کافی است.

```text
Dashboard
Accounts
Transactions
Investments
Loans
Assets
Planning
Reports
Settings
```

Crypto / Stocks / Funds / Metals = tab/sheet داخل Investments، نه navigation item مستقل.

Income / Expense / Tax / Bills / Cheques = domain feature مستقل پشت یک UX ساده، نه الزاماً صفحه navigation جدا.

Accounting Core باید وجود داشته باشد ولی Accounting UI اختیاری باشد.

Standalone Loan / Crypto / Fund / Stock / Metal باید از نظر عملیات دامنه بدون UI Accounts کار کند.

---

# 9. تعریف معماری نهایی

```text
                    UI
                     │
              Feature Public API
                     │
              Application Layer
                     │
          ┌──────────┴──────────┐
          │                     │
    Domain Subledger       Accounting Core
          │                     │
          └──────────┬──────────┘
                     │
          CashSettlementPort
             /               \
 AccountsCashAdapter     LocalSettlementAdapter
             │               │
             └──────┬────────┘
                    │
              fin_accounts
             + fin_journal_lines
                    │
                 SQLite
```

Feature مستقل است؛ Cash/Accounting truth مستقل و مرکزی است؛ Projectionها disposable هستند.

---

# 10. قانون شروع Coding

تا وقتی:

```text
P0 = GREEN
Schema Freeze = GREEN
Scoped Golden Fixtures = GREEN
Standalone Fixtures = GREEN
Relationship Matrix = GREEN
```

**Feature implementation جدید شروع نشود.**

بعد از آن ترتیب اجرای اصلی:

```text
Core Money/Decimal
→ Core Operation + Idempotency
→ Journal/Cash
→ Reversal
→ Cost Basis
→ Reconciliation
→ Accounts
→ Income/Expense
→ Loans
→ Investments
→ Reports/UI
```

---

# 11. معیار موفقیت پروژه

در پایان v1 باید یک developer جدید بتواند بدون حدس زدن پاسخ این پرسش‌ها را پیدا کند:

1. «این فیلد مال کدام سیستم است؟»
2. «این عدد از کجا آمده؟»
3. «آیا این مقدار RAW است یا DERIVED؟»
4. «اگر تراکنش اشتباه بود، چگونه اصلاح می‌شود؟»
5. «اگر اینترنت نبود چه اتفاقی می‌افتد؟»
6. «اگر فقط Loan نصب باشد، Accounts لازم است؟»
7. «اگر USDT-TRC20 و ERC20 هر دو موجود باشند، آیا اشتباه merge می‌شوند؟»
8. «اگر stock symbol عوض شود، history چه می‌شود؟»
9. «اگر fund NAV با transaction price متفاوت باشد، کدام برای cost است؟»
10. «اگر fee از خود asset کسر شود، gross/net/fee چگونه ثبت می‌شوند؟»
11. «چگونه cash را بدون double-count گزارش کنیم؟»
12. «چگونه یک گزارش تاریخی را عیناً بازتولید کنیم؟»

اگر هر کدام پاسخ واحد و مستند نداشته باشد، SPEC هنوز freeze نشده است.

---

## References

- `docs/core/FINAL-THINK-TANK-AUDIT-2026-09-03.md`
- `docs/core/CODING-GATE.md`
- `docs/core/CANONICAL-FINANCIAL-REQUIREMENTS.md`
- `docs/core/Source-of-Truth-Matrix.md`
- `docs/core/Field-Level-Data-Ownership-Matrix.md`
- `docs/core/Feature-API-Contract.md`
- `docs/core/Feature-Independence-Contract.md`
- `docs/core/Cash-Settlement-Adapter.md`
- `docs/core/Canonical-Cash-Model.md`
- `docs/core/Instrument-Identity.md`
- `docs/core/Data-Model-Relationship-Matrix.md`
- `docs/core/fixtures/GOLDEN-GATE.md`
- Feature docs for Crypto / Stocks Iran / Funds / Loan
