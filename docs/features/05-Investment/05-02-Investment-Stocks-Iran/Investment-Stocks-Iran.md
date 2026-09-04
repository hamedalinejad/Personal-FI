> **Iran Market Rules (لایه مستقل):** `Iran-Market-Rules.md` — هویت، settlement، CA.

# زیر‌فیچر: Investment - Stocks Iran (سهام بورس ایران)

## توضیح کلی
این زیر‌فیچر مدیریت سرمایه‌گذاری در **بازار بورس ایران** را بر عهده دارد.
معاملات بازار ایران معمولاً **IRR** هستند. **baseCurrency** = user profile. **exchangeRateToBase** = نرخ ارز تراکنش → baseCurrency. نرخ تتر/USDT **الزام حسابداری هر trade نیست** (P0-FIX-011).

---

## Business Rules

1. تمام مبالغ به ریال هستند.
2. در هر معامله، ارز تراکنش + `exchangeRateToBase` (به base کاربر) ثبت می‌شود؛ تتر فقط در صورت نیاز valuation جدا.
3. واریز/برداشت بین حساب بانکی و کارگزاری باید در `acc_transactions` و `inv_stocks_iran_brokerage_transactions` با لینک متقابل ثبت شود.
4. خرید از **ledger/Port نقد کارگزاری** اثر می‌گذارد (cashBalance فقط projection) و به Holding اضافه می‌شود.
5. فروش از Holding کسر و خالص مبلغ از طریق **CashSettlementPort → journal** به نقد کارگزاری می‌رود (cashBalance projection).
6. **کارمزد و مالیات**:
 - `feeAmount` فیلد Total و برای سازگاری با مدل قبلی **حذف نمی‌شود**.
 - `feeBrokerCommission` = کارمزد کارگزار.
 - `feeExchange` = کارمزد/هزینه بورس و ارکان بازار.
 - `feeTax` = **مالیات/عوارض به‌عنوان هزینه معامله** (transaction cost) — نه جایگزین `tax_records` / بدهی مالیاتی دوره‌ای (قرارداد در Tax-Management.md).
 - `feeOther` = سایر هزینه‌ها و کارمزدهای قابل گزارش.
 - برای تراکنش‌های جدید: `feeAmount = sum(non-null breakdown components)` و invariant اجباری است.
 - برای داده‌های قدیمی (legacy): `feeAmount` اصلی **بدون تغییر** حفظ می‌شود؛ breakdownها **nullable** هستند. صفر کردن اجباری breakdown ممنوع است چون معنای historical را عوض می‌کند (P0-052).
 - `feeTax` فقط هزینه معامله است؛ رویداد بدهی مالیاتی جدا در Tax Feature (P0-053).
7. سود نقدی با `type = 'dividend'` ثبت می‌شود و جزو Realized P&L خرید/فروش نیست.
8. موجودی حساب بانکی (journal)، نقد کارگزاری (journal/Port) و quantity سهم نمی‌توانند منفی شوند؛ cashBalance فقط مشتق است.
9. تراکنش ثبت‌شده قابل ویرایش/حذف مستقیم نیست و اصلاح با void/reversal انجام می‌شود.
10. **Price Mapping**:
 - `symbol` فقط شناسه داخلی و قابل نمایش سیستم است.
 - `priceProviderId` به `price_sources.id` اشاره می‌کند و Provider قیمت را مشخص می‌کند.
 - `providerSymbol` شناسه دقیق همان نماد در همان Provider است.
 - `market` context بازار است و در صورت نیاز Provider ارسال می‌شود.
 - Price Fetching باید از ترکیب `priceProviderId + providerSymbol + market` استفاده کند.
 - استفاده مستقیم از `symbol` فقط fallback موقت هنگام نبود Mapping است و نباید به‌عنوان Mapping قطعی ذخیره شود.
 - Mapping ناقص باید قابل تشخیص و گزارش در UI/API باشد.
 - `price_history.sourceId` باید Provider واقعی قیمت ذخیره‌شده را حفظ کند.

---

## Domain Entities

### ۱. Brokerage — `inv_stocks_iran_brokerages`

- `id` → UUID
- `name` → string
- `accountNumber` → string nullable
- `url` → string nullable
- `description` → string
- `isActive` → boolean
- `cashBalance` → decimal ریال
- `createdAt` → datetime
- `updatedAt` → datetime

`cashBalance` یک snapshot برای محاسبات سریع است و باید با تراکنش‌های مالی هماهنگ بماند.

> **منبع حقیقت**: **Ledger** (`inv_stocks_iran_brokerage_transactions` + لینک‌های `acc_transactions`) authoritative است. `cashBalance` مشتق/کش است. در صورت اختلاف `reconcileBrokerage`: گزارش delta؛ Repair صریح فقط با تأیید کاربر snapshot را از ledger بازمی‌سازد — سیستم به‌صورت خاموش ledger را از snapshot بازنویسی نمی‌کند.

### ۲. Stock Holding — `inv_stocks_iran_holdings`

