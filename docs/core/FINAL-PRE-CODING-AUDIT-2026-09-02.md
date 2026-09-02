# Final Pre-Coding Audit — Personal-FI

**تاریخ:** 2026-09-02  
**Scope:** کل وضعیت فعلی `main` — قراردادهای Core، accounting، valuation، cost basis، FX، cash، feature locks، IA/performance، fixtures، schema documentation، migration/preservation و مرزهای Feature/API.  
**هدف:** تعیین اینکه Specification واقعاً آماده‌ی ورود به Coding هست یا نه؛ با تمرکز ویژه بر خطاهایی که در داده‌های چندارزی، P&L، cost basis، cash، reversal و rebuild می‌توانند خروجی مالی غلط تولید کنند.

> **نتیجه کلیدی:** معماری کلی و سطح قراردادها نسبت به نسخه‌های قبلی جهش بزرگی کرده است؛ اما این repository هنوز به معنای فنی «SPEC FROZEN / CODE READY» نیست. چند تضاد واقعی، چند قرارداد ناقص و مهم‌تر از همه نبودن fixtureهای عددیِ اجرایی برای بخش عمده سناریوهای حیاتی باقی مانده است. Coding فقط پس از بستن موارد P0 این سند توصیه می‌شود.

---

## 0. Executive Decision

### وضعیت نهایی

**STATUS: NOT YET READY FOR CODING — نزدیک به Freeze، ولی هنوز چند قفل P0/P1 باید بسته شود.**

### چرا؟

چهار محور هنوز می‌توانند باعث divergent implementation شوند:

1. **Cash ownership / SoT:** یک سند می‌گوید همه cash از `fin_accounts + fin_journal_lines` می‌آید، ولی همان سند در بخش P0-091 برای venue cash یک SoT دیگر مطرح می‌کند.
2. **Identity:** `instrumentId` به‌صورت سراسری canonical شده، ولی `Cost-Basis-Engine` هنوز در mapping جدول Feature از `identity=assetKey` نام می‌برد.
3. **FX / P&L attribution:** اصل attribution مشخص است، ولی الگوریتم کامل و deterministic برای سناریوهای چندمرحله‌ای، realized multi-currency، چند معامله و چند hop هنوز به اندازه‌ای formal نشده که دو developer مجبور به یک نتیجه یکسان شوند.
4. **Golden fixtures:** inventory کامل‌تر شده، اما بیشتر آن هنوز inventory است، نه fixture عددی با expected domain/journal/cash/holding/P&L. در حال حاضر یک golden crypto fixture مشخص و قابل استناد وجود دارد؛ کل acceptance gate هنوز سبز نیست.

---

# 1. Critical P0 Findings

## P0-FINAL-001 — Cash SoT contradiction

### Evidence
`Canonical-Cash-Model.md` در بخش اصلی صریحاً `fin_accounts + fin_journal_lines` را تنها SoT می‌داند، اما بخش `P0-091 — Ownership split` می‌گوید venue cash می‌تواند SoT جداگانه در venue feature ledger/journal داشته باشد.

### Why dangerous
در implementation ممکن است برای exchange/broker دو مدل ساخته شود:

```text
Model A:
fin_accounts → journal → balance

Model B:
broker/exchange cash ledger → balance
```

و در نهایت دو عدد متفاوت برای یک پول واحد تولید شود.

### Required fix
فقط یکی از این دو قرارداد باید باقی بماند. پیشنهاد نهایی:

```text
ONE canonical cash identity:
fin_accounts + fin_journal_lines

Feature cash tables:
projection / metadata / integration view only
```

برای venue cash فقط `finAccountId` و metadata نگه داشته شود.

اگر domain-specific cash ledger برای reconcile لازم است، صریحاً نوشته شود که **event source** است و ledger canonical cash همچنان Core Journal است؛ نه یک balance SoT مستقل.

### Acceptance
برای یک حساب exchange، دو خرید و یک برداشت، rebuild از هر مسیر باید دقیقاً همان cash balance را تولید کند.

---

## P0-FINAL-002 — CostBasisEngine identity contradiction

`Instrument-Identity.md` و Crypto locks صریحاً می‌گویند:

```text
Canonical identity = ref_instruments.id
```

اما در جدول mapping داخل `Cost-Basis-Engine.md` هنوز عبارت `identity=assetKey` دیده می‌شود.

### Required fix
در CostBasisEvent و تمام mappingها:

```text
instrumentId = canonical identity
assetKey = provider/index/search convenience only
```

هیچ API، rebuild یا grouping نباید `assetKey` را primary identity تلقی کند.

### Acceptance
دو instrument جدا با symbol یکسان یا assetKey مشابه باید بدون collision کار کنند.

---

