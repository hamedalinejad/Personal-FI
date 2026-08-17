# زیر‌فیچر: Investment - Stocks Iran (سهام بورس ایران)

## توضیح کلی
این زیر‌فیچر مدیریت سرمایه‌گذاری در **بازار بورس ایران** را بر عهده دارد.
تمام مبالغ به **ریال** هستند، اما در هر معامله **نرخ تتر لحظه** ذخیره می‌شود.

---

## Business Rules

1. تمام مبالغ به ریال هستند.
2. در هر معامله، نرخ تتر لحظه ثبت و قفل می‌شود.
3. واریز/برداشت بین حساب بانکی و کارگزاری باید در `acc_transactions` و `inv_stocks_iran_brokerage_transactions` با لینک متقابل ثبت شود.
4. خرید از cashBalance کارگزاری کسر و به Holding اضافه می‌شود.
5. فروش از Holding کسر و خالص مبلغ به cashBalance کارگزاری اضافه می‌شود.
6. **کارمزد و مالیات**:
 - `feeAmount` فیلد Total و برای سازگاری با مدل قبلی **حذف نمی‌شود**.
 - `feeBrokerCommission` = کارمزد کارگزار.
 - `feeExchange` = کارمزد/هزینه بورس و ارکان بازار.
 - `feeTax` = مالیات.
 - `feeOther` = سایر هزینه‌ها و کارمزدهای قابل گزارش.
 - برای تراکنش‌های جدید: `feeAmount = feeBrokerCommission + feeExchange + feeTax + feeOther`.
 - برای داده‌های قدیمی که Breakdown ندارند، `feeAmount` اصلی بدون تغییر حفظ می‌شود و اجزای Breakdown می‌توانند null/0 باشند؛ هیچ داده‌ای نباید حذف یا بازنویسی شود.
7. سود نقدی با `type = 'dividend'` ثبت می‌شود و جزو Realized P&L خرید/فروش نیست.
8. موجودی حساب بانکی، cashBalance کارگزاری و quantity سهم نمی‌توانند منفی شوند.
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
- `instrumentId` → string (**اجباری — **؛ هویت پایدار داخلی، ترجیحاً ISIN یا UUID ثابت سیستم؛ با تغییر نماد عوض **نمی‌شود**)
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

> **هویت**: کلید منطقی Holding = `brokerageId + instrumentId` (نه `brokerageId + symbol`). 
> `symbol` / `market` / `providerSymbol` metadata قابل‌تغییرند. تاریخچه تغییر نماد در `inv_stocks_iran_symbol_history` یا event corporate action ثبت می‌شود. 
> Mapping قیمت: `priceProviderId + providerSymbol + market`؛ Provider هرگز `symbol` داخلی را هویت فرض نکند.

### ۳. Stock Transaction — `inv_stocks_iran_transactions`

- `id` → UUID
- `brokerageId` → UUID
- `symbol` → string
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
- `feeAmount` → decimal — Total و سازگار با مدل قبلی
- `feeBrokerCommission` → decimal nullable/default 0
- `feeExchange` → decimal nullable/default 0
- `feeTax` → decimal nullable/default 0
- `feeOther` → decimal nullable/default 0
- `feeCurrency` → string
- `exchangeRateToBase` → decimal
- `description` → string
- `date` → datetime
- `createdAt` → datetime
- **Tax metadata**: `isTaxableEvent`, `costBasisAmount`, `proceedsAmount`, `realizedGainAmount`, `taxYear`, `withholdingTaxAmount` (هم‌راستا با `feeTax`), `taxLotId`, `linkedTaxRecordId`, `taxExemptReason` — قرارداد کامل در `Tax-Management.md`

**Invariant جدید:**

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
- `accountId` → UUID
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
- `getHoldingBySymbol(symbol, brokerageId?)`
- `getPortfolioValue`
- **`reconcileStockHolding(holdingId)`** → مقایسه `quantity` / `totalInvested` / `averageBuyPrice` snapshot با محاسبه از صفر از روی لاگ تراکنش‌ها

 ```typescript
 reconcileStockHolding(holdingId: UUID): ReconcileResult & {
 fields: {
 quantity: { stored: Decimal; calculated: Decimal; match: boolean }
 totalInvested: { stored: Decimal; calculated: Decimal; match: boolean }
 averageBuyPrice: { stored: Decimal; calculated: Decimal; match: boolean }
 }
 }
 ```

 **الگوریتم محاسبه** (Weighted Average از صفر از `inv_stocks_iran_transactions` غیر‌void، به‌ترتیب `date ASC`):
 ```
 qty = 0 | totalInvested = 0

 برای هر تراکنش:
 buy: totalInvested += (quantity × price) + feeAmount
 qty += quantity
 sell: soldCost = quantity × (totalInvested / qty)
 totalInvested -= soldCost
 qty -= quantity

 averageBuyPrice = qty > 0 ? totalInvested / qty : 0
 ```

 **در صورت Mismatch**: ثبت در `fin_audit_log` + هشدار به کاربر + گزینه Repair (بازسازی snapshot از لاگ با تأیید کاربر).

- **`rebuildStockHolding(holdingId)`** → بازسازی کامل `quantity` / `totalInvested` / `averageBuyPrice` از لاگ تراکنش‌ها و آپدیت atomic در `inv_stocks_iran_holdings`

 **زمان استفاده الزامی**: پس از هر Reversal (void) تراکنش سهام، پس از Migration، پس از Import/Restore.

### Transaction
- `createStockTransaction(data)`
- `createBrokerageTransaction(data)`
- `getStockTransactions(filters)`
- `getBrokerageTransactions(filters)`
- `calculateProfitLoss(symbol?, brokerageId?)`

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

### خرید

```text
newTotalInvested = totalInvested + (quantityBought × price) + feeAmount
newQuantity = quantity + quantityBought
newAverageBuyPrice = newTotalInvested / newQuantity
```

### فروش

```text
soldPortionCost = quantitySold × averageBuyPrice
realizedPL = saleProceeds - soldPortionCost - feeAmount
totalInvested -= soldPortionCost
quantity -= quantitySold
averageBuyPrice بدون تغییر می‌ماند
```

### Unrealized

```text
unrealizedPL = (currentPrice - averageBuyPrice) × quantity
```

Realized و Unrealized نباید با یکدیگر مخلوط شوند.

---

## نکات طراحی

- این زیر‌فیچر مخصوص سهام بورس ایران است.
- همه مبالغ ریالی هستند و نرخ تتر لحظه‌ای هر رکورد حفظ می‌شود.
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
- `createBrokerage` / cash deposit-withdraw ↔ `acc_transactions` + brokerage cash ledger
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