- `id` → UUID
- `brokerageId` → UUID
- `instrumentId` → UUID (**اجباری**؛ FK واقعی به `ref_instruments.id` — هویت پایدار Core؛ با تغییر نماد عوض **نمی‌شود**. ISIN در فیلد جداگانه `isin`)
- `isin` → string nullable — ISIN رسمی وقتی شناخته شده
- `symbol` → string — **نماد نمایشی فعلی** (فولاد، …)؛ با corporate action قابل تغییر است
- `name` → string
- `providerSymbol` → string nullable — شناسه نزد Provider فعلی
- `priceProviderId` → UUID nullable — FK → `price_sources.id`
- `market` → string nullable — `bourse` | `fara_bourse` | `base_market` | …
- `quantity` → decimal
- `averageBuyPrice` → decimal ریال
- `totalInvested` → decimal
- `totalFeesPaidBase` → decimal (به baseCurrency — )
- `createdAt` / `updatedAt` → datetime

> **هویت**: کلید منطقی Holding = `brokerageId + instrumentId` (نه `brokerageId + symbol`). `instrumentId` همیشه UUID و FK به `ref_instruments.id` است (نه string آزاد یا ISIN خام). 
> `symbol` / `market` / `providerSymbol` metadata قابل‌تغییرند. تاریخچه تغییر نماد در `inv_stocks_iran_symbol_history` یا event corporate action ثبت می‌شود. 
> Mapping قیمت: `priceProviderId + providerSymbol + market`؛ Provider هرگز `symbol` داخلی را هویت فرض نکند.

### ۳. Stock Transaction — `inv_stocks_iran_transactions`

- `id` → UUID
- `brokerageId` → UUID
- `instrumentId` → UUID **اجباری** — FK به `ref_instruments.id` (همان Holding؛ با symbol_change عوض نمی‌شود)
- `symbol` → string — فقط label در لحظه ثبت (audit نمایش)
- `type` → enum گسترده:
 - `buy` | `sell` | `dividend`
 - `capital_increase` — افزایش سرمایه (نقدی/از محل مطالبات)
 - `rights_issue` — تخصیص حق تقدم
 - `rights_exercise` — تبدیل/استفاده حق تقدم
 - `rights_sell` — فروش حق تقدم
 - `bonus_share` — سهام جایزه
 - `split` — تجزیه سهم
 - `reverse_split` — تجمیع سهم
 - `symbol_change` — تغییر نماد (quantity ثابت؛ metadata)
 - `isin_change` — تغییر ISIN/شناسه
 - `transfer_ca` — انتقال ناشی از corporate action بین instrumentها
 - `suspension_note` — اختیاری ثبت توقف/بازگشایی (معمولاً بدون اثر quantity)
- `quantity` → decimal nullable برای dividend
- `price` → decimal nullable برای dividend
- `totalAmount` → decimal
- `feeAmount` → decimal — Total (همیشه preserved؛ برای legacy SoT است)
- `feeBrokerCommission` → decimal **nullable** (null = unknown/legacy؛ نه zero اجباری)
- `feeExchange` → decimal **nullable**
- `feeTax` → decimal **nullable** — **فقط transaction cost** (کارمزد/عوارض معامله)؛ بدهی مالیاتی دوره‌ای از Tax Feature است
- `feeOther` → decimal **nullable**
- `feeCurrency` → string
- `exchangeRateToBase` → decimal
- `description` → string
- `date` → datetime
- `createdAt` → datetime
- **Tax (canonical):** `linkedTaxEventId` → `tax_events.id` (SoT در Tax-Management) — جدا از `feeTax`
- **Tax legacy (deprecated, read-only migrate):** `isTaxableEvent`, `costBasisAmount`, `proceedsAmount`, `realizedGainAmount`, `taxYear`, `withholdingTaxAmount`, `taxLotId`, `linkedTaxRecordId`, `taxExemptReason` — کد جدید فقط linkedTaxEventId می‌نویسد

**Invariant (P0-052 + P0-053):**

```text
# New rows (created after this contract):
feeAmount = (feeBrokerCommission ?? 0) + (feeExchange ?? 0) + (feeTax ?? 0) + (feeOther ?? 0)
# و حداقل یکی از breakdownها non-null اگر feeAmount > 0

# Legacy rows:
# feeAmount محفوظ می‌ماند حتی اگر sum(breakdown) != feeAmount یا breakdownها null باشند.
# هرگز breakdown را به 0 force نکنید تا معنای historical عوض نشود.
# Migration فقط می‌تواند breakdown را پر کند اگر منبع معتبر داشته باشد؛ در غیر این صورت null بماند.

# feeTax = transaction cost only (هزینه معامله).
# Tax liability / withholding / capital-gains tax event = Tax Feature (linkedTaxEventId یا tax_events).
# دو مفهوم نباید double-count شوند.
```

**Invariant قبلی (برای سازگاری):**

```text
feeAmount =
 feeBrokerCommission
 + feeExchange
 + feeTax
 + feeOther
```

این invariant برای تراکنش‌های جدید الزامی است. داده‌های legacy که فقط `feeAmount` دارند باید بدون تغییر باقی بمانند.

### ۴. Brokerage Cash Transaction — `inv_stocks_iran_brokerage_transactions`