## P0-FINAL-003 — Fee presence semantics still need one canonical vocabulary

در اسناد، مفاهیمی مثل:

```text
fee_from_received
fee_from_base_asset
fee_in_quote
fee_external
```

همزمان با `grossQuantity / netQuantity / feeQuantity` استفاده شده‌اند؛ اما در بعضی بخش‌ها «base asset» همان asset دریافت‌شده است و در بعضی بخش‌ها «base» می‌تواند معنای trade base در برابر quote داشته باشد.

### Risk
یک developer ممکن است در BUY:

```text
net = gross - fee
```

پیاده کند و دیگری:

```text
net = gross
fee = separate asset movement
```

هر دو از متن فعلی قابل برداشت‌اند.

### Required fix
مدل canonical را به دو مفهوم مستقل بشکنید:

```text
feeFundingAsset
feeFundingLocation
feeIncludedInReceivedQuantity
```

و enum canonical مثلاً:

```text
same_asset_from_received
same_asset_from_separate_balance
quote_asset
third_asset
external
```

سپس فقط با truth table مشخص کنید که holding delta، cash delta و fee effect چیست.

### Acceptance
برای BUY با 1 BTC و fee = 0.001 BTC، نتیجه دقیق holding، cash، fee و cost basis باید در fixture مشخص شود.

---

## P0-FINAL-004 — Fee burn accounting is not mathematically closed

برای network fee / same-asset burn، docs مشخص کرده‌اند:

```text
gross = net + fee
```

ولی treatment نهایی cost/P&L در حالت‌های مختلف هنوز به یک policy ثابت و عددی نرسیده است.

به‌ویژه این سؤال باید بدون ابهام پاسخ داشته باشد:

> اگر 0.001 BTC به‌عنوان fee سوزانده شد، آیا این fee در لحظه burn با fair value شناسایی می‌شود؟ به cost basis می‌افزاید؟ به expense می‌رود؟ یا فقط quantity را کم می‌کند؟

### Required fix
برای هر `accountingTreatment` یک فرمول و journal mapping عددی بنویسید.

حداقل:

```text
fee quantity effect
fee cost-base effect
fee P&L effect
fee journal effect
fee wealth effect
```

### Acceptance
یک fixture با fee burn در زمانی که BTC = X USD/USDT و FX = Y IRR/USDT باید exact answer داشته باشد.

---

## P0-FINAL-005 — Multi-currency P&L attribution needs a fully deterministic algorithm

Golden Crypto scenario اصل مسئله را درست تشخیص داده است:

```text
BTC ↓ in USDT
USDT ↑ in IRR
→ Base P&L can still be positive
```

اما attribution در حالت‌های پیچیده‌تر هنوز به سطح «algorithmic contract» نرسیده است.

### Missing definition
برای چند acquisition/disposal، realized + unrealized، چند quote، چند FX path، fee و external cash flow باید مشخص شود:

1. attribution anchor چیست؟
2. اثر price قبل از FX یا FX قبل از price محاسبه می‌شود؟
3. وقتی transaction currency در طول زمان عوض می‌شود چه می‌شود؟
4. وقتی بخشی از position فروخته می‌شود، FX attribution آن realized lot چگونه محاسبه می‌شود؟
5. در multi-hop FX، effect به currency pairها چگونه شکسته می‌شود؟

### Required fix
یک قرارداد رسمی مثل:

```text
P&L Attribution Algorithm v1
```

با مراحل ثابت و formula برای:

```text
trade-level realized
position-level unrealized
asset-price effect
FX effect
fee effect
external-flow effect
```

### Important
Attribution decomposition از نظر ریاضی می‌تواند چندراهی باشد. پروژه باید **یک convention انتخاب کند** و همان را در همه گزارش‌ها حفظ کند.

---

## P0-FINAL-006 — FX conversion path is named but not fully specified

وجود `exchangeRateToBase + asOf + path` بسیار خوب است، ولی برای implementation کافی نیست.

### Must define
برای هر rate:

```text
fromCurrency
→ toCurrency
rateDirection
quoteConvention
asOf
source
sourcePriority
validFrom/validTo یا observation time
path[]
intermediate currencies
inversion rule
composition rule
rounding rule
```

مثلاً:

```text
EUR → USD → IRR
```

باید deterministic و قابل audit باشد.

### Acceptance
اگر direct EUR/IRR وجود ندارد، دو developer با یک snapshot FX باید دقیقاً یک rate به دست آورند.

---

## P0-FINAL-007 — Historical valuation missing explicit no-price policy

`ValuationContext` خوب است، اما هنوز باید دقیقاً بگوید اگر برای `priceAsOf` قیمت موجود نبود چه می‌کنیم.

گزینه‌ها:

```text
FAIL
LAST_KNOWN_BEFORE_ASOF
MANUAL
INTERPOLATE (معمولاً برای مالی توصیه نمی‌شود)
```

و این policy باید برای هر asset class قابل تعیین باشد.

### Risk
یک گزارش تاریخی بدون price ممکن است در یک implementation صفر نمایش دهد و در دیگری آخرین قیمت امروز را بردارد.

### Required fix
`PriceSelectionPolicy v1` را lock کنید.

---

## P0-FINAL-008 — Historical FX no-observation policy is missing

مشابه قیمت، اگر FX برای تاریخی که report می‌خواهد موجود نباشد:

```text
latest previous?
nearest?
market close?
manual?
fail?
```

باید قرارداد واحد وجود داشته باشد.

برای ایران نیز مسیرهایی مثل USD→IRR ممکن است source/quality متفاوت داشته باشند؛ source precedence باید مستقل و نسخه‌دار باشد.

---

## P0-FINAL-009 — Settlement T+n is not fully represented in Accounting Core

Stocks lock به‌درستی tradeDate و settlementDate را جدا می‌کند؛ اما برای implementation نیاز به حساب‌های pending نیز وجود دارد.

نمونه خرید سهم:

```text
Trade date:
Position ↑
Cash available ?

Settlement date:
Broker payable ↓
Cash ↓
```

### Required fix
دقیقاً مشخص شود در بین trade و settlement:

- Net Worth چگونه است؟
- available cash چگونه است؟
- committed cash چیست؟
- journal accountهای pending چیستند؟
- اگر settlement failure رخ دهد چه operation/reversal داریم؟

---

## P0-FINAL-010 — Dividend journal flow is under-specified

`grossDividend`, `withholdingTaxAmount`, `netCash` درست شده‌اند، ولی journal graph باید یک قرارداد ثابت داشته باشد.

حداقل مشخص شود:

```text
Dividend income recognition
Withholding tax recognition
Receivable / brokerage balance
Net cash settlement
```

و این‌که gross income در چه تاریخی شناخته می‌شود و cash در چه تاریخی وارد می‌شود.

---

## P0-FINAL-011 — Corporate Action accounting still needs numeric golden vectors

Locks انواع CA را پوشش می‌دهند:

```text
bonus
split
reverse split
capital increase
rights
cash-in-lieu
```

اما تعریف semantic بدون fixture عددی برای حالت‌های ترکیبی کافی نیست.

### Must have
مثلاً:

```text
100 shares
bonus 20%
→ 120
cost unchanged
average cost adjusted
```

و برای rights + cash-in-lieu باید دقیقاً مقدار entitlement، round، sale/exercise و cash را نشان دهد.

---

## P0-FINAL-012 — C2C / Swap economic policy must be explicit

اسناد انتقال cost را به destination منتقل می‌کنند، اما برای C2C swap باید یک تصمیم صریح و واحد وجود داشته باشد:

```text
source asset disposal
+
destination acquisition
```

آیا disposal در زمان swap realized P&L ایجاد می‌کند؟ اگر بله با چه قیمت/ارزش؟ اگر خیر، چرا؟ آیا این behavior فقط برای «internal exchange» است؟

### Required fix
سه نوع را از هم جدا کنید:

```text
internal transfer
same-owner bridge
economic trade/swap
```

و برای هرکدام exact realizedPnl policy بدهید.

---

## P0-FINAL-013 — External receive / gift / reward needs journal + income policy

`user_provided_cost`, `fair_value_at_receipt`, `zero_basis` در Crypto locks خوب هستند؛ ولی برای coding باید دقیقاً معلوم باشد وقتی `fair_value_at_receipt` انتخاب شد:

```text
Debit asset
Credit income ?
```

و اگر withholding/tax domain در آینده فعال شد، lineage چطور حفظ می‌شود.

### Required fix
EconomicKind matrix:

```text
airdrop
staking_reward
gift
external_transfer
opening
```

برای هرکدام:

```text
income recognition
cost basis
journal
P&L
wealth
```

---

## P0-FINAL-014 — Opening balance must never accidentally become fake purchase

اصل opening operation درست است، ولی قبل از coding باید mapping کامل آن برای همه asset classes و cash accounts وجود داشته باشد.

برای opening BTC مثلاً:

```text
quantity
book cost
original acquisition date (optional/unknown policy)
valuation at opening
```

باید مشخص باشد کدام بخش وارد cost basis می‌شود و کدام فقط opening equity است.

---

# 2. Data Model / Persistence Risks

## P0-FINAL-015 — `deletedAt` on immutable financial rows is semantically dangerous

Field-level matrix روی domain rows الگوی عمومی `deletedAt` را پیشنهاد می‌کند، در حالی که financial events باید immutable باشند و اصلاح از طریق reversal انجام شود.