- `id` → UUID
- `brokerageId` → UUID
- `type` → `deposit | withdraw`
- `amount` → decimal
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToBase` → decimal
- `accountId` → UUID **nullable** (required only for bank-integrated commands; standalone OK — P0-DOC-013)
- `accountTransactionId` → UUID
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۵. `acc_transactions`

واریز/برداشت باید با `relatedFeature = 'stocks_iran'` و `relatedId = inv_stocks_iran_brokerage_transactions.id` لینک شود.

---

## APIهای داخلی

### Brokerage
- `createBrokerage(data)`
- `updateBrokerage(id, data)`
- `getAllBrokerages`
- `getBrokerageById(id)`
- `getBrokerageCashBalance(brokerageId)`

### Holding
- `getHoldings(brokerageId?)`
- `getHoldingByInstrumentId(instrumentId, brokerageId?)` — **API اصلی**
- `getHoldingBySymbol(symbol, brokerageId?)` — **deprecated**؛ فقط resolve به instrumentId فعلی از registry سپس همان lookup
- `getPortfolioValue`
- **`reconcileStockHolding(holdingId)`** → مقایسه snapshot با **`rebuildStockHolding` کامل (شامل همه CA)** — نه فقط buy/sell

 ```typescript
 reconcileStockHolding(holdingId: UUID): ReconcileResult & {
 fields: {
 quantity: { stored: Decimal; calculated: Decimal; match: boolean }
 totalInvested: { stored: Decimal; calculated: Decimal; match: boolean }
 averageBuyPrice: { stored: Decimal; calculated: Decimal; match: boolean }
 }
 }
 ```

 **الگوریتم محاسبه** (Weighted Average از صفر — **همه typeهای پشتیبانی‌شده** از طریق `CorporateActionEngine` + `CostBasisEngine`، نه فقط buy/sell):

```text
qty = 0; totalInvested = 0
برای هر tx مرتبط با holding.instrumentId (و relatedCorporateActionId) ORDER BY businessDate, createdAt (isVoided=false):

  buy / acquisition:
    totalInvested += quantity*price + feeInTradeCurrency
    qty += quantity

  sell / disposal:
    cost = qty==0 ? 0 : quantity * (totalInvested/qty)
    totalInvested -= cost
    qty -= quantity

  bonus_share / split / reverse_split / capital_increase / rights_* / transfer_ca:
    → از طریق CorporateActionEngine.apply + CostBasisEngine (همان منطق کامل بخش «الگوریتم کامل rebuildStockHolding»)

  dividend / symbol_change / isin_change / suspension_note:
    metadata یا cash جدا — qty/totalInvested طبق جدول CA