### Required fix
سه دسته را جدا کنید:

```text
Master / reference row:
  soft-delete allowed

Posted financial operation:
  no delete; reverse only

Unposted draft:
  delete/cancel allowed by draft policy
```

`deletedAt` روی posted operation نباید مسیر حذف را باز کند.

---

## P0-FINAL-016 — `updatedAt` on immutable financial data needs a write policy

وجود `updatedAt` روی ledger row می‌تواند developer را به UPDATE عادی هدایت کند.

### Required fix
برای posted financial rows:

```text
financial fields immutable
provenance/audit metadata only if explicit
```

و مشخص شود آیا `updatedAt` بعد از post ثابت می‌ماند یا فقط برای metadata amendment تغییر می‌کند.

---

## P0-FINAL-017 — Field classification enum is internally inconsistent

`Field-Level-Data-Ownership-Matrix` مقادیر Kind را این‌گونه تعریف می‌کند:

```text
RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL
```

ولی در خود جدول عباراتی مثل:

```text
LABEL / INDEX
```

هم دیده می‌شود.

### Required fix
`INDEX` را یا به enum رسمی اضافه کنید یا assetKey را در همان classification استاندارد قرار دهید، مثلاً:

```text
RAW
DERIVED
SNAPSHOT
EXTERNAL_REPORTED
LABEL
SYSTEM_INDEX
```

و distinction را across all docs ثابت کنید.

---

## P0-FINAL-018 — Currency vs Instrument is correct but fee fields still mix the concepts

در بعضی docs:

```text
feeCurrency
feeAssetInstrumentId
```

هر دو وجود دارند، ولی ownership و precedence دقیقاً یکسان نیست.

### Required fix
Canonical:

```text
feeInstrumentId   // if fee is an owned asset/instrument
feeCurrency       // if fee is currency cash
```

و rule for mutually exclusive / simultaneous presence مشخص شود.

---

## P0-FINAL-019 — Holding uniqueness needs one exact rule

`Instrument-Identity.md` دو unique pattern مطرح می‌کند:

```text
UNIQUE(exchangeId, instrumentId)
UNIQUE(exchangeId, networkId, instrumentId)
```

این‌ها را نمی‌توان در همه schemaها همزمان و بدون condition به یک معنی اجرا کرد.

### Required fix
exact holding scopes تعریف شود:

```text
off-chain venue holding:
(exchangeId, instrumentId)

on-chain wallet holding:
(exchangeId, networkId, instrumentId)
```

و یک rule برای `networkId IS NULL` یا نوع location داشته باشید.

---

## P0-FINAL-020 — `acc_transactions` vs journal needs a strict anti-duplication contract

بعضی Feature docs هنوز زبان «ثبت acc_transactions + domain transaction» را دارند. در حالی که Core می‌گوید journal SoT است.

### Required fix
برای هر operation مشخص شود:

```text
acc_transactions = bank UX/projection/event view
journal = accounting SoT
```

اگر `acc_transactions` خودش event/raw SoT است، باید domain ownership آن صریحاً تعریف شود و هرگز دوباره همان cash movement از آن به‌عنوان independent accounting source شمرده نشود.

---

# 3. Cost Basis Deep Review

## P0-FINAL-021 — Cost pool and valuation currency are correctly separated, but costCurrency lifecycle must be locked

Docs اجازه می‌دهند:

```text
costCurrency = baseCurrency or locked holding currency
```

اما مشخص نیست آیا `costCurrency` برای یک holding بعداً قابل تغییر است یا نه.

### Required fix
پیشنهاد:

```text
costCurrency = immutable per cost-basis state
```

تغییر user setting باید از operation جدید یا explicit migration/rebuild versioned عبور کند.

---

## P0-FINAL-022 — Fee-in-cost and fee-from-proceeds need a single formal treatment equation

برای خرید:

```text
cost = gross acquisition cost + capitalized acquisition fee
```

برای فروش:

```text
realized = net proceeds - released cost
```

اما وقتی fee mixed یا third-asset است باید دقیقاً معلوم باشد allocation به disposal یا acquisition چگونه انجام می‌شود.

### Required fix
`CostBasisFeeAllocation v1` با examples for:

- fee in quote
- fee in asset
- fee in third asset
- fee from proceeds
- transfer fee

---

## P0-FINAL-023 — Transfer fee allocation formula is incomplete for mixed-location state

`gross = net + fee` درست است، اما برای انتقال بین دو holding با cost poolهای جدا، باید دقیقاً مشخص شود:

```text
source carrying cost released
fee carrying amount
destination transferred cost
```

و آیا fee خودش P&L است یا فقط cost reallocation.

---

# 4. Reports / Performance