averageBuyPrice = qty > 0 ? totalInvested / qty : 0
```

**Invariant P0-050**: هر rebuild/reconcile **باید** همه CAهای پشتیبانی‌شده را بشناسد. Snippet فقط buy/sell = باگ. مسیر واحد: `CorporateActionEngine` → domain legs → CostBasisEngine.

 **در صورت Mismatch**: ثبت در `fin_audit_log` + هشدار به کاربر + گزینه Repair (بازسازی snapshot از لاگ با تأیید کاربر).

- **`rebuildStockHolding(holdingId)`** → بازسازی کامل `quantity` / `totalInvested` / `averageBuyPrice` از لاگ تراکنش‌ها (شامل همه CA) و آپدیت atomic در `inv_stocks_iran_holdings`. مسیر اجباری از `CorporateActionEngine`.

 **زمان استفاده الزامی**: پس از هر Reversal (void) تراکنش سهام، پس از Migration، پس از Import/Restore.

### Transaction
- `createStockTransaction(data)`
- `createBrokerageTransaction(data)`
- `getStockTransactions(filters)`
- `getBrokerageTransactions(filters)`
- `calculateProfitLoss(instrumentId, brokerageId?)` — **اصلی**؛ overload با symbol فقط deprecated resolve

### Price Mapping
- `setStockPriceMapping(holdingId, data)` → `priceProviderId`, `providerSymbol`, `market`
- `getStockPriceMapping(holdingId)`
- `validateStockPriceMapping(holdingId)`

---

## قرارداد Price Fetching

برای هر Holding:

```text
1. holding.priceProviderId → price_sources.id
2. holding.providerSymbol → شناسه دقیق همان Provider
3. holding.market → در صورت نیاز Provider
4. fetch(provider, providerSymbol, market)
5. price_history.sourceId = holding.priceProviderId
```

Fallback به `symbol` فقط برای تلاش موقت مجاز است و نباید Mapping قطعی ایجاد کند.

---

## منطق Realized / Unrealized P&L

تمام محاسبات پولی باید با `decimal.js` انجام شوند و استفاده از `Number` برای محاسبات مالی مجاز نیست.

### تبدیل کارمزد (الزامی)

```text
feeInTradeCurrency = convert(feeAmount, feeCurrency → transactionCurrency)
feeInBase = convert(feeAmount, feeCurrency → baseCurrency)  // برای totalFeesPaidBase
// هرگز feeAmount خام را با price ریالی جمع نکن مگر feeCurrency == currency معامله
```

### خرید

```text
newTotalInvested = totalInvested + (quantityBought × price) + feeInTradeCurrency
newQuantity = quantity + quantityBought
newAverageBuyPrice = newTotalInvested / newQuantity
totalFeesPaidBase += feeInBase
```

### فروش

```text
soldPortionCost = quantitySold × averageBuyPrice
realizedPL = saleProceeds - soldPortionCost - feeInTradeCurrency
totalInvested -= soldPortionCost
quantity -= quantitySold
// averageBuyPrice برای باقی‌مانده بدون تغییر
```

### Unrealized

```text
unrealizedPL = (currentPrice - averageBuyPrice) × quantity
```

Realized و Unrealized نباید با یکدیگر مخلوط شوند.

---

## نکات طراحی

- این زیر‌فیچر مخصوص سهام بورس ایران است.
- ارز معامله معمولاً IRR است؛ `feeCurrency` می‌تواند متفاوت باشد — همیشه از `feeInTradeCurrency` / `feeInBase` استفاده شود.
- `feeAmount` هرگز حذف نمی‌شود.
- Breakdown کارمزد شامل کارگزار، بورس/ارکان، مالیات و سایر هزینه‌ها است.
- Mapping قیمت صریح و قابل اعتبارسنجی است.
- موجودی نقدی کارگزاری از موجودی سهام جداست.
- ساختار باید ساده، ماژولار، Offline-First و قابل استفاده توسط APIهای مستقل باقی بماند.

> **exchangeRateToBase**: همیشه نرخ ارز تراکنش → `baseCurrency` کاربر است، نه الزاماً ریال/تتر. قرارداد در `Currency-CrossRate.md`.

---

## Corporate Actions سهام ایران

بدون این رویدادها `quantity` / `averageBuyPrice` / cost basis در زمان غلط می‌شود.

### قوانین Cost Basis (خلاصه)
| رویداد | quantity | cost basis |
|--------|----------|------------|
| `bonus_share` | افزایش | totalInvested ثابت → average پایین می‌آید |
| `split` / `reverse_split` | × ratio | average بر ratio تنظیم؛ totalInvested ثابت |
| `rights_issue` | ثبت حق به‌عنوان holding جدا (`instrumentId` حق) یا quantity حقوق | هزینه حق جدا |
| `rights_exercise` | تبدیل حق → سهم؛ cost حق + پرداخت نقدی به cost سهم |
| `capital_increase` (آورده نقدی) | +shares؛ totalInvested += پرداخت |
| `symbol_change` / `isin_change` | بدون تغییر quantity/cost؛ آپدیت metadata + تاریخچه |
| `dividend` نقدی | quantity ثابت؛ cash به حساب/کارگزاری |

### الزامات
1. هر CA داخل `runAtomicFinancialOperation` + `fin_journal_entries`.
2. `instrumentId` Holding در symbol_change ثابت می‌ماند.
3. اگر CA دو instrument بسازد (حق تقدم)، holding دوم با `instrumentId` جدید و `relatedCorporateActionId`.
4. `rebuildHoldingFromLedger` باید همه typeهای CA را در Σ اعمال کند.

### جدول اختیاری `inv_stocks_iran_corporate_actions`
`id, instrumentId, actionType, ratio, cashAmount, effectiveDate, notes, operationId` — برای audit و UI.

---

## هویت پایدار Holding

```text
UNIQUE(brokerageId, instrumentId)
symbol = mutable label
isin / instrumentId = stable identity
```

تغییر نماد ≠ Holding جدید. 
Provider mapping جدا از identity است و با `setStockPriceMapping` عوض می‌شود.


---

## راهنمای پیاده‌سازی

### APIهای اصلی (Atomic + journal + persist)
- `createBrokerage` / cash deposit-withdraw ↔ `acc_transactions` (event link) + brokerage cash **projection** via CashSettlementPort → journal
- `executeBuy` / `executeSell` / `registerDividend`
- `applyCorporateAction(type, payload)` برای همه CAها
- `setStockPriceMapping(holdingId, { priceProviderId, providerSymbol, market })`
- `rebuildStockHoldingFromLedger` / `reconcileStockHolding` / `reconcileBrokerage`

### Invariants
- UNIQUE(brokerageId, instrumentId)
- feeAmount = sum of fee parts
- cashBalance snapshot؛ ledger authoritative
- CAها quantity/cost را طبق جدول CA به‌روز می‌کنند

### تست حداقل
buy/sell/dividend؛ bonus share؛ symbol_change بدون عوض شدن instrumentId؛ reconcile بعد از trade

### مثال عددی Corporate Action (تست)

```
Holding: instrumentId=ISIN-X, symbol=فولاد, qty=100, avg=2000, totalInvested=200,000

bonus_share ratio 1:10 (هر ۱۰ سهم یک جایزه):
  qty → 110
  totalInvested → 200,000 (ثابت)
  avg → 200,000/110 ≈ 1818.18

split 2:1:
  qty → 220
  totalInvested ثابت
  avg نصف

symbol_change فولاد → فولاد1:
  instrumentId unchanged
  symbol updated
  qty/cost unchanged
```

### الگوریتم کامل `rebuildStockHolding` (شامل Corporate Action)

```text
qty = 0; totalInvested = 0
برای هر tx با `instrumentId = holding.instrumentId` (و CAهای مرتبط طبق relatedCorporateActionId) ORDER BY businessDate, createdAt (isVoided=false):

  buy:
    totalInvested += quantity*price + feeInTradeCurrency(tx)
    qty += quantity

  sell:
    cost = qty==0 ? 0 : quantity * (totalInvested/qty)
    totalInvested -= cost
    qty -= quantity

  dividend:  // نقدی
    // qty و totalInvested بدون تغییر (cash جدا)

  bonus_share:
    qty += bonusQty
    // totalInvested ثابت

  split:
    qty *= ratio
    // totalInvested ثابت → average رقیق می‌شود

  reverse_split:
    qty /= ratio  (با سیاست باقیمانده مستند)
    // totalInvested ثابت

  capital_increase (cash):
    qty += newShares
    totalInvested += cashPaid + feesInTrade

  rights_issue:
    // اگر holding حق جدا: در holding دیگر؛ اینجا qty سهم اصلی ثابت
    // اگر روی همین holding: طبق payload

  rights_exercise:
    qty += sharesFromRights
    totalInvested += costOfRights + cashPaid

  rights_sell:
    // کاهش quantity حق روی holding حق؛ cash جدا

  symbol_change | isin_change:
    // metadata only — skip qty/cost

  transfer_ca:
    // از holding منبع کم / به مقصد اضافه با cost متناسب