## P0-FINAL-024 — FI-010 bridge is conceptual, not an executable formula

بخش fixed-income return bridge ارزشمند است، اما برای implementation کافی نیست.

باید بین این‌ها انتخاب شود:

```text
Simple return
TWR
MWR/XIRR
```

و اگر چند مدل ارائه می‌شود، each must have exact inputs and formula.

### Required fix
برای v1 حتی اگر فقط one metric باشد، exact definition lock شود.

---

## P0-FINAL-025 — Wealth Delta vs P&L needs a complete bridge for cash FX

Global contracts درست می‌گویند external flows P&L نیستند. اما سناریویی مثل:

```text
100m IRR cash
IRR depreciates vs USD
no trade
```

باید مشخص کند آیا این change در Wealth Delta است، FX return است، یا فقط currency translation effect.

### Required fix
Cash FX attribution matrix برای:

```text
cash balances
foreign asset balances
liabilities
```

---

## P0-FINAL-026 — Snapshot watermark requires one canonical watermark definition

`sourceWatermark / lastOperationId` وجود دارد، ولی اگر price/FX data نیز جزء rebuild dependency باشد، فقط `lastOperationId` کافی نیست.

### Required fix
snapshot metadata باید در صورت نیاز چیزی شبیه این داشته باشد:

```text
ledgerWatermark
priceDatasetVersion / asOf
fxDatasetVersion / asOf
engineVersions
calculationContextHash
```

تا یک report واقعاً reproducible باشد.

---

# 5. Loan Deep Review

## P0-FINAL-027 — Schedule vs accrual events must be separated explicitly

Schedule snapshot و loan transactions تعریف شده‌اند؛ اما باید معلوم باشد interest:

```text
only schedule projection
or actual accrual event
```

و چه زمانی وارد liability/receivable می‌شود.

### Required fix
سه concept را جدا کنید:

```text
scheduled amount
accrued amount
settled amount
```

---

## P0-FINAL-028 — Variable-rate loan needs a deterministic interval test vector

LN-001 خوب است، ولی یک fixture واقعی لازم است که rate وسط بازه تغییر کند.

مثال:

```text
Jan 1–15 = 4%
Jan 15–Feb 1 = 5%
```

exact accrued interest must be shown.

---

## P0-FINAL-029 — Multi-currency loan FX gain/loss needs account mapping

LN-008 فقط اصل را می‌گوید. در coding باید مشخص شود:

```text
contract principal
settlement amount
book carrying amount
FX gain/loss
```

به کدام journal accounts می‌روند.

---

# 6. Feature Consistency Findings

## P1-FINAL-030 — Lock files are authoritative, but old Feature prose remains a maintenance hazard

در چند Feature صریحاً نوشته شده «در تعارض با prose قدیمی، LOCK برنده است». این برای transition خوب است، اما برای coding طولانی‌مدت ایده‌آل نیست.

### Required fix before code
هر Feature فقط یک authority chain داشته باشد:

```text
Feature README
→ LOCKS
→ Main Spec
→ Core references
```

Prose مرده یا مثال‌های contradictory باید marked as legacy یا حذف شوند.

---

## P1-FINAL-031 — Duplicate documentation authority names

Tree فعلی نام‌های بسیار نزدیک/تکراری دارد؛ نمونه:

```text
NAMING-GLOSSARY.md
Naming-Glossary.md
```

و:

```text
Rounding-Policy.md
rounding/Rounding-Policy.md
```

### Risk
Developer دو سند را باز می‌کند و نمی‌داند کدام authority است.

### Required fix
برای هر concept exactly one canonical file داشته باشید و بقیه را:

```text
legacy pointer
```

قرار دهید.

---

## P1-FINAL-032 — `spec.md` feature stubs need a precise purpose

چند Feature `spec.md` بسیار کوچک در کنار main specهای بسیار بزرگ دارند.

قبل از coding باید مشخص شود:

```text
spec.md = canonical short implementation entrypoint?
یا
spec.md = compatibility stub?
```

در غیر این صورت developer ممکن است فایل کوتاه را به‌عنوان authority بخواند.

---

# 7. Fixture Gate — بزرگ‌ترین فاصله تا واقعی شدن Specification

## P0-FINAL-033 — Inventory ≠ implemented golden fixture pack

`P1-IRAN-PERFORMANCE-FIXTURES-ACCEPTANCE.md` inventory کامل‌تری برای Core/Crypto/Stocks/Funds/Metals/Loan ساخته، ولی بیشتر موارد هنوز فقط names/scenarios هستند.

### Current state
حداقل یک fixture کامل Crypto برای BTC/USDT/IRR وجود دارد؛ باقی حوزه‌ها به طور عمده هنوز باید به fixtureهای عددی واقعی تبدیل شوند.

### Required before implementation release
برای هر fixture:

```json
{
  "id": "...",
  "engineVersions": {...},
  "input": {...},
  "expected": {
    "domain": {...},
    "journal": [...],
    "cash": {...},
    "holding": {...},
    "costBasis": {...},
    "realizedPnl": {...},
    "unrealizedPnl": {...},
    "attribution": {...},
    "wealthDelta": {...}
  }
}
```

همه financial numbers = string.

---

## P0-FINAL-034 — Fixture set needs negative / failure cases

فقط happy path کافی نیست.

حداقل failure vectors:

```text
negative cash
negative quantity
wrong FX direction
missing price
missing historical FX
duplicate operationId
reversed operation reversed again
invalid instrumentId
cross-currency fee without rate
settlement out of order
```

باید expected typed error داشته باشند.

---

## P0-FINAL-035 — Reversal needs exact before/after fixture pairs

برای هر financial operation یک fixture باید نشان دهد:

```text
before
post
reverse
after reverse
```

و:

```text
after reverse == before
```

برای realized P&L، fee metrics، holdings، cash و journal.

---

# 8. API / Engineering Contract Gaps

## P1-FINAL-036 — Serializable result contract needs explicit schema versions

Global API contract decimal strings را قفل کرده، ولی برای future migrations بهتر است هر command/query result contract دارای:

```text
apiVersion
schemaVersion
engineVersions (where calculation result)
```

باشد.

---

## P1-FINAL-037 — Error taxonomy needs feature-independent codes and retryability

برای یک application offline-first مالی، صرف `VALIDATION_ERROR` کافی نیست.

حداقل دسته‌ها:

```text
VALIDATION_ERROR
CONFLICT
DUPLICATE_OPERATION
WRITER_REQUIRED
STALE_DATA
INSUFFICIENT_BALANCE
MISSING_RATE
MISSING_PRICE
CURRENCY_MISMATCH
REVERSAL_NOT_ALLOWED
DEPENDENCY_BLOCKED
INTEGRITY_VIOLATION
PERSISTENCE_FAILURE
```

و برای هر error:

```text
retryable: boolean
userActionRequired: boolean
```

---

## P1-FINAL-038 — Idempotency semantics need persistence boundaries

`operationId` به‌عنوان idempotency key تصمیم خوبی است، اما باید دقیقاً مشخص شود:

```text
when command received
when durable idempotency record written
what happens after crash before commit
what happens after commit before UI response
```

### Acceptance
Retry بعد از crash نباید duplicate financial operation بسازد.

---

# 9. Import / Export / Migration

## P0-FINAL-039 — Unknown-field preservation needs a concrete envelope

اصل preservation درست است، اما برای coding باید معلوم باشد فیلدهای ناشناخته کجا می‌روند.

پیشنهاد:

```text
unknownFieldsJson
sourceSchemaVersion
sourceProvider
rawRecordHash
```

و این data باید در round-trip دوباره export شود، بدون اینکه وارد domain calculation شود.

---

## P0-FINAL-040 — Import deduplication needs a deterministic identity hierarchy

قبل از coding باید hierarchy مشخص باشد:

```text
provider transaction id
→ txHash + logIndex
→ externalReference
→ commandHash
→ user confirmation
```

صرفاً `operationId` برای external imports کافی نیست چون provider ممکن است ID متفاوت داشته باشد.

---

# 10. Dates / Calendars / Iran

## P0-FINAL-041 — `businessDate` needs a formal day-boundary rule

وجود Jalali و Gregorian/UTC خوب است؛ اما باید قفل شود:

```text
businessDate timezone = user profile timezone
cutoff = local midnight
stored date semantics = date-only, not UTC timestamp disguised as date
```

به‌خصوص برای transactionهای نزدیک نیمه‌شب.

---

## P1-FINAL-042 — Jalali conversion belongs only at presentation/business-date boundary

نباید Jalali وارد محاسبات timestamp interval شود مگر یک business rule صریح داشته باشیم.

همه accrual timestamps باید Gregorian/UTC یا instant دقیق باشند.

---

# 11. Iran-specific Financial UX / Semantics

## P0-FINAL-043 — IRR/Toman conversion boundary needs one input contract

قفل صحیح است:

```text
DB = IRR
UI = Rial/Toman
```

اما فرم‌ها باید دقیقاً تعیین کنند که user input:

```text
display currency selected by user
```

است و conversion قبل از command انجام می‌شود.

### Acceptance
ورودی `1,000,000 Toman` باید در command به `10,000,000 IRR` normalized string تبدیل شود؛ هیچ UI component نباید خودش یک financial operation را scale کند.

---

## P1-FINAL-044 — Iranian banking identifiers need normalization rules, not only uniqueness