averageBuyPrice = qty>0 ? totalInvested/qty : 0
```

**تست:** 1000 سهم → split 1:2 → qty=2000 و totalInvested همان؛ average نصف.

### Dividend — Gross / Withholding / Net

برای `type = 'dividend'`:

| فیلد | معنی |
|------|------|
| `grossDividend` | سود ناخالص قبل از کسر |
| `withholdingTaxAmount` | مالیات کسرشده در مبدأ (nullable) |
| `netDividend` | مبلغ واریزی به نقد (`= gross - withholding` در صورت کسر) |
| `totalAmount` | باید = `netDividend` (پول واقعی رسیده‌شده) مگر مستند خلاف |

Journal: income روی gross یا net طبق سیاست محلی — پیش‌فرض پروژه: درآمد قابل‌گزارش = gross؛ cash = net؛ withholding جدا metadata (و در صورت ایجاد tax_record لینک، نه expense دوباره از feeTax).
`isTaxableEvent=true` معمول برای dividend.

### instrumentId روی Transaction

`inv_stocks_iran_transactions` فیلد **`instrumentId` اجباری** دارد (همان هویت Holding).  
`symbol` فقط label در لحظه ثبت است و با CA عوض می‌شود؛ reconstruction همیشه با `instrumentId` (+ effective history در symbol_change).

### تخصیص Fee — بدون Double Count

| جزء | خرید (acquisition) | فروش (disposal) |
|-----|--------------------|-----------------|
| feeBrokerCommission | feeIn → totalInvested | feeFromProceeds → کاهش realized |
| feeExchange | feeIn | feeFromProceeds |
| feeTax | feeIn (transaction cost) — **نه** tax_records دوباره | feeFromProceeds مگر withholding جدا گزارش شود |
| feeOther | طبق نوع | طبق نوع |
| feeAmount | = sum؛ **فقط یک‌بار** در مسیر CostBasisEngine استفاده شود نه sum + breakdown جدا |

`realizedPL = saleProceeds - soldCost - feeFromProceeds` با `feeFromProceeds = feeInTradeCurrency(sell tx)`.
خرید: `cost += qty*price + feeInTradeCurrency` یک‌بار از feeAmount (یا sum breakdown معادل).

### reconcile = rebuild کامل
هر `reconcileStockHolding` / `rebuildStockHolding` از الگوریتم «شامل Corporate Action» در همین سند استفاده می‌کند. پیاده‌سازی فقط-buy/sell **باگ مشخصات** است.

---

## جدول رسمی اثر حسابداری Corporate Action

| type | quantity | totalInvested / cost | realizedPL | cash | income/tax |
|------|----------|----------------------|------------|------|------------|
| buy | + | + qty×price + feeIn | — | − | — |
| sell | − | − cost portion | proceeds−cost−feeOut | + | taxable event metadata |
| dividend | 0 | 0 | **نه** capital gain | + netDividend | **income** / gross+withholding |
| bonus_share | +bonus | ثابت | 0 | 0 | معمولاً nontaxable event تا فروش |
| split | ×ratio | ثابت | 0 | 0 | — |
| reverse_split | ÷ratio | ثابت | 0 | 0 | باقیمانده طبق policy |
| capital_increase (cash) | +new | +cashPaid+fees | 0 | − | — |
| rights_issue | 0 روی سهم اصلی یا +حق روی instrument حق | 0 یا cost حق | 0 | 0 | — |
| rights_exercise | +shares | +cost حق + cashPaid | 0 | − | — |
| rights_sell | −حق | −cost حق | proceeds−cost حق | + | مانند sell حق |
| symbol_change | 0 | 0 | 0 | 0 | metadata |
| isin_change | 0 | 0 | 0 | 0 | metadata؛ instrumentId ثابت مگر policy ادغام |
| transfer_ca | −src / +dst | cost منتقل | **0** | 0 | مانند transfer |
| suspension_note | 0 | 0 | 0 | 0 | — |

**rebuild** باید همه ردیف‌های بالا را اعمال کند؛ پیاده‌سازی فقط buy/sell نقض مشخصات است.

### Dividend در derived data
- `rebuild` quantity/cost را تغییر نمی‌دهد
- `getDividendIncome(instrumentId, period)` از Σ netDividend/gross
- `calculateProfitLoss` capital gain جدا از dividend income گزارش می‌دهد

---

## Iran market microstructure (Must)

### Transaction
- `settlementDate` → date **اجباری برای buy/sell** (T+2 کاری بورس ایران مگر خلاف اعلام بازار)
- `businessDate` = روز معامله؛ `settlementDate` = روز تسویه نقدی — **جدا**
- تا settlementDate نرسیده: cash brokerage/bank نباید به‌عنوان settled کامل در available برای خرید بعدی فرض شود مگر policy صریح

### Instrument registry (`inv_stocks_iran_instruments` یا معادل)
- `instrumentId` (PK منطقی)
- `isin` → string
- `firmCode` → string nullable (کد شرکت/شناسه بازار)
- `symbol` → display (قابل تغییر با CA)
- `lotSize` → integer (حداقل واحد سفارش، مثلاً ۱۰۰)
- `priceTick` → decimal (گام قیمت، ریال)
- Validate order qty % lotSize == 0؛ price روی tick grid

### `inv_stocks_iran_corporate_actions` (**Must در Data Model v1** — UI می‌تواند بعد از MVP باشد)

علاوه بر type روی transaction ledger:
```text
id, instrumentId, actionType, effectiveDate,
ratio?, cashAmount?, cashCurrency?,
sourceInstrumentIds, targetInstrumentIds,
costBasisPolicy, operationId, notes, createdAt
```

| actionType (حداقل) | اثر معمول qty/cost |
|--------------------|-------------------|
| `stock_split` | qty×ratio؛ cost/unit ÷ |
| `reverse_split` | qty÷؛ cost/unit × |
| `bonus_share` | +qty؛ cost pool ثابت |
| `capital_increase` | طبق حقوق/پرداخت نقدی |
| `rights` | اختیاری exercise → tx |
| `cash_dividend` | cash leg؛ qty ثابت |
| `symbol_change` / `isin_change` | identity/label؛ instrumentId پایدار ترجیح |
| `merger` / `spin_off` | map instrument + ratio |
| `delisting` | وضعیت؛ بستن/تبدیل holding |

Transaction rows = ledger quantity؛ این جدول metadata/audit CA است.  
اعمال فقط از `Corporate-Action-Engine` + `operationId`.  
**بدون این جدول از روز اول، تاریخچه بعداً قابل اعتماد نمی‌ماند.**

---


> **فلسفه داده (کل پروژه):**  
> `feeAmount` (legacy/total) و breakdown (`feeBrokerCommission`, `feeExchange`, `feeTax`, `feeOther`) — **RAW → Preserve forever**.  
> برای زیباسازی schema، فیلد خام قدیمی **حذف نمی‌شود**.  
> DERIVED rebuild می‌شود؛ SNAPSHOT disposable؛ EXTERNAL_REPORTED جدا از calculatedProfit می‌ماند.

## کارمزد و مالیات نقل‌وانتقال (ایران)

ترکیب نمونه ۱۴۰۴ (قابل پیکربندی در Settings، نه hard-code ابدی):
- خرید: کارگزار + بورس + سپرده‌گذاری + … (بدون مالیات نقل‌وانتقال)
- فروش: کارمزدها + **مالیات نقل‌وانتقال** (مثلاً ۰٫۵٪) داخل breakdown فروش

```text
feeTax (transaction cost / transfer tax):
  buy  → باید 0 یا null (validate reject اگر >0 بدون override صریح)
  sell → مجاز؛ treatment = proceeds_reduction یا tax_as_transaction_cost
با withholding/dividend tax قاطی نشود
```

### سهام عدالت
- `stockSource`: `market` | `justice` | `ipo` | `other`
- justice: غالباً `tradable=false` یا محدودیت؛ cost basis پیش‌فرض **0** (هدیه دولتی) مگر user override
- dividend سالانه مثل dividend عادی با instrumentId عدالت

### تقویم و جلسه بازار
```text
iran-market-calendar:
  isTradingDay(date)  // پنجشنبه/جمعه + تعطیلات رسمی
  nextSettlementDate(tradeDate) // T+2 کاری
marketSession روی tx: 'pre_open' | 'continuous' | 'closing' | 'off_market'
ساعت مرجع سهام: پیش‌گشایش ~08:00، پیوسته ~08:30–12:30 (قابل تنظیم)
priceLimit: ±pct از قیمت مرجع روز — validate اختیاری warn/reject
```

---

## Accounting (الزام)

هر معامله/CA سهام از `runAtomicFinancialOperation`:

- Domain: `inv_stocks_iran_transactions` (instrumentId هویت)
- Cash: فقط از **یک** مسیر Port → journal؛ cashBalance = projection (P0-DOC-012)
- Journal: lines روی `fin_accounts` (asset + cash/fee)
- CA از `Corporate-Action-Engine` — نه فقط update snapshot

`symbol` = label؛ تغییر نماد ≠ holding جدید.

**fee breakdown اجباری:** کارگزاری + بورس + مالیات فروش (نیم‌درصد) + other — نه یک fee کلی.

---

## Fee total + breakdown (P0)

```text
feeAmount              = total (همیشه حفظ — حتی اگر breakdown باشد)
feeBrokerCommission
feeExchange
feeTax
feeOther
```

داده قدیمی فقط با `feeAmount` معتبر است. Breakdown اختیاری است و جایگزین total نمی‌شود.

## FEAT-P0 LOCK (Stocks)

### instrumentId (P0-033)
Always `ref_instruments.id`. ISIN/symbol = metadata. Symbol change ≠ new identity.

### Cash T+2 (P0-032)
Separate: `ledgerCash`, `settledCash`, `availableCash`, `pendingSettlement`.
Trade date may reserve/ledger; available follows settlement date rules.

### Dividend (P0-035)
`grossDividend`, `withholdingTax`, `netDividend` separate.
Journal: income = gross; cash leg = net; withholding = distinct component (not double income).

### Corporate actions (P0-034)
CA table: source/target instruments, ratio, effectiveDate, operationId; rebuild applies CA ordered.

## FEAT-P0-032 DEEP
On trade: update ledger/pending per policy; availableCash follows settlementDate.
Fields: ledgerCash, settledCash, availableCash, pendingSettlement — never collapse to one immediate cashBalance for Iranian T+n stocks.

## FEAT-P0-033 DEEP
instrumentId type = Core UUID/id. ISIN and symbol are attributes; symbol change does not change instrumentId.

## FEAT-P0-034 DEEP
Each CA: operationId, sourceInstrumentId, targetInstrumentId?, ratio, effectiveDate, and type.
rebuildHolding applies CA chronologically after trades.

## FEAT-P0-035 DEEP
Store grossDividend, withholdingTax, netDividend.
Journal: Dr receivable/cash net, Dr tax withholding, Cr dividend income gross — one economic story without double income.

## Stocks ST locks (P0)

Full ST-001…ST-012: `STOCKS-ST-001-012-LOCKS.md`  
trade vs settlement dates · CA in rebuild · fractional/cash-in-lieu · stable instrumentId · raw≠adjusted prices · feeTax vs tax_events · dividend gross/withholding/net · transfer cost carry · delisting write-off · registry lot/tick · P&L decomposition · providerSymbol mapping.

**P0-FIX-007:** `totalFeesPaidBase` = Σ active fee events (DERIVED); rebuild-owned; no independent setter.

## P0-FIX-012 — Brokerage cash single path

```text
Feature → CashSettlementPort(route=stocks_iran_brokerage)
       → Brokerage Cash capability
       → fin_journal_lines
       → optional acc_transactions link