IBAN/Shaba و accountNumber uniqueness قفل شده، اما normalization باید شامل:

```text
Arabic/Persian digits
spaces
hyphens
prefix formatting
case where applicable
```

باشد تا duplicate false-negative ایجاد نشود.

---

# 12. Security / Privacy / Backup

## P1-FINAL-045 — Financial backup integrity must include tamper evidence

Backup schemaVersion/checksum خوب است؛ برای محصول مالی بهتر است backup manifest داشته باشد:

```text
createdAt
appVersion
schemaVersion
dataChecksum
attachmentManifest
engineVersions
```

و restore باید این manifest را verify کند.

---

# 13. Architecture / Simplicity

## P1-FINAL-046 — Many feature docs are acceptable; many runtime pathways are not

هدف «features زیاد، صفحات کم» درست است. خطر اصلی در coding این است که هر Feature یک command path، cash path و calculation path مستقل بسازد.

### Required architecture test
برای هر mutation مالی فقط:

```text
Feature Command
→ Operation Builder
→ Core engines
→ Journal/Cash
→ projection rebuild
```

وجود مسیر دوم باید architectural violation باشد.

---

## P1-FINAL-047 — Feature independence must be proven by a standalone scenario

Docs standalone ports را تعریف کرده‌اند، ولی قبل از code باید یک fixture برای:

```text
Crypto without Accounts UI
Loan without Accounts UI
Fund without Accounts UI
```

وجود داشته باشد که بعداً Accounts attach شود بدون data migration destructive.

---

# 14. Reporting Integrity

## P0-FINAL-048 — Every historical report must expose its calculation context

کاربر باید بتواند بفهمد report با چه چیزی حساب شده:

```text
asOf
priceAsOf
fxAsOf
cashCutoff
liabilityScope
valuationMode
price source/version
FX source/version
engine version
stale status
```

نه لزوماً همه در UI اصلی؛ ولی در report metadata باید موجود باشد.

---

## P0-FINAL-049 — External reported numbers must remain visibly distinct

`EXTERNAL_REPORTED` correctly defined است؛ اما report contract باید تضمین کند:

```text
calculatedProfit ≠ externalReportedProfit
```

و export نیز این دو را جدا نگه دارد.

---

# 15. Documentation Release Hygiene

## P1-FINAL-050 — Acceptance matrix checkboxes cannot remain aspirational at Freeze

`P1-GLOBAL-CONTRACTS` هنوز completion checklist دارد. قبل از SPEC Freeze واقعی، هر مورد باید either:

```text
GREEN
or
EXPLICITLY OUT OF SCOPE
```

باشد؛ نه صرفاً `[ ]` باقی بماند.

---

## P1-FINAL-051 — Product / IA count should be computed, not approximate prose

«~9 main pages» برای direction خوب است، ولی قبل از coding یک canonical table باید route/page/sheet/drawer را مشخص کند تا page budget واقعاً executable شود.

---

# 16. Final Mathematical Golden Set That Must Exist

قبل از اولین feature implementation، حداقل این 12 vector باید کامل و green باشند:

1. `CORE-INCOME`
2. `CORE-EXPENSE`
3. `CORE-TRANSFER-FEE`
4. `CORE-REVERSAL-EXACT`
5. `CORE-MULTI-CURRENCY`
6. `CRYPTO-BTC-USDT-IRR-PRICE-DOWN-FX-UP`
7. `CRYPTO-BTC-USDT-IRR-REVERSE-FX-OFFSET`
8. `CRYPTO-FEE-SAME-ASSET`
9. `CRYPTO-C2C-SWAP`
10. `STOCK-TRADE-Tn-DIVIDEND-CA`
11. `FUND-NAV-DISTRIBUTION-REINVEST`
12. `LOAN-VARIABLE-RATE-PARTIAL-PAYMENT-FX`

و هرکدام باید expected:

```text
domain
journal
cash
holding
cost basis
realized/unrealized
attribution
wealth delta
```

داشته باشند.

---

# 17. Coding Gate — Exact Order

## Gate A — Contract cleanup

اول موارد زیر بدون اضافه کردن Feature جدید بسته شوند:

```text
P0-FINAL-001
P0-FINAL-002
P0-FINAL-003
P0-FINAL-004
P0-FINAL-005
P0-FINAL-006
P0-FINAL-007
P0-FINAL-008
P0-FINAL-009
P0-FINAL-010
P0-FINAL-011
P0-FINAL-012
P0-FINAL-013
P0-FINAL-015
P0-FINAL-016
P0-FINAL-017
P0-FINAL-018
P0-FINAL-019
P0-FINAL-020
P0-FINAL-021
P0-FINAL-022
P0-FINAL-023
P0-FINAL-024
P0-FINAL-025
P0-FINAL-026
P0-FINAL-027
P0-FINAL-028
P0-FINAL-029
P0-FINAL-033
P0-FINAL-034
P0-FINAL-035
P0-FINAL-039
P0-FINAL-040
P0-FINAL-041
P0-FINAL-043
P0-FINAL-048
P0-FINAL-049
```