```

`cashBalance` on brokerage = **projection only**. Mutations only via Port inside atomic operation.

## P0-FIX-013 — accountId nullable at schema

Bank-integrated **commands** may require `accountId`.  
Feature schema must **not** make bank FK universal for correctness.  
Standalone stock/brokerage without Accounts UI must be runnable.

## P0-FIX-014 — Corporate Action ownership

| Owner | Responsibility |
|-------|----------------|
| **Corporate-Action-Engine** | quantity/cost formulas; apply; idempotent legs |
| **Iran Core** | calendar/session/T+2/lot/tick/market policy |
| **Stocks Feature** | required fields + API boundary only |

**Forbidden:** copy CA quantity/cost formulas into multiple feature files.

---

## P0-DOC-014 — Ownership split (Final Audit)

| Owner | Owns |
|-------|------|
| Corporate-Action-Engine | quantity/cost transformation formulas |
| Iran Market Adapter | session, calendar, T+2, lot/tick, market dates |
| Stocks Feature | fields, commands, queries, presentation |

**Invariant:** one formula = one owner. No copied CA math in feature prose as implementation authority.

## Schema note (P0-DOC-013)

`accountId` on brokerage transactions: **nullable** at schema level for standalone/local/external settlement.
Command validation may require it only for integrated bank route.

---

## Timeline of Events — Iranian equity trade (T+2 default)

> Owner: IranSettlement Core + Stocks Feature API. Formulas not hard-coded only in UI.

| Day | Label | What is booked (one `operationId` for trade intent; settlement may be linked ops) |
|-----|--------|-------------------------------------------------------------------------------------|
| **T+0** | Trade date | Domain stock tx (buy/sell); position qty change; **broker payable/receivable** (or pending cash); fees/tax legs per fee breakdown; **not** necessarily settled bank cash |
| **T+1** | Interim | No automatic second economic trade; pending settlement remains open; reports show pending vs settled cash separately |
| **T+2** | Settlement (default Iran equity) | Settlement clears payable/receivable → **CashSettlementPort** → journal on brokerage/bank `fin_accounts`; `settlementDate` = business date of clear |

### Rules

1. `tradeDate` ≠ `settlementDate` (both DATE-only Gregorian; Jalali display only).
2. Portfolio quantity uses trade-date (T+0) unless product policy says otherwise for specific instruments.
3. **Available cash** must not assume unsettled sale proceeds are spendable until settlement posts (or explicit credit policy).
4. Settlement failure → reverse/adjust settlement intent without orphaning liability (Core reversal).
5. v1 may post trade+settlement in one operation only when user records an already-settled historical trade; live T+2 must keep pending state visible.

See also: `IranSettlement` in `docs/core/iran/README.md`.

## Locks full text (from STOCKS-ST-001-012-LOCKS.md)

# Stocks Iran Locks ST-001 … ST-012 (P0)

در تعارض با prose قدیمی این Feature، این سند برنده است.

---

## ST-001 — TradeDate vs SettlementDate

| Use | Date |
|-----|------|
| Position / trade P&L recognition timing | `tradeDate` (business/trade) |
| Cash leg / brokerage cash availability | `settlementDate` (+ `effectiveCashDate` when distinct) |

Reports must not use a single `date` for both position P&L and cash. See Settlement-Accounting + Date-Semantics-Matrix.

---

## ST-002 — Corporate actions in rebuild

- All supported CA types transform qty/cost **only** via `CorporateActionEngine` (+ CostBasisEngine hooks).
- `rebuildStockHolding` / reconcile must include CA ledger events — not buy/sell only (P0-050).

---

## ST-003 — Rights / fractional / cash-in-lieu

```text
entitlement = f(holdingQty, ratio, instrument precision, market rules)
fractionalPolicy → round_down | round_nearest | cash_in_lieu | …
cashInLieu → explicit cash event/operation leg when policy requires
```

No orphan fractional shares or cash without policy (P0-056).

---

## ST-004 — Symbol change ≠ new identity

- `instrumentId` (UUID → `ref_instruments`) **unchanged** on symbol/ISIN label change.
- Symbol history table or CA metadata records old→new labels.
- Holding unique key remains `(brokerageId, instrumentId)`.

---

## ST-005 — Adjusted vs raw prices

- `price_history` **raw** quotes are immutable.
- Split/CA-adjusted series = **derived** projection (separate series or view), never overwrite raw rows.

---

## ST-006 — feeTax vs tax liability

- `feeTax` on trade = **transaction cost** only (fee breakdown).
- Periodic / capital-gains **tax liability** = Tax Feature (`tax_events` / `linkedTaxEventId`).
- Do not double-count feeTax as tax_records payment (P0-053, P0-084).

---

## ST-007 — Dividend three values

```text
grossDividend
withholdingTaxAmount   // if any
netCash                // what hits cash / brokerage
```

Income recognition uses gross (policy); cash movement uses net. Missing split = invalid dividend event.

---

## ST-008 — Brokerage → brokerage transfer

```text
transfer event / transfer_ca
cost basis carries
realizedPnl = 0
```

Not a sell+buy that realizes gain/loss.

---

## ST-009 — Delisting / worthless

- Explicit **write-off / disposal** operation (qty→0 or residual, carrying cost released, loss recognized per policy).
- Silent zeroing of holding snapshot without operation = forbidden.

---

## ST-010 — Lot / tick / market validation

- Lot size, tick size, market segment constraints from **registry / Iran-Market-Rules** (instrument + market metadata).
- Commands that violate constraints → `VALIDATION_ERROR` (unless explicit override policy for import legacy).

---

## ST-011 — P&L decomposition

When multi-currency or fees material, report like Crypto golden:

```text
assetPriceEffectBase
fxEffectBase          // if applicable
feeEffectBase
externalCashFlowEffectBase
realizedPnlBase
unrealizedPnlBase
```

Opaque single P&L only is insufficient for base≠trade currency paths.

---

## ST-012 — Price provider mapping

```text
priceProviderId + providerSymbol + market
```

**Forbidden** as sole durable mapping: bare internal `symbol` string. Incomplete mapping must be detectable (P0 stocks price mapping rules).

---

## Status

| ID | Status |
|----|--------|
| ST-001 … ST-012 | **LOCKED** 2026-09-02 |



## P0-DOC-011 — Currency model (not hard-coded USDT)

```text
transaction currency for Iran equity trades: typically IRR
user baseCurrency: from settings (IRR / USD / …)
exchangeRateToBase on operation when tx currency ≠ base
USDT is a separate instrument/cash currency if used — not implied as stock quote
```

## P0-DOC-012 — Brokerage cash path

```text
brokerage cashBalance field = PROJECTION only
Path: Operation → CashSettlementPort → fin_accounts (brokerage cash) → fin_journal_lines
Never feature-owned independent cash SoT
```

## P0-DOC-013 — accountId brokerage

```text
Schema: accountId / finAccountId nullable
Command validation: required when settlementMode = integrated; optional for standalone local settlement
```

## P0-DOC-014 — CA / settlement ownership

| Concern | Owner |
|---------|--------|
| CA transform formulas (qty/cost) | Corporate-Action-Engine + CostBasisEngine |
| Calendar, T+n, lot/tick | Iran-Market-Rules / market adapter |
| Fields, UX, brokerage holdings tables | Stocks Iran Feature |
| Cash on settlement | CashSettlementPort + journal |