## Gate B — Canonical docs cleanup

- Remove/mark contradictory legacy prose.
- Pick one authority per concept.
- Resolve duplicate documentation names.
- Clarify `spec.md` role.

## Gate C — Fixture Green

All release-scope golden fixtures must be implemented in the test harness and green.

## Gate D — Schema Freeze

Exact:

```text
tables
columns
types
FKs
unique indexes
check constraints
nullable rules
indexes
migration version
```

must be explicit.

## Gate E — First Coding

Only after A–D:

```text
Core Decimal / Money / FX
→ Core Operation
→ Journal/Cash
→ Reversal
→ Cost Basis
→ Reconciliation
→ Feature 00 Accounts
→ Core simple Income/Expense
→ Investments
```

---

# 18. What Is Already Strong Enough

این audit عمداً فقط باگ‌ها را نمی‌شمارد. بخش‌هایی از طراحی فعلی در سطح خوبی قرار گرفته‌اند و نباید دوباره از صفر طراحی شوند:

- `ref_instruments.id` به‌عنوان canonical identity
- decimal strings + Decimal Engine
- IRR canonical / Toman display
- Financial Operation + operationId
- immutable financial history + Core reversal
- centralized CostBasisEngine
- explicit fee event/treatment
- ValuationContext
- historical as-of model
- cash SoT principle
- feature/API boundaries
- rebuild/reconciliation direction
- Crypto BTC/USDT/IRR attribution golden example
- stock T+n distinction
- fund NAV vs market distinction
- metals purity/fine/gross distinction
- physical asset carrying cost lineage
- loan component-level balances
- tax liability vs transaction fee separation
- offline-first transaction correctness
- page budget / contextual sheets direction

---

# 19. Final Verdict

### Architecture
**GREEN with contract cleanup.**

### Financial model
**AMBER/P0.**
Core principles are strong, but several formulas/semantic boundaries must become executable and unique.

### Multi-currency / FX
**AMBER/P0.**
This is the highest-risk mathematical area. The BTC/USDT/IRR concept is correct, but the general attribution algorithm and FX path policy must be frozen.

### Feature specs
**AMBER/P1.**
Most major feature domains have lock files, but legacy prose and authority duplication must be cleaned up.

### Fixtures
**RED for full release gate.**
Inventory is strong; implementation-ready numeric golden coverage is not yet complete.

### Coding readiness
**NOT READY YET.**

The project should now enter a **contract-freeze cleanup phase**, not another feature-expansion phase.

---

# 20. Definition of Done for SPEC Freeze

The specification can be declared **FROZEN** only when all of the following are true:

```text
[GREEN] one canonical identity rule
[GREEN] one canonical cash SoT
[GREEN] one canonical fee vocabulary
[GREEN] one canonical cost basis engine
[GREEN] one deterministic FX path algorithm
[GREEN] one deterministic historical price policy
[GREEN] one deterministic historical FX policy
[GREEN] one deterministic P&L attribution algorithm
[GREEN] one deterministic return formula
[GREEN] one exact settlement accounting model
[GREEN] one exact reversal model
[GREEN] one idempotency/recovery model
[GREEN] one field ownership matrix
[GREEN] one authority chain per document
[GREEN] all P0 golden fixtures green
[GREEN] negative/error fixtures green
[GREEN] schema constraints frozen
[GREEN] migration preservation policy frozen
[GREEN] standalone Feature fixtures green
[GREEN] report context reproducible
```

**وقتی این لیست سبز شد، دیگر طراحی را ادامه نمی‌دهیم؛ وارد کدنویسی Core می‌شویم.**

---

## Primary references inspected

- `docs/core/SPEC-FREEZE.md`
- `docs/core/P1-GLOBAL-CONTRACTS.md`
- `docs/core/P1-IRAN-PERFORMANCE-FIXTURES-ACCEPTANCE.md`
- `docs/core/Financial-Invariants.md`
- `docs/core/Cost-Basis-Engine.md`
- `docs/core/Canonical-Cash-Model.md`
- `docs/core/Accounting-Core.md`
- `docs/core/Field-Level-Data-Ownership-Matrix.md`
- `docs/core/Instrument-Identity.md`
- `docs/core/Fee-Treatment-Matrix.md`
- `docs/core/Mandatory-Test-Vectors.md`
- Crypto / Stocks / Funds / Metals / Physical / Loan / Accounts / Income / Cheque / Reports / Tax lock files
