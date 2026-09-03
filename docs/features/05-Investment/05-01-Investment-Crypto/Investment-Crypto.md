
## Canonical: Asset vs Cash + نقش USDT

```text
Asset Position  (inv_crypto_holdings)     Cash Position (inv_crypto_cash)
  BTC, ETH, USDT-TRC20, USDT-ERC20, …       IRR settlement, USDT settlement cash, …
```

| USDT role | جدول | Cost basis |
|-----------|------|------------|
| Settlement cash روی صرافی | `inv_crypto_cash` | معمولاً cash policy |
| دارایی سرمایه‌گذاری / on-chain token (TRC20/ERC20) | `inv_crypto_holdings` + instrument | Cost-Basis-Engine از معاملات |

**USDT ذاتاً نه همیشه Asset است نه همیشه Cash** — نقش از context acquisition + venue تعیین می‌شود.

**هویت:** فقط `ref_instruments.id` (+ crypto metadata). نه registry موازی.

**Legacy `symbol=IRR/USDT` در holdings:** فقط migration path — write جدید ممنوع.

> **Identity:** فقط `ref_instruments` (Core). جدول موازی `inv_crypto_assets` به‌عنوان registry هویت **ممنوع** — metadata کریپتو = extension/columns روی instrument یا جدول `inv_crypto_instrument_meta` با FK به `ref_instruments.id`.

# زیر‌فیچر: Investment - Crypto (رمزارز)

## توضیح کلی
این زیر‌فیچر مسئولیت کامل مدیریت دارایی‌های رمزارزی را بر عهده دارد. 
شامل مدیریت صرافی‌ها و والت‌ها (شامل والت نرم‌افزاری)، خرید، فروش، انتقال، واریز و برداشت، محاسبه میانگین خرید، سود و زیان و ارزش پرتفوی است.

تمام جابه‌جایی‌های ریالی/تتری با حساب‌های بانکی از طریق جدول `acc_transactions` ثبت می‌شوند و به تراکنش‌های صرافی لینک می‌گردند.

---

## User Stories

### Must Have
- ثبت صرافی یا والت (شامل والت نرم‌افزاری) همراه با آدرس سایت/اپ
- ثبت خرید رمزارز (ریالی یا تتری)
- ثبت فروش رمزارز (مبلغ می‌تواند به کیف پول صرافی/ولت اضافه شود)
- واریز از حساب بانکی به صرافی/ولت
- برداشت از صرافی/ولت به حساب بانکی
- انتقال بین صرافی‌ها یا والت‌ها (با امکان کسر کارمزد از ارز)
- مشاهده موجودی هر رمزارز و میانگین خرید
- ثبت و پیگیری کارمزدهای پرداخت‌شده (به ریال و تتر)
- محاسبه سود و زیان (realized و unrealized)
- مشاهده ارزش کل پرتفوی رمزارز
- ذخیره نرخ تبدیل لحظه معامله

### Should Have
- تاریخچه قیمت
- پیوست رسید معامله

---

## Business Rules

1. هر معامله رمزارز باید به یک صرافی یا والت مرتبط باشد.
2. هنگام **خرید**:
 - موجودی رمزارز افزایش می‌یابد.
 - در صورت پرداخت از حساب بانکی → تراکنش در `acc_transactions` + `inv_crypto_exchange_transactions` ثبت می‌شود.
3. هنگام **فروش**:
 - موجودی رمزارز کاهش می‌یابد.
 - مبلغ حاصل می‌تواند به موجودی ریال/تتر همان صرافی یا والت اضافه شود (نه الزاماً حساب بانکی).
4. **واریز از حساب بانکی** به صرافی/ولت:
 - موجودی حساب بانکی کاهش و موجودی ریال/تتر صرافی افزایش می‌یابد.
 - تراکنش در `acc_transactions` با `relatedFeature = 'crypto_exchange'` و `relatedId = inv_crypto_exchange_transactions.id` ثبت می‌شود.
 - تراکنش در `inv_crypto_exchange_transactions` نیز ثبت و به تراکنش بانکی لینک می‌شود.
5. **برداشت به حساب بانکی**:
 - موجودی ریال/تتر صرافی کاهش و موجودی حساب بانکی افزایش می‌یابد.
 - هر دو تراکنش (`acc_transactions` و `inv_crypto_exchange_transactions`) ثبت و به هم لینک می‌شوند.
6. **انتقال بین صرافی‌ها/والت‌ها**:
 - حتماً دو تراکنش لینک‌شده ثبت می‌شود، با یک `transferGroupId` مشترک (UUID تازه، ساخته‌شده در لحظه ثبت انتقال) که در هر دو رکورد ذخیره می‌شود:
 - یکی در صرافی مبدا با `type: transfer_out`، `counterExchangeId` به مقصد و `transferGroupId` مشترک
 - یکی در صرافی مقصد با `type: transfer_in`، `counterExchangeId` به مبدا و همان `transferGroupId`
 - `transferGroupId` (نه صرفاً `counterExchangeId`) مرجع قطعی برای پیدا کردن رکورد جفت است؛ این لازم است چون ممکن است چند انتقال هم‌زمان بین همان دو صرافی در یک روز ثبت شود.
 - کارمزد شبکه/انتقال می‌تواند از مقدار ارسالی کسر شود (`feePresence = fee_from_received` یا `fee_from_base_asset`):
 - `grossQuantity` / `amountToSend` = مقدار کسرشده از مبدا
 - `feeQuantity` / `feeAmount` = سوخته‌شده (شبکه یا واسطه)
 - `netQuantity` در مقصد = `amountToSend - fee` (وقتی fee از همان asset است)
 - **تفکیک دو مفهوم**:
 - *Internal platform transfer بدون fee*: مجموع quantity بین پلتفرم‌های کاربر **حفاظت می‌شود** (conservation).
 - *Transfer با network fee*: مجموع اقتصادی `Σ holdings` کاربر **کاهش می‌یابد** به‌اندازه fee — این «جابه‌جایی خالص» نیست؛ سوزاندن کارمزد است و باید در journal به‌عنوان `fee` ثبت شود.
 - جملهٔ «موجودی کل تغییر نمی‌کند» **فقط** برای transfer بدون fee یا fee_external (پرداخت از دارایی دیگر) صدق می‌کند.
7. میانگین خرید با هر خرید جدید به‌روزرسانی می‌شود.
8. کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToBase` در لحظه ثبت می‌شوند.
9. موجودی حساب بانکی نمی‌تواند منفی شود.
9a. موجودی Asset (`inv_crypto_holdings.quantity`) و CashPosition (`inv_crypto_cash.balance`) هیچ‌کدام منفی نمی‌شوند.
10. نرخ تبدیل لحظه معامله ذخیره و قفل می‌شود.
11. **ویرایش/حذف معاملات — فقط Core Reversal**

```text
reverseCrypto(operationId) → core.reverseOperation(operationId)
CryptoFinancialOperationAdapter.buildReversalPlan(originalOperationId)
```

**ممنوع:** الگوریتم‌های موازی feature-local با UPDATE isVoided + INSERT مستقیم در این سند به‌عنوان مسیر پیاده‌سازی. نمونه‌های قدیمی حذف شده‌اند.

Adapter plan باید برگرداند:
- void/inverse domain rows (buy/sell/C2C legs/transfer/fee_burn) با **instrumentId** (و location)
- journal inverse lines
- cash inverse اگر بود
- snapshotTargets برای rebuild

فیلدهای audit روی domain: `isReversal`, `reversedTxId`, `reversesOperationId` هم‌تراز Core.

---


## Canonical Crypto Transaction Fields (P0)

هر معامله رمزارز **فقط quantity/price/fee ساده نیست**. مدل کامل:

```text
Transaction
 ├── instrumentId          (Asset identity — ref_instruments)
 ├── Gross Quantity
 ├── Net Quantity
 ├── Fee Quantity
 ├── Fee Asset (instrumentId / currency)
 ├── Quote Asset
 ├── Price
 ├── Gross Value
 ├── Net Value
 ├── Fee Value
 ├── exchangeRateToBase
 ├── Cost Basis fields (via CostBasisEngine — totalCostBase)
 └── External Reference (txHash, provider id, …)
```

| Field | Kind | Notes |
|-------|------|-------|
| `instrumentId` | RAW FK | هویت دارایی |
| `grossQuantity` | RAW | قبل از fee از base |
| `feeQuantity` | RAW | مقدار fee به واحد fee asset |
| `netQuantity` | RAW | اثر روی holding |
| `feeAssetInstrumentId` / `feeCurrency` | RAW | |
| `quoteAsset` / quote instrument | RAW | |
| `price` | RAW | به quote |
| `grossValue` / `netValue` / `feeValue` | RAW یا derived consistent | audit |
| `exchangeRateToBase` | RAW at post | |
| original quote amounts | RAW | **هرگز دور نریز** برای multi-currency cost |

Holding با **netQuantity** به‌روز می‌شود؛ gross/fee برای بازسازی و reconcile حفظ می‌شوند.

## Domain Entities

### ۱. Crypto Exchange / Wallet (جدول: `inv_crypto_exchanges`)

- `id` → UUID (Primary Key)
- `name` → string
- `type` → string (`exchange`, `software_wallet`, `hardware_wallet`)
- `url` → string (آدرس سایت یا اپلیکیشن — nullable)
- `description` → string
- `isActive` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Crypto Wallet Network (جدول: `inv_crypto_wallet_networks`)

> فقط برای `software_wallet` | `hardware_wallet`. صرافی متمرکز معمولاً نیاز ندارد.

- `id` → UUID
- `exchangeId` → UUID FK
- `network` / `chainId` → شناسایی شبکه (TRC20/ERC20/…)
- `label` → string nullable (مثلاً «سرد»، «حساب ۰»)
- `isActive`, `createdAt`, `updatedAt`

> یک ردیف network **دیگر یک address واحد نیست**. آدرس‌ها در جدول فرزند:

### ۲b. Wallet Addresses — `inv_crypto_wallet_addresses`
| فیلد | نقش |
|------|-----|
| `id` | UUID |
| `networkId` | FK → `inv_crypto_wallet_networks` |
| `address` | آدرس on-chain |
| `derivationPath` | nullable (مثلاً BIP44 `m/44'/60'/0'/0/0`) |
| `accountIndex` | nullable |
| `addressType` | `receiving` \| `change` \| `contract` \| `other` |
| `isPrimary` | boolean — حداکثر یک primary per network |
| `label` | nullable |
| `isActive` | boolean |

قوانین:
1. `network` = لایه زنجیره؛ `address` = یک هویت دریافت/ارسال روی آن شبکه.
2. Holding همچنان به `networkId` (و assetKey) وصل است — موجودی per-network؛ نه per-address (v1).
3. تراکنش on-chain می‌تواند `fromAddressId` / `toAddressId` اختیاری داشته باشد برای audit آینده.
4. v1 می‌تواند با یک address per network شروع کند ولی schema از روز اول چندآدرسی است تا محدود نشود.

> **/006**: شبکه فقط در `inv_crypto_transactions` (فیلد `networkId` FK) ثبت می‌شود، نه در `inv_crypto_exchange_transactions`. جدول exchange transactions فقط برای جریان نقدی Bank ↔ Exchange است و فیلدهای آنچین (network, txHash, ...) در آن جایی ندارند.

### ۳. Crypto Holding (جدول: `inv_crypto_holdings`)

- `id` → UUID (Primary Key)
- `exchangeId` → UUID (FK → `inv_crypto_exchanges.id`)
- `instrumentId` → UUID (**اجباری** — FK → `ref_instruments.id`؛ **تنها هویت دارایی**)
- `networkId` → UUID (nullable — FK → `inv_crypto_wallet_networks.id`؛ فقط برای wallet‌ها؛ برای صرافی null)
- `symbol` → string (**فقط label نمایشی** — نه هویت؛ از instrument.displaySymbol قابل کپی در UI)
- `name` → string (label؛ از instrument)
- `assetKey` → string (nullable — **ایندکس راحتی** مشتق از meta ابزار؛ نه SoT هویت؛ برای سازگاری migration)
- `providerInstrumentId` / `assetId` → string (nullable — شناسه Provider خارجی برای mapping؛ هرگز به‌جای instrumentId)
- `quantity` → decimal (**DERIVED** از txs — cache؛ SoT = ledger)
- `averageBuyPrice` / `averageCostBase` → decimal (**DERIVED** CostBasisEngine — در **costCurrency/base**)
- `costCurrency` → string (معمولاً baseCurrency کاربر)
- `totalInvested` / `totalCostBase` → decimal (**DERIVED** در costCurrency)
- `currency` → string (display context؛ نه جایگزین costCurrency)
- `totalFeesPaidBase` → decimal (**DERIVED** — مجموع feeBase txs)
- `createdAt` / `updatedAt` → datetime

> **هویت:** chainId / contractAddress / decimals روی `inv_crypto_instrument_meta` (FK به همان `instrumentId`) ذخیره می‌شوند، نه به‌عنوان SoT موازی روی holding. Holding فقط location (`exchangeId`, `networkId`) + `instrumentId` دارد.

> **نکته `networkId`**: برای والت، USDT روی TRC20 و ERC20 = دو `instrumentId` متفاوت (دو ردیف ref_instruments) و در نتیجه دو holding جدا — حتی روی یک والت.

> **Unique Identity Holding (DB):**
> - `UNIQUE(exchangeId, instrumentId)` وقتی networkId null (صرافی / موجودی داخلی)
> - `UNIQUE(exchangeId, networkId, instrumentId)` وقتی network برای والت لازم است
> **ممنوع:** UNIQUE بر اساس `symbol` تنها. قیمت‌گیری و rebuild با `instrumentId`.

### ۴. Crypto Transaction (جدول: `inv_crypto_transactions`) — لاگ معاملات رمزارز

هر فیلد یک‌بار در این فهرست تعریف می‌شود (Canonical name / Type / Nullable در معنای فیلد).

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `instrumentId` → UUID (**اجباری** — FK → `ref_instruments.id`)
- `symbol` → string (**label فقط** — نه identity؛ یک‌بار)
- `type` → string (`buy`, `sell`, `transfer_in`, `transfer_out`) — C2C = دو leg با type buy/sell + `tradeGroupId`/`operationId` مشترک
- `operationId` → UUID (nullable — گروه atomic؛ برای C2C/transfer اجباری هم‌تراز tradeGroupId/transferGroupId)
- `tradeGroupId` → UUID (nullable — C2C legs)
- `grossQuantity` → decimal (nullable — قبل از fee؛ وقتی fee از base/received)
- `feeQuantity` → decimal (nullable — مقدار fee به واحد fee asset)
- `netQuantity` → decimal (**اثر روی holding**؛ اگر fee نباشد = quantity)
- `quantity` → decimal (alias سازگاری = **netQuantity**؛ SoT عملیاتی net است)
- `price` → decimal (به quote)
- `quoteCurrency` / quote instrument → string/UUID (ارز یا دارایی quote)
- `grossValue` → decimal nullable
- `netValue` → decimal nullable  
- `feeValue` → decimal nullable
- `totalAmount` → decimal (معمولاً هم‌تراز gross یا net value طبق convention صرافی — در همان tx مستند شود)
- `originalAmount` → decimal nullable — مبلغ خام quote قبل از نرمال‌سازی base
- `originalCurrency` → string nullable — ارز خام معامله
- `feeAmount` → decimal
- `feeCurrency` → string
- `feeAssetInstrumentId` → UUID nullable
- `feeAssetPriceToBase` → decimal nullable
- `exchangeRateToBase` → decimal (**RAW at post** — برای Cost pool base؛ Preserve)
- `currency` → string (quote یا settlement context)
- `counterExchangeId` → UUID (صرافی/ولت مقابل — برای انتقال — nullable)
- `networkId` → UUID (nullable — FK به `inv_crypto_wallet_networks.id`؛ برای `transfer_in`/`transfer_out` بین والت‌ها الزامی؛ برای `buy`/`sell` داخل صرافی null — فیلد string آزاد `network` ممنوع است؛ نمایش UI از `inv_crypto_wallet_networks.name`/`chainId` می‌آید)
- `transferGroupId` → UUID (نال مگر برای `type: transfer_in`/`transfer_out` — بین دو رکورد `transfer_out` و `transfer_in` متناظر یک انتقال، مقدار یکسان و مشترک دارد؛ برای تشخیص قطعی جفت رکورد و Reversal صحیح وقتی چند انتقال هم‌زمان بین همان دو صرافی رخ می‌دهد)
- `txHash` → string (nullable — شناسه تراکنش آنچین (Transaction Hash) روی بلاکچین؛ برای `transfer_in`/`transfer_out` بین والت‌ها بسیار ارزشمند است؛ برای `buy`/`sell` داخل صرافی متمرکز معمولاً null است)
- `blockNumber` → integer (nullable — شماره بلاکی که تراکنش در آن تأیید شده؛ فقط اگر `txHash` موجود باشد معنی دارد)
- `confirmations` → integer (nullable — تعداد تأییدیه‌های بلاکچین در لحظه ثبت؛ اختیاری برای رفرنس تاریخی)
- `isReversal` → boolean (پیش‌فرض `false` — این رکورد یک تراکنش معکوس/Reversal است)
- `reversedTxId` → UUID (nullable — برای Reversal تک‌رکوردی: id رکورد `inv_crypto_transactions` اصلی که این Reversal آن را خنثی می‌کند)
- `reversedTradeId` → UUID (nullable — برای Reversal C2C: `tradeGroupId` معامله اصلی)
- `reversedTransferGroupId` → UUID (nullable — برای Reversal انتقال: `transferId` انتقال اصلی)
- `description` → string
- `date` → datetime
- `createdAt` → datetime
- **Tax metadata** — طبق قرارداد `Tax-Management.md`:
 - `isTaxableEvent` → boolean
 - `costBasisAmount` / `costBasisCurrency` → decimal/string nullable
 - `proceedsAmount` / `realizedGainAmount` → decimal nullable
 - `taxYear` → number nullable
 - `withholdingTaxAmount` → decimal nullable
 - `taxLotId` / `linkedTaxRecordId` / `taxExemptReason` → nullable

### ۵. Crypto Exchange Transaction (جدول: `inv_crypto_exchange_transactions`) — لاگ واریز و برداشت ریالی/تتری

> این جدول **فقط** برای جریان نقدی فیات/استیبل مرتبط با حساب بانکی (Bank ↔ Exchange cash) است. فیلدهای `network`, `txHash`, `blockNumber`, `confirmations` از این جدول حذف شده‌اند — این فیلدها فقط در `inv_crypto_transactions` (برای `transfer_in`/`transfer_out` آنچین) معنی دارند.

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `type` → string (`deposit`, `withdraw`)
- `amount` → decimal
- `currency` → string (IRR, USDT و ...)
- `feeAmount` → decimal
- `feeCurrency` → string
- `feeAssetPriceToBase` → decimal (فقط وقتی `feeCurrency !== baseCurrency`؛ قیمت کمکی fee→base)
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → baseCurrency کاربر در لحظه ثبت — )
- `accountId` → UUID **nullable** (فقط وقتی settlement از Accounts/CashSettlementPort نوع internal است؛ Standalone/LocalSettlement بدون `acc_*`)
- `accountTransactionId` → UUID (لینک به `acc_transactions`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **نکته لینک**: هنگام ایجاد این تراکنش، یک تراکنش در `acc_transactions` نیز ایجاد می‌شود با: 
> - `relatedFeature = 'crypto_exchange'` 
> - `relatedId = inv_crypto_exchange_transactions.id`
> 
> **نکته مهم**: برای لینک معکوس، در جدول `acc_transactions` فیلدهای `relatedFeature` و `relatedId` تعریف شده‌اند که به `inv_crypto_exchange_transactions.id` اشاره می‌کند. این یکی از دلایل ایجاد دو تراکنش (یکی در حساب بانکی، یکی در صرافی) است.

### ۶. acc_transactions

- فقط زمانی که پول واقعاً از/به حساب بانکی جابه‌جا شود ثبت می‌شود و با `inv_crypto_exchange_transactions` لینک می‌گردد.
- لینک از طریق `relatedFeature = 'crypto_exchange'` و `relatedId = inv_crypto_exchange_transactions.id` انجام می‌شود.

---

## منطق کارمزد

### بخش ۱ — تبدیل کارمزد به ارز پایه (`feeBase`)

این تابع در **همه** عملیات (خرید، فروش، انتقال، C2C) یکسان است:

```typescript
function convertFeeToBase(feeAmount, feeCurrency, feeAssetPriceToBase, exchangeRateToBase, baseCurrency): Decimal {
 if (feeAmount.isZero) return new Decimal(0);
 if (feeCurrency === baseCurrency) return feeAmount; // بدون تبدیل
 if (feeCurrency === 'IRR') return feeAmount.dividedBy(exchangeRateToBase); // IRR → base
 /* feeCurrency = رمزارز دیگر (BTC, ETH, ...) — feeAssetPriceToBase الزامی */
 return feeAmount.times(feeAssetPriceToBase); // crypto → base
}
```

> ❌ هرگز `feeAmount / exchangeRateToBase` برای `feeCurrency=BTC/ETH` استفاده نکنید —
> `exchangeRateToBase` فقط نرخ IRR است، نه قیمت BTC/ETH.

---

### بخش ۲ — قانون واحد Fee Treatment روی `quantity` و `Cost Basis`

> **اصل بنیادی**: رفتار کارمزد با فیلد `feePresence` روی تراکنش تعیین می‌شود — **نه یک قانون ثابت برای همه صرافی‌ها**.
> - `fee_in_quote` — کارمزد از ارز قیمت‌گذاری/تسویه؛ quantity دارایی پایه معمولاً gross=net
> - `fee_from_base_asset` — کارمزد از خود دارایی؛ `netQuantity = grossQuantity - feeQuantity`
> - `fee_external` — کارمزد جدا پرداخت شده (خارج از این trade)
> - `fee_from_received` — کارمزد از مقدار دریافتی کسر (شبیه transfer)
>
> فیلدهای اجباری وقتی fee وجود دارد: `grossQuantity`, `feeQuantity`, `netQuantity`, `feeCurrency`, `feeAmount`

#### ۲-الف) خرید (BUY)

```
مثال: خرید ۱ BTC — fee = 0.001 BTC (feeCurrency = BTC)

quantity ثبت‌شده در inv_crypto_transactions.quantity = 1 ✅ (کل مقدار خریداری‌شده)
quantity اضافه‌شده به inv_crypto_holdings.quantity = 1 ✅

feeBase = 0.001 × feeAssetPriceToBase (قیمت BTC به baseCurrency)

Cost Basis آپدیت:
 newTotalInvested = totalInvested + totalAmountBase + feeBase
 newQuantity = quantity + 1
 newAverageBuyPrice = newTotalInvested / newQuantity
```

> **چرا `quantity = 1` نه `0.999`؟**
> چون کارمزد بخشی از **هزینه تملک** آن ۱ BTC است، نه کسری از تعداد.
> یعنی ما ۱ BTC داریم، اما هزینه‌ای که برای آن پرداختیم شامل کارمزد هم می‌شود.
> این رویکرد Cost Basis را درست نگه می‌دارد و از undercosting جلوگیری می‌کند.

#### ۲-ب) فروش (SELL)

```
مثال: فروش ۱ BTC — fee = 0.001 BTC (feeCurrency = BTC)

quantity ثبت‌شده در inv_crypto_transactions.quantity = 1 ✅ (کل مقدار فروخته‌شده)
quantity کسرشده از inv_crypto_holdings.quantity = 1 ✅

feeBase = 0.001 × feeAssetPriceToBase

soldPortionCost = 1 × averageBuyPrice
realizedPL = totalAmountBase(مبلغ دریافتی خالص) - soldPortionCost - feeBase
totalInvested -= soldPortionCost
```

> **توجه**: `totalAmountBase` در رکورد تراکنش فروش = مبلغ **قبل** از کسر کارمزد است (gross amount).
> کارمزد جداگانه در `feeBase` از P&L کسر می‌شود.


> **P0 — انتقال Wallet A → Wallet B = `Transfer`، نه Sell+Buy.**
>
> ```text
> gross source quantity
> network fee
> net transferred quantity
> destination received quantity
> ```
>
> هر چهار مفهوم در صورت نیاز قابل بازسازی‌اند (RAW روی legs).  
> `realizedPL = 0` (به‌جز fee burn طبق policy). Cost basis متناسب منتقل می‌شود — ببین Cost-Basis-Engine transfer_out/in.

#### ۲-ج) انتقال (TRANSFER)

**قرارداد ریاضی کامل (Mathematical Contract):**

```
ورودی:
 amountToSend = مقدار BTC ارسالی از مبدا (کل، قبل از کارمزد)
 feeAmount = کارمزد
 feeCurrency = BTC (از خود ارز ارسالی کسر می‌شود)

محاسبات اجباری:
 quantityDeducted = amountToSend // از مبدا همین مقدار کسر می‌شود
 quantityReceived = amountToSend - feeAmount // مقصد همین مقدار دریافت می‌کند
 feeBase = feeAmount × feeAssetPriceToBase // کارمزد به ارز پایه
 costDeducted = amountToSend × averageBuyPrice_source // هزینه‌ای که از مبدا خارج می‌شود
 costTransferred = quantityReceived × averageBuyPrice_source // هزینه‌ای که به مقصد می‌رسد
 // (فرق costDeducted - costTransferred = feeAmount × averageBuyPrice_source = هزینه‌ی BTC خودِ کارمزد)

در صرافی مبدا (transfer_out):
 holdings.quantity -= quantityDeducted (= amountToSend)
 holdings.totalInvested -= costDeducted (= amountToSend × averageBuyPrice_source)
 holdings.totalFeesPaidBase += feeBase
 averageBuyPrice بدون تغییر (فروش/انتقال averageBuyPrice را عوض نمی‌کند)

در صرافی مقصد (transfer_in):
 quantityReceived = amountToSend - feeAmount (BTC واقعاً کمتر رسیده)
 costTransferred = quantityReceived × averageBuyPrice_source (Cost Basis متناسب با BTC دریافتی)
 newQuantity = dest.quantity + quantityReceived
 newTotalInvested = dest.totalInvested + costTransferred
 newAverageBuyPrice = newTotalInvested / newQuantity (Weighted Average)
```

**مثال عددی:**
```
amountToSend = 1 BTC, feeAmount = 0.001 BTC, averageBuyPrice_source = 50,000 USDT

quantityDeducted = 1 BTC
quantityReceived = 0.999 BTC
feeBase = 0.001 × (قیمت BTC در ارز پایه)
costDeducted = 1 × 50,000 = 50,000 USDT
costTransferred = 0.999 × 50,000 = 49,950 USDT ← این است که به مقصد می‌رسد

مبدا بعد از انتقال:
 quantity : قبلی − 1 BTC
 totalInvested : قبلی − 50,000 USDT

مقصد بعد از انتقال:
 quantity : قبلی + 0.999 BTC
 totalInvested : قبلی + 49,950 USDT ← نه 50,000
 averageBuyPrice: Weighted Average جدید
```

> **چرا `costTransferred = quantityReceived × averageBuyPrice_source` و نه `costDeducted`؟**
> چون ۰.۰۰۱ BTC کارمزد به‌عنوان هزینه واقعی سوخته شد (مانند SELL با `quantity=0.001`).
> مقصد فقط ۰.۹۹۹ BTC گرفته — Cost Basis اش نسبت به همان ۰.۹۹۹ است، نه ۱.

> **چرا در انتقال `quantity` کمتر می‌شود؟**
> چون در transfer، کارمزد از **ارز ارسالی خودِ BTC** برداشته می‌شود —
> مقصد واقعاً ۰.۹۹۹ BTC دریافت کرده، نه ۱ BTC.
> در transfer معمولاً fee_from_received است. در BUY/SELL بستگی به `feePresence` دارد — نه همیشه بدون اثر روی quantity.


> **P0 — C2C یک Operation واقعی است، نه فقط SELL.**
>
> ```text
> USDT → BTC  ≠  یک SELL تنها
> Operation (یک operationId / tradeGroupId)
>    ├── Leg A  (Asset A out — e.g. SELL USDT)
>    ├── Leg B  (Asset B in  — e.g. BUY BTC)
>    └── Fee Legs
> ```
>
> مثال: Sell 1000 USDT · Receive 0.016 BTC · Fee 5 USDT  
> بدون `operationId`/`tradeGroupId` مشترک → P&L و Cost Basis بعداً می‌شکند.
>
> الگوی عمومی همه صرافی‌ها: **Operation → legs** (نه دو tx مستقل بدون لینک).

#### ۲-د) معامله رمزارز-به-رمزارز (C2C)

```
مثال: فروش ۱ ETH — خرید BTC — fee = 0.0001 BTC (feeCurrency = BTC)

رکورد SELL (ETH):
 quantity = 1 ETH ✅
 feeBase = 0.0001 × BTC_price_in_base
 realizedPL_ETH = fromTotalBase - soldPortionCost_ETH - feeBase

رکورد BUY (BTC):
 quantity = مقدار BTC دریافتی ✅
 toTotalBase = explicitSwapConsideration + capitalizedFees  /* P0-DOC-006; NOT market mark */
 holdings.quantity += مقدار BTC دریافتی ✅ (کامل، نه کسر کارمزد)
```

---

### بخش ۳ — جدول خلاصه

| `feePresence` | اثر روی quantity | اثر روی cost / P&L |
|---------------|------------------|---------------------|
| `fee_in_quote` | `netQuantity = grossQuantity` | feeBase به cost (BUY) یا از realized (SELL) |
| `fee_from_base_asset` | `netQuantity = grossQuantity − feeQuantity` | cost basis روی **net**؛ feeBase به totalFeesPaidBase |
| `fee_from_received` | مقصد کمتر می‌گیرد (transfer/C2C) | مشابه |
| `fee_external` | quantity طبق trade خالص | fee جدا در ledger/journal |

> **قانون**: Holding همیشه با **`netQuantity`** به‌روز می‌شود. فیلد `quantity` روی تراکنش = net مگر صریحاً gross جدا ذخیره شود.
> مثال: BUY 1 BTC fee 0.001 BTC → gross=1, feeQty=0.001, net=0.999 → holding += 0.999

---

### بخش ۴ — آپدیت `totalFeesPaidBase`

در **همه** عملیات، پس از محاسبه `feeBase`:
```
holding.totalFeesPaidBase += feeBase
```
این فیلد تجمعی است و هرگز کاهش نمی‌یابد (حتی در فروش).

---

## APIهای داخلی

### Exchange APIs
- `createExchange(data)`
- `updateExchange(id, data)`
- `getAllExchanges`
- `getExchangeById(id)`

### Holding APIs
- `getHoldings(exchangeId?)`
- `getHoldingByAssetKey(assetKey, exchangeId?)` / `getHoldingById(holdingId)`
- `getHoldingBySymbol` فقط برای UI جستجو — هویت اصلی `instrumentId` است (`assetKey` فقط index — CR-001)
- `getPortfolioValue(targetCurrency?)`
- **`rebuildHolding(holdingId)`** یا `rebuildHolding({ exchangeId, instrumentId }) /* CR-006; assetKey resolve→instrumentId only */` → بازسازی از ledger (نه label `symbol`)

 ```typescript
 rebuildHolding(holdingId: UUID) یا rebuildHolding({ exchangeId, instrumentId }) /* CR-006; assetKey resolve→instrumentId only */: {
 quantity: Decimal
 totalInvested: Decimal
 averageBuyPrice: Decimal
 totalFeesPaidBase: Decimal
 } {
 // تمام تراکنش‌های این symbol را به‌ترتیب تاریخ پردازش کن
 const txs = db.query(`
 SELECT type, quantity, totalAmountBase, feeAmount, feeCurrency,
 feeAssetPriceToBase, exchangeRateToBase, transferId, tradeId
 FROM inv_crypto_transactions
 WHERE holdingId = ? AND isVoided = false
 ORDER BY date ASC, createdAt ASC`, [holdingId])
 -- OR: WHERE exchangeId = ? AND instrumentId = ? [AND networkId = ?] AND isVoided = false

 let qty = new Decimal(0)
 let totalInvested = new Decimal(0)
 let totalFeesPaidBase = new Decimal(0)

 for (const tx of txs) {
 const feeBase = convertFeeToBase(tx.feeAmount, tx.feeCurrency, tx.feeAssetPriceToBase, tx.exchangeRateToBase, baseCurrency)
 totalFeesPaidBase = totalFeesPaidBase.plus(feeBase)

 if (tx.type === 'buy') {
 totalInvested = totalInvested.plus(tx.totalAmountBase).plus(feeBase)
 qty = qty.plus(tx.quantity)
 } else if (tx.type === 'sell') {
 const soldCost = tx.quantity.times(qty.isZero ? new Decimal(0) : totalInvested.dividedBy(qty))
 totalInvested = totalInvested.minus(soldCost)
 qty = qty.minus(tx.quantity)
 } else if (tx.type === 'transfer_in') {
 // Cost Basis از رکورد transfer_out متناظر خوانده می‌شود
 const outTx = db.query(`SELECT quantity, totalAmountBase FROM inv_crypto_transactions
 WHERE transferId = ? AND type = 'transfer_out' AND isVoided = false
 LIMIT 1`, [tx.transferId])[0]
 const costTransferred = outTx
 ? tx.quantity.times(outTx.totalAmountBase.dividedBy(outTx.quantity)) // proportional cost
 : tx.totalAmountBase
 totalInvested = totalInvested.plus(costTransferred)
 qty = qty.plus(tx.quantity)
 } else if (tx.type === 'transfer_out') {
 const avgBuy = qty.isZero ? new Decimal(0) : totalInvested.dividedBy(qty)
 totalInvested = totalInvested.minus(tx.quantity.times(avgBuy))
 qty = qty.minus(tx.quantity)
 }
 }

 const averageBuyPrice = qty.isZero ? new Decimal(0) : totalInvested.dividedBy(qty)
 return { quantity: qty, totalInvested, averageBuyPrice, totalFeesPaidBase }
 }
 ```

 > **نکته**: برای رمزارزهایی که از IRR/USDT خریداری شده‌اند، `totalAmountBase` رکورد تراکنش مستقیماً هزینه به ارز پایه را دارد (طبق «ارز پایه محاسبات»). این تابع فقط از آن فیلد استفاده می‌کند — نیازی به نرخ ارز تاریخی در زمان Rebuild نیست.

- **`reconcileHolding(holdingId | { exchangeId, assetKey })`** → مقایسه مقادیر فعلی Holding با نتیجه `rebuildHolding`

 ```typescript
 reconcileHolding(holdingId: UUID): // or { exchangeId, instrumentId, networkId? } {
 status: 'ok' | 'mismatch'
 fields: {
 quantity: { stored: Decimal, calculated: Decimal, match: boolean }
 totalInvested: { stored: Decimal, calculated: Decimal, match: boolean }
 averageBuyPrice: { stored: Decimal, calculated: Decimal, match: boolean }
 totalFeesPaidBase:{ stored: Decimal, calculated: Decimal, match: boolean }
 }
 }
 ```

 **در صورت Mismatch**: ثبت در audit log + هشدار کاربر + گزینه auto-fix از `rebuildHolding`.

- **`rebuildAllHoldings(exchangeId?)`** → اجرای `rebuildHolding` برای همه symbol‌های یک صرافی (یا همه صرافی‌ها اگر `exchangeId` داده نشود) و آپدیت atomic هر Holding پس از Rebuild

 **زمان استفاده الزامی**:
 - پس از هر Migration
 - پس از Import/Restore فایل دیتابیس
 - پس از هر Reversal (void) تراکنش
 - در صورت مشاهده Mismatch در `reconcileHolding`

### Transaction APIs
- `createCryptoTransaction(data)` → خرید / فروش / انتقال (تک‌رکورد)
- `createCryptoToCryptoTrade(data)` → **معامله رمزارز-به-رمزارز — الزاماً Atomic**

 این متد تنها نقطه ورود معتبر برای معامله رمزارز-به-رمزارز (قاعده ۲a) است.
 هر implementation باید **تمام ۸ مرحله زیر را در یک تراکنش دیتابیسی واحد (SQLite BEGIN/COMMIT) اجرا کند**.
 اگر هر مرحله‌ای شکست بخورد، کل تراکنش ROLLBACK می‌شود.

 **ورودی `data`**:
 ```typescript
 {
 tradeId: UUID, // از پیش ساخته‌شده توسط caller
 date: Timestamp,
 exchangeId: UUID,

 // رمزارز پرداختی (مثلاً ETH که می‌فروشیم)
 fromSymbol: string, // ETH
 fromQuantity: Decimal, // مقدار ETH که پرداخت می‌شود
 fromPriceBase: Decimal, // قیمت ۱ واحد ETH به baseCurrency در لحظه معامله
 fromPriceHistoryId: UUID, // id رکورد price_history که fromPriceBase از آن آمده

 // رمزارز دریافتی (مثلاً BTC که می‌خریم)
 toSymbol: string, // BTC
 toQuantity: Decimal, // مقدار BTC که دریافت می‌شود
 toPriceBase: Decimal, // قیمت ۱ واحد BTC به baseCurrency در لحظه معامله
 toPriceHistoryId: UUID, // id رکورد price_history که toPriceBase از آن آمده

 // کارمزد
 feeAmount: Decimal,
 feeCurrency: string,
 feeAssetPriceToBase: Decimal, // nullable — فقط اگر feeCurrency رمزارز دیگری باشد

 description: string,
 }
 ```

 **قرارداد Atomic — ۸ مرحله اجباری (داخل یک SQLite transaction)**:

 ```
 BEGIN TRANSACTION;

 ── مرحله ۱: محاسبه مقادیر ──────────────────────────────────────────
 feeBase = convertFeeToBase(feeAmount, feeCurrency, feeAssetPriceToBase)
 fromTotalBase = fromQuantity × fromPriceBase
 toTotalBase = explicitSwapConsideration + capitalizedFees // P0-DOC-006 economic_trade_or_swap only

 ── مرحله ۲: بررسی موجودی کافی (Guard) ──────────────────────────────
 fromHolding = SELECT * FROM inv_crypto_holdings WHERE id=? /* holdingId */ FOR UPDATE
 IF fromHolding.quantity < fromQuantity → ROLLBACK + خطا «موجودی کافی نیست»

 ── مرحله ۳: محاسبه Realized P&L برای رمزارز پرداختی ────────────────
 soldPortionCost = fromQuantity × fromHolding.averageBuyPrice
 realizedPL_from = fromTotalBase - soldPortionCost - feeBase

 ── مرحله ۴: ثبت رکورد SELL در inv_crypto_transactions ──────────────
 INSERT inv_crypto_transactions (
 type='sell', symbol=fromSymbol, quantity=fromQuantity,
 price=toQuantity/fromQuantity, // نرخ مستقیم به واحد toSymbol
 currency=toSymbol,
 priceBase=fromPriceBase, totalAmountBase=fromTotalBase,
 feeAmount, feeCurrency, feeAssetPriceToBase,
 tradeId, exchangeId, date
 )

 ── مرحله ۵: آپدیت Holding رمزارز پرداختی ──────────────────────────
 UPDATE inv_crypto_holdings SET
 quantity = fromHolding.quantity - fromQuantity,
 totalInvested = fromHolding.totalInvested - soldPortionCost,
 totalFeesPaidBase = fromHolding.totalFeesPaidBase + feeBase
 -- averageBuyPrice بدون تغییر (فروش averageBuyPrice را تغییر نمی‌دهد)
 WHERE id = fromHolding.id

 ── مرحله ۶: ثبت رکورد BUY در inv_crypto_transactions ───────────────
 INSERT inv_crypto_transactions (
 type='buy', symbol=toSymbol, quantity=toQuantity,
 price=fromQuantity/toQuantity, // نرخ معکوس
 currency=fromSymbol,
 priceBase=toPriceBase, totalAmountBase=toTotalBase,
 feeAmount=0, feeCurrency=null, // کارمزد کامل در رکورد SELL لحاظ شده
 tradeId, exchangeId, date
 )

 ── مرحله ۷: آپدیت Holding رمزارز دریافتی (Weighted Average) ────────
 toHolding = SELECT * FROM inv_crypto_holdings WHERE id=? /* holdingId */ OR (exchangeId=? AND instrumentId=?)
 IF toHolding EXISTS:
 newQuantity = toHolding.quantity + toQuantity
 newTotalInvested = toHolding.totalInvested + toTotalBase
 newAvgBuyPrice = newTotalInvested / newQuantity
 UPDATE inv_crypto_holdings SET
 quantity=newQuantity, totalInvested=newTotalInvested, averageBuyPrice=newAvgBuyPrice
 WHERE id = toHolding.id
 ELSE:
 INSERT inv_crypto_holdings (
 exchangeId, symbol=toSymbol, quantity=toQuantity,
 averageBuyPrice=toPriceBase, totalInvested=toTotalBase, totalFeesPaidBase=0
 )

 ── مرحله ۸: ذخیره Realized P&L (اختیاری اما توصیه‌شده) ────────────
 -- realizedPL_from را در inv_crypto_transactions رکورد SELL ذخیره کن
 -- (یا در یک جدول جداگانه اگر نیاز به گزارش تاریخی دارید)

 COMMIT;
 ```

 > **نکته پیاده‌سازی SQLite**: SQLite به‌صورت پیش‌فرض autocommit است. برای اجرای atomic، حتماً از `db.run('BEGIN')` / `db.run('COMMIT')` / `db.run('ROLLBACK')` استفاده کنید — یا از wrapper library‌ای که transaction را expose می‌کند (مثل `better-sqlite3` که synchronous است و transaction را نیتیو پشتیبانی می‌کند).

 > **قانون طلایی**: هیچ‌کدام از ۸ مرحله بالا نباید خارج از این transaction اجرا شود. حتی اگر فقط مرحله ۷ (آپدیت Holding مقصد) fail شود، باید همه چیز rollback شود — وگرنه ETH از Holding کسر شده اما BTC به Holding اضافه نشده: دارایی کاربر از بین رفته.
 - برای `type=transfer_out`/`transfer_in` (انتقال بین صرافی‌های خودی — **الزاماً Atomic در یک SQLite Transaction**):

 **قرارداد ۵ مرحله‌ای (همه یا هیچ):**
 ```
 BEGIN TRANSACTION;

 ── مرحله ۱: Guard — بررسی موجودی کافی در مبدا ──────────────────────
 srcHolding = SELECT * FROM inv_crypto_holdings
 WHERE exchangeId=sourceExchangeId AND symbol=? FOR UPDATE
 IF srcHolding.quantity < amountToSend → ROLLBACK + خطا «موجودی کافی نیست»

 ── مرحله ۲: محاسبات ────────────────────────────────────────────────
 quantityReceived = amountToSend - feeAmount // BTC دریافتی مقصد
 feeBase = feeAmount × feeAssetPriceToBase // کارمزد به ارز پایه
 costDeducted = amountToSend × srcHolding.averageBuyPrice // هزینه خارج‌شده از مبدا
 costTransferred = quantityReceived × srcHolding.averageBuyPrice // هزینه رسیده به مقصد

 ── مرحله ۳: آپدیت Holding مبدا ─────────────────────────────────────
 UPDATE inv_crypto_holdings SET
 quantity = srcHolding.quantity - amountToSend,
 totalInvested = srcHolding.totalInvested - costDeducted,
 totalFeesPaidBase = srcHolding.totalFeesPaidBase + feeBase
 -- averageBuyPrice بدون تغییر
 WHERE id = srcHolding.id

 ── مرحله ۴: ثبت دو رکورد transfer_out و transfer_in ────────────────
 INSERT inv_crypto_transactions (type='transfer_out', exchangeId=source, quantity=amountToSend,
 feeAmount, feeCurrency, feeAssetPriceToBase, transferGroupId, counterExchangeId=dest, ...)
 INSERT inv_crypto_transactions (type='transfer_in', exchangeId=dest, quantity=quantityReceived,
 feeAmount=0, feeCurrency=null, transferGroupId, counterExchangeId=source, ...)

 ── مرحله ۵: آپدیت Holding مقصد (Weighted Average) ──────────────────
 destHolding = SELECT * FROM inv_crypto_holdings WHERE exchangeId=destExchangeId AND symbol=?
 IF destHolding EXISTS:
 newQuantity = destHolding.quantity + quantityReceived
 newTotalInvested = destHolding.totalInvested + costTransferred
 UPDATE inv_crypto_holdings SET
 quantity=newQuantity, totalInvested=newTotalInvested,
 averageBuyPrice=newTotalInvested/newQuantity
 WHERE id = destHolding.id
 ELSE:
 INSERT inv_crypto_holdings (exchangeId=dest, symbol, quantity=quantityReceived,
 averageBuyPrice=srcHolding.averageBuyPrice, totalInvested=costTransferred, totalFeesPaidBase=0)

 COMMIT;
 ```
- `createExchangeTransaction(data)` → واریز/برداشت بین حساب بانکی و صرافی — **توالی اجباری (atomic)**:

 **برداشت از صرافی به حساب بانکی** (`type='withdraw'`):
 > 1. رکورد در `inv_crypto_exchange_transactions` با `type='withdraw'` ثبت شود
 > 2. رکورد در `acc_transactions` با `type='withdrawal-investment'` و `relatedFeature='crypto_exchange'` ثبت شود
 > 3. **`inv_crypto_holdings` برای `(exchangeId, symbol=ارز برداشتی)` آپدیت شود**: `quantity -= amount` (و اگر `quantity <= 0` رکورد holding غیرفعال یا حذف شود)
 > 4. اگر نقد صرافی است: آپدیت **`inv_crypto_cash`** (CashPosition) — نه `inv_crypto_holdings` با symbol ساختگی
 >
 > ⛔ **ممنوع**: ثبت withdraw بدون آپدیت `inv_crypto_holdings` — موجودی نقدی صرافی اشتباه می‌شود

 **واریز از حساب بانکی به صرافی** (`type='deposit'`):
 > 1. رکورد در `inv_crypto_exchange_transactions` با `type='deposit'` ثبت شود
 > 2. رکورد در `acc_transactions` با `type='deposit-investment'` و `relatedFeature='crypto_exchange'` ثبت شود
 > 3. **`inv_crypto_holdings` برای `(exchangeId, symbol=ارز واریزی)` آپدیت شود**: `quantity += amount` (اگر رکورد وجود نداشت، ایجاد شود)
 > 4. واریز نقد به **`inv_crypto_cash`**: cost basis طبق economicKind؛ par=1 فقط اگر policy صریح cash_like_par
- `getCryptoTransactions(filters)` → شامل `type` برای تشخیص
- `getExchangeTransactions(filters)` → برای واریز/برداشت
- `calculateProfitLoss(symbol?, exchangeId?)`

---

## روابط با سایر فیچرها

- **Accounts & Banking**: واریز و برداشت + لینک تراکنش‌ها
- **Currency & Multi-Currency**: نرخ تبدیل لحظه‌ای
- **Reports** و **Dashboard**: ارزش پرتفوی و سود/زیان
- **Portfolio & Wealth Overview**: تأمین داده رمزارز

---

---

## منطق محاسبه سود/زیان تحقق‌یافته (Realized P&L)

فرمول رسمی و تنها فرمول معتبر برای `calculateProfitLoss` و به‌روزرسانی Holding هنگام خرید/فروش:

**هنگام خرید** (Weighted Average):
```
newTotalInvested = totalInvested + (quantityBought × price) + feeAmount(به ارز پایه)
newQuantity = quantity + quantityBought
newAverageBuyPrice = newTotalInvested / newQuantity
```

**هنگام فروش** (`averageBuyPrice` استفاده‌شده = میانگین خرید **قبل از این فروش**، یعنی همان مقدار فعلی Holding پیش از هر تغییر):
```
soldPortionCost = quantitySold × averageBuyPrice
realizedPL = saleProceeds - soldPortionCost - feeAmount(به ارز پایه)
totalInvested -= soldPortionCost // کاهش متناسب با بخش فروخته‌شده
quantity -= quantitySold
averageBuyPrice بدون تغییر می‌ماند // Weighted Average فقط با خرید جدید تغییر می‌کند، نه با فروش
```

> **نکات الزامی**:
> - تمام محاسبات بالا باید با `decimal.js` انجام شوند (هرگز `Number`)، مطابق «قانون Minor Unit Storage» در `db.md`.
> - `feeAmount` باید طبق فرمول بخش «منطق کارمزد» (بالاتر در همین فایل) ابتدا به ارز پایه تبدیل و سپس در `realizedPL` کسر شود.
> - `calculateProfitLoss(symbol?, exchangeId?)` مجموع `realizedPL` تمام تراکنش‌های فروش (از لاگ `inv_crypto_transactions` با `type=sell`) را برمی‌گرداند؛ سود/زیان **تحقق‌نیافته** (Unrealized) جداگانه و بر اساس `(currentPrice - averageBuyPrice) × quantity` محاسبه می‌شود و نباید با Realized P&L مخلوط شود.
> - در `transfer_out`/`transfer_in` بین صرافی‌های خودی، هیچ `realizedPL`ای ایجاد نمی‌شود (فروش واقعی نیست)؛ فقط `quantity` بین دو Holding جابه‌جا می‌شود و `averageBuyPrice` مقصد باید Weighted Average بین موجودی قبلی مقصد (اگر بود) و مقدار انتقالی با همان `averageBuyPrice` مبدأ باشد.

---

## نکات طراحی

- میانگین خرید با فرمول Weighted Average به‌روزرسانی می‌شود.
- `inv_crypto_transactions` و `inv_crypto_exchange_transactions` فقط لاگ هستند.
- موجودی و میانگین خرید و مجموع کارمزدها در جدول `inv_crypto_holdings` نگهداری می‌شود.
- قیمت لحظه‌ای رمزارزها می‌تواند از API خارجی + کش آفلاین تأمین شود.

> **نکته مهم**: موجودی نقدی ریال/تتر هر صرافی/ولت از طریق جدول `inv_crypto_holdings` با `symbol=IRR` یا `symbol=USDT` مدیریت می‌شود. این یک تصمیم طراحی عمدی است که به جای ایجاد یک جدول جداگانه، از ساختار موجود استفاده می‌کند. ~~par=1 همیشه~~ منسوخ — CashPosition جدا؛ USDT سرمایه‌گذاری = Asset با cost واقعی.

---

## هویت قیمت‌گیری دارایی کریپتو

`DISTINCT symbol` به‌تنهایی برای Fetch قیمت **کافی نیست**.

### قوانین
1. مسیر قیمت از `assetKey` / (`chainId` + `contractAddress` یا native) استفاده می‌کند، نه فقط `symbol`.
2. `price_history.symbol` برای کریپتو می‌تواند همان `assetKey` باشد (مثلاً `1:0xdac17f...` برای USDT-ERC20، `728126428:native:USDT` یا قرارداد TRC20).
3. `assetId` (شناسه Provider) روی Holding برای نگاشت به CoinGecko/Nobitex؛ اگر null، Adapter با `normalizeSymbol` از assetKey استفاده می‌کند.
4. USDT-TRC20 و USDT-ERC20 دو قیمت/دو Holding جدا هستند مگر Provider صراحتاً یک قیمت واحد بدهد و کاربر همان را بخواهد (پیش‌فرض: جدا).

`19-01-Crypto-Prices` باید `DISTINCT assetKey` (یا معادل chain+contract) از holdings بگیرد، نه فقط `symbol`.

---

## تفکیک Cash Movement و On-chain Transfer

`inv_crypto_exchange_transactions` **فقط** برای جریان نقدی فیات/استیبل **مرتبط با حساب بانکی** است (Bank ↔ Exchange cash):

| فیلد مرتبط | نقش |
|------------|-----|
| `accountId` / `accountTransactionId` | لینک اجباری به بانک |
| `type` | deposit / withdraw |
| مبالغ ریال/USDT | |

**On-chain / wallet transfer** در `inv_crypto_transactions` با `type = transfer_in | transfer_out` مدل می‌شود:

| فیلد | نقش |
|------|-----|
| `networkId` | FK به `inv_crypto_wallet_networks` (نه string آزاد — ) |
| `txHash`, `blockNumber`, `confirmations` | فقط اینجا |
| `transferGroupId` | جفت in/out |
| بدون `accountId` بانکی اجباری | مگر پل fiat همزمان |

جریان‌ها:
| سناریو | جداول |
|--------|--------|
| Bank → Exchange | `acc_transactions` + `inv_crypto_exchange_transactions` |
| Exchange → Bank | همین |
| Wallet → Wallet / Exchange on-chain | فقط `inv_crypto_transactions` (transfer_*) |
| Buy/Sell روی صرافی | `inv_crypto_transactions` (+ در صورت نیاز کاهش USDT/IRR holding) |

فیلدهای `network`/`txHash` روی جدول exchange cash **deprecate** می‌شوند اگر هنوز در متن باشند؛ نباید مدل واحد Wallet و Bank باشند.

---

## networkId روی Transaction

- Holding: `networkId` → FK `inv_crypto_wallet_networks`
- Transaction (transfer/buy on wallet): همان `networkId` FK
- **ممنوع**: فیلد متنی آزاد `network` با مقادیر `TRC20`/`TRON`/`tron`
- نمایش UI از entity شبکه (`name`, `chainId`) می‌آید

---

## قرارداد Fee و Quantity / Cost Basis

### حالت‌ها
1. **Fee به quote (IRR/USDT/دیگر غیر از خود asset)** 
 - `quantity` = مقدار دارایی دریافت/واگذارشده 
 - `totalInvested += quantity × price + feeInQuote` (پس از تبدیل fee به currency سرمایه‌گذاری با نرخ همان تراکنش)

2. **Fee از خود asset کسر می‌شود** (`feeCurrency === symbol` دارایی) 
 - `grossQuantity` = مقدار قبل از fee (اختیاری ذخیره) 
 - `feeQuantity` = مقدار fee به واحد asset 
 - `quantity` (net) = gross − fee برای buy دریافتی؛ برای sell مقدار فروخته‌شده جدا از fee شبکه 
 - Cost basis روی **net quantity** محاسبه می‌شود مگر مستند lot خلاف بگوید 
 - `totalInvested` برای buy: هزینه quote پرداختی (بدون دوبار شمردن fee asset به‌عنوان quote)

3. همیشه در تراکنش ذخیره شود: `feeAmount`, `feeCurrency`, و در صورت fee-in-asset: `feeQuantity` 
4. Reconcile: `Σ quantity effects` با holding؛ fee-in-asset باید در ledger quantity دیده شود.

فرمول Average Buy فقط با quantity **خالص** و cost **سازگار با همان quantity** اجرا شود؛ در غیر این صورت Unrealized P&L منحرف می‌شود.

> Fetch قیمت باید `assetId` و mapping Provider روی Holding را مصرف کند (از طریق PriceAssetRef)، نه فقط symbol.

---

## Trade Model عمومی کریپتو

Valuation با `priceCurrency` (اغلب USDT در price_history) **جدا** از مدل معامله است.

### فیلدهای معامله (`inv_crypto_transactions`)

| فیلد | نقش |
|------|-----|
| `baseAsset` / `symbol` | دارایی اصلی (BTC, ETH, …) |
| `quoteAsset` | ارز قیمت‌گذاری معامله (USDT, USDC, IRR, EUR, BTC, …) |
| `settlementAsset` | nullable — اگر تسویه با چیزی غیر از quote باشد |
| `grossQuantity` | مقدار پایه قبل از fee |
| `netQuantity` | مقدار مؤثر روی holding |
| `feeQuantity` | مقدار fee به واحد fee asset |
| `feeCurrency` | دارایی کارمزد |
| `feePresence` | enum بالا |
| `quoteAmount` | مبلغ quote پرداخت/دریافت‌شده |
| `price` | قیمت: quote per 1 base |
| `exchangeRateToBase` | quote (یا settlement) → baseCurrency کاربر |

نمونه‌های مجاز بدون ابهام:
- BTC/USDT, BTC/USDC, BTC/IRR, BTC/EUR
- ETH/BTC, SOL/ETH (C2C: دو رکورد linked با `tradeGroupId`)

### قیمت‌گیری (Price Fetching)
- `price_history` می‌تواند هنوز جفت‌های رایج (مثلاً */USDT) را برای **valuation** نگه دارد.
- معامله با quote دیگر: `price` و `quoteAmount` از خود trade؛ تبدیل به base با `exchangeRateToBase` یا مسیر quote→USDT→base در صورت نیاز.
- **ممنوع**: فرض اینکه هر trade فقط USDT است.

### C2C
`tradeGroupId` مشترک روی SELL(base1) + BUY(base2)؛ quote می‌تواند دارایی سوم باشد.

---

## Asset Registry هویت

```text
Canonical identity = ref_instruments.id  (instrumentId)
assetKey           = convenience index only (derived from chain+contract / native)
symbol             = label only
providerInstrumentId / assetId (provider) = mapping aid, not PK
```

قوانین (هم‌راستا با `Instrument-Identity.md` و `Field-Level-Data-Ownership-Matrix.md`):
1. هر Holding و هر Transaction **الزاماً** `instrumentId` (FK → `ref_instruments.id`) دارد.
2. `assetKey` اختیاری/ایندکس است؛ **نه** SoT هویت و نه جایگزین instrumentId.
3. Fallback قیمت‌گیری به `symbol` تنها **ممنوع** است.
4. اگر Provider فقط symbol می‌فهمد، Adapter از `instrumentId` → meta/`assetKey` → `providerSymbol` mapping می‌سازد؛ Application هرگز با symbol خام به‌عنوان identity fetch نمی‌کند.
5. USDT-ERC20 و USDT-TRC20 = دو `ref_instruments` جدا = دو instrumentId.
6. موجودی location روی Holding است: `exchangeId` + اختیاری `networkId` — نه روی تعریف instrument.
7. IRR/USDT **cash** صرافی در `inv_crypto_cash` است نه به‌عنوان asset identity موازی در holdings با symbol خام.

---

## C2C Gross / Net کامل

هر پایه C2C دو رکورد با `tradeGroupId`/`tradeId` مشترک دارد. برای **عدم از دست رفتن داده**:

### روی رکورد SELL (fromAsset)
| فیلد | معنی |
|------|------|
| `grossQuantity` | مقدار from فروخته‌شده |
| `netQuantity` | معمولاً = gross مگر fee از from |
| `quoteAmount` | ارزش به quote میانی یا to |
| `feePresence` / `feeQuantity` / `feeCurrency` | اگر fee روی پایه from باشد |

### روی رکورد BUY (toAsset)
| فیلد | معنی |
|------|------|
| `grossQuantity` | مقدار to قبل از کسر fee (اگر fee از to باشد) |
| `feeQuantity` | کارمزد به واحد to یا fee asset |
| `netQuantity` | مقدار واقعی اضافه‌شده به holding (**الزامی**) |
| `quoteAmount` | مبلغ پرداختی معادل |

قوانین:
1. اگر فقط «quantity = مقدار دریافتی» ذخیره شود بدون gross/fee جدا، **بازسازی trade خام ناقص است** — هر سه فیلد وقتی fee روی leg مربوطه است الزامی‌اند.
2. `netQuantity` مبنای holding؛ `grossQuantity` و `feeQuantity` برای audit و reconcile.
3. `feeBase` و journal entry fee برای هر leg که fee دارد.

---



### ماتریس تصمیم `feePresence` (الزامی برای پیاده‌سازی)

| mode | quantity روی holding | cost basis | مثال |
|------|----------------------|------------|------|
| `fee_in_quote` | `net = gross` (دارایی پایه کم نمی‌شود) | `+ feeBase` به totalInvested در BUY؛ در SELL از proceeds | خرید 1 BTC، fee 10 USDT |
| `fee_from_base_asset` | `net = gross - feeQuantity` | BUY: cost روی **net** یا gross طبق صرافی — **پیش‌فرض پروژه: holding += netQuantity؛ totalInvested += quoteSpent + feeBase** | صرافی 1 BTC می‌خرد ولی 0.001 fee از BTC → holding +0.999 |
| `fee_from_received` | مقصد `net` می‌گیرد | مثل transfer | transfer 1 → receive 0.999 |
| `fee_external` | `net = gross` | fee در trade جدا یا `fee_payment` | کارمزد بانکی جدا |

**تضاد با متن قدیمی «همیشه quantity=1»**: آن متن فقط برای حالتی است که صرافی **کل 1 BTC را به کیف می‌دهد و fee را از quote می‌گیرد** (`fee_in_quote`). اگر fee از base asset باشد، **باید** `feePresence=fee_from_base_asset` و `netQuantity` ثبت شود — در غیر این صورت موجودی و P&L غلط می‌شود.

فیلدهای اجباری در هر trade با fee: `feePresence`, `grossQuantity`, `feeQuantity`, `netQuantity`.

## راهنمای پیاده‌سازی

### APIهای معامله (همه Atomic + journal + persist)
| API | اثر |
|-----|------|
| `executeBuy` / `executeSell` | یک `inv_crypto_transactions` + به‌روز holding + optional cash holding IRR/USDT + optional `acc_transactions` اگر از بانک |
| `executeC2C` | دو رکورد با `tradeGroupId` + gross/net/fee هر leg |
| `executeTransfer` | transfer_out + transfer_in با `transferGroupId`؛ fee network طبق `feePresence` |
| `depositCash` / `withdrawCash` | فقط Bank↔Exchange در `inv_crypto_exchange_transactions` + `acc_transactions` |

### ترتیب مشترک
```text
validate holdings / balances / feePresence fields
BEGIN
  write domain txs (with instrumentId, optional assetKey index, quoteAsset, gross/net/fee quantities)
  update holdings by netQuantity
  totalFeesPaidBase += feeBase
  fin_journal_entries
  optional acc_transactions
COMMIT → persist → UI success
```

### Invariants
- `instrumentId` NOT NULL (FK → ref_instruments) + UNIQUE(exchangeId, instrumentId) یا UNIQUE(exchangeId, networkId, instrumentId)
- Holding quantity هرگز از net effects منفی نشود
- Price fetch فقط با instrumentId (mapping به provider از meta)
- rebuild/reconcile با holdingId یا (exchangeId, instrumentId) — نه symbol تنها

### تست حداقل
1. BUY با fee_in_quote و fee_from_base_asset  
2. SELL + realized PL  
3. Transfer با fee 0.001 از asset (کل موجودی کاربر کم می‌شود)  
4. C2C با gross/net روی BUY leg  
5. USDT-ERC20 vs USDT-TRC20 دو holding جدا

---

## Canonical Crypto Asset Registry

**تنها registry هویت:** `ref_instruments` (Core). جدول موازی `inv_crypto_assets` به‌عنوان SoT **ممنوع**.

| لایه | نقش |
|------|-----|
| `ref_instruments.id` | **instrumentId** — هویت Canonical |
| `inv_crypto_instrument_meta` | chainId, contractAddress, decimals, standard — FK به instrumentId |
| `externalRef.assetKey` یا ستون ایندکس | `chainId:contract` / `chainId:native:SYMBOL` — convenience فقط |

Holding:
```text
holding → instrumentId (FK اجباری) + exchangeId + networkId?
USDT-TRC20 و USDT-ERC20 = دو instrumentId متفاوت = دو holding مجاز
```

### جداسازی Asset / Network / Address
| مفهوم | جدول/فیلد |
|--------|-----------|
| Asset (identity) | `ref_instruments.id` / instrumentId |
| Network | `inv_crypto_wallet_networks` / chainId |
| Address | `inv_crypto_wallet_addresses` |
| Transfer validation | from/to network + **همان instrumentId**؛ txHash per network |

Deposit/Withdraw/Transfer **بدون** networkId معتبر (برای on-chain) رد می‌شوند.
قیمت‌گیری و P&L همیشه روی `instrumentId` (نه `symbol` خام؛ assetKey فقط کمک mapping).

---

## Cost Basis در C2C

برای `SELL ETH` + `BUY BTC` با `tradeGroupId` مشترک در یک atomic op:

```text
sourceCostReleased = netQty_ETH_sold × avgBuy_ETH   // از holding ETH
feeBaseTotal = Σ feeInBase روی هر دو leg (طبق feePresence هر leg)
economicValueOut = sourceCostReleased + fees_allocated_to_disposal
// مقصد:
BTC_totalInvested += economicValueOut   // نه «قیمت لحظه‌ای USD» مگر quote به base قفل شود
BTC_qty += netQty_BTC
avg_BTC = BTC_totalInvested / BTC_qty
```

اگر معامله ETH/BTC است و قیمت USDT جدا نیست:
- `totalAmountBase` روی SELL = `sourceCostReleased` (انتقال cost)
- یا اگر کاربر/قیمت quote میانی بدهد: `quoteAmount` × `exchangeRateToBase` قفل‌شده در همان op
- **ممنوع:** rebuild بعدی با latest USDT/IRR برای همان trade تاریخی

### تخصیص Fee در C2C
| feePresence روی leg | تعلق حسابداری | اثر Cost Basis |
|---------------------|----------------|----------------|
| SELL + fee_from_base_asset | SELL leg | fee در disposal؛ از proceeds اقتصادی کم یا به cost released اضافه |
| BUY + fee_from_received | BUY leg | net qty کمتر؛ fee در cost مقصد |
| fee_in_quote روی یک leg | همان leg | به cost مقصد یا کاهش proceeds طبق جهت |
| fee_external | transaction-level journal `trading_fee` | معمولاً expense؛ نه qty |

هر leg فیلدهای `grossQuantity` / `feeQuantity` / `netQuantity` / `feePresence` خودش را دارد.

---

## قیود Reversal (Crypto)

```text
CHECK: isReversal=true ⇒ reversedTxId IS NOT NULL
CHECK: reversedTxId set ⇒ target.isVoided=true پس از COMMIT
هر tx حداکثر یک reversal موفق (unique reversedTxId)
isReversal=true ⇒ خود آن ردیف دوباره reverse نمی‌شود (بازگشت فقط با correcting trade جدید)
```

زنجیره ممنوع: Original → Reversal → Reversal-of-Reversal.

### Journal همراه Reversal
همان `operationId` reversal:
1. void/flag journal entries مربوط به `operationId` اصلی (`isVoided=true`) **یا**
2. درج ردیف‌های journal معکوس (debit/credit جابه‌جا) با `reversesOperationId`

Domain void بدون journal reverse = **باگ**؛ atomic op باید هر دو را انجام دهد سپس rebuild holding.

---

## Transfer بدون Realized P&L

انتقال داخلی بین والت/صرافی **خود کاربر** (همان economic owner):

```text
realizedPL = 0
```

- cost basis متناسب از مبدأ به مقصد منتقل می‌شود (CostBasisEngine `transfer_out` / `transfer_in`)
- **network fee** اگر از asset کم شود: کاهش quantity کل + journal `trading_fee` / asset loss — **نه** فروش به قیمت بازار
- ممنوع: ثبت disposal با `unitPrice = market` فقط به‌خاطر transfer

همین اصل برای جابه‌جایی سهام بین کارگزاری‌های خود کاربر (در صورت پشتیبانی) و فلز بین پلتفرم‌های خودی صدق می‌کند مگر documentation صریح خلاف بگوید.

---

## feeInBase و baseCurrency دلخواه

```text
feeInBase = convert(feeAmount, feeCurrency → user.baseCurrency, asOf=tx time)
```

**ممنوع:** فرض «اگر USDT است و IRR است پس نرخ خاص» به‌عنوان تنها مسیر.  
`feeAssetPriceToBase` / هر نرخ کمکی فقط cache همان convert است و برای **هر** جفت (USDT→EUR، BTC→USD، …) معتبر است.

---

## Reversal انتقال با Fee

اگر transfer:
```text
out = gross, in = net, feeQty = gross - net (burn)
```
Reversal atomic باید:
1. void/معکوس out و in
2. **بازگرداندن fee burn** به quantity مبدأ (یا leg صریح `fee_reversal`) تا Σ quantity به state پیش از transfer برگردد
3. journal معکوس fee

بدون leg کارمزد، state اولیه بازیابی نمی‌شود.

---

## Asset در برابر Currency (Crypto)

| | Currency (`cur_currencies`) | Asset (`assetKey` / instrument) |
|--|------------------------------|----------------------------------|
| مثال | IRR, USD, USDT به‌عنوان واحد پول | USDT-TRC20, USDT-ERC20, BTC native |
| feeCurrency | کد Currency | — |
| Holding | — | instrumentId اجباری؛ assetKey اختیاری mapping |
| قیمت | quoteCurrency روی price row | instrumentId = ref_instruments.id؛ assetKey فقط mapping |

موجودی «تتر روی شبکه» = **Asset**؛ تسویه «مبلغ به USDT» = **Currency** در فیلدهای amount.

### API هویت
همه APIهای دامنه/قیمت کریپتو: **`instrumentId` یا holdingId**؛ `assetKey` فقط lookup/provider — نه `symbol` خام.  
`symbol` فقط label در UI و فیلد نمایشی.

### نام‌گذاری C2C
فیلد canonical: **`tradeGroupId`**.  
`tradeId` در متون قدیمی = همان tradeGroupId (alias). کد جدید فقط `tradeGroupId` بنویسد.

---

# قرارداد Canonical کریپتو (بر هر بخش متناقض مقدم است)

## 1. هویت
- Holding / rebuild / ledger filter: **`exchangeId + assetKey`** (یا `holdingId`)
- `symbol` فقط label — هرگز در WHERE rebuild
- `instrumentId` قیمت = `assetKey`

## 2. Schema تراکنش (فیلدهای الزامی)

| فیلد | نقش |
|------|-----|
| `assetKey` | هویت دارایی این leg |
| `type` | buy/sell/transfer_*/… |
| `grossQuantity` | مقدار قبل از fee از asset |
| `feeQuantity` | مقدار fee اگر از همان asset |
| `netQuantity` | بعد از fee از asset — **Holding با این عوض می‌شود** |
| `quantity` | **alias = netQuantity** برای سازگاری؛ کد جدید netQuantity بنویسد |
| `quoteAmount` | مبلغ quote leg |
| `price` | قیمت واحد به quote |
| `feeAmount` + `feeCurrency` + `feePresence` | کارمزد |
| `totalAmountBase` | ارزش اقتصادی این leg به **baseCurrency** در لحظه tx (قفل‌شده) |
| `exchangeRateToBase` | **1 unit of transaction/quote currency = X base** (direction canonical) |
| `tradeGroupId` | C2C و multi-leg — **تنها نام**؛ `tradeId` ممنوع در کد جدید |
| `transferGroupId` | جفت transfer |

## 3. Quantity و Fee — یک قانون

```text
Holding.quantity همیشه Σ netQuantity (با علامت type)
fee_in_quote:     net = gross; fee از quote
fee_from_base_asset / fee_from_received:
  net = gross - feeQuantity
  Holding += net روی BUY؛ روی transfer_out کم می‌شود gross یا طبق feePresence مستند همان tx
```

هر متن قدیمی «BUY 1 + fee 0.001 BTC ولی holding=1» فقط برای **fee_in_quote** یا fee از quote است — نه fee_from_base_asset.

## 4. C2C Cost Basis (یک فرمول)

```text
releasedCost = cost basis آزادشده از SELL leg (از avg×qty نه market)
destCost = releasedCost + feeInBase تخصیص‌یافته به acquisition
BUY leg totalInvested += destCost
```
**ممنوع** به‌عنوان تنها قانون: `toTotalBase = fromTotalBase + feeBase` وقتی fromTotalBase = market value نه cost.
`totalAmountBase` روی SELL برای C2C داخلی باید **released cost** را منعکس کند (یا فیلد جدا `transferredCost`).

## 5. Transfer

```text
realizedPL = 0
costOut proportional از totalInvested مبدأ
costIn = همان cost (نه mark-to-market)
fee_burn: event جدا؛ reversal باید fee_burn را هم برگرداند
```

## 6. fee → base

```text
if feeCurrency === baseCurrency: feeInBase = feeAmount
else: feeInBase = convert(feeAmount, feeCurrency, baseCurrency, asOf)
```
شرط IRR/USDT حذف شد.

## 7. Cash vs Asset

| مفهوم | ذخیره |
|--------|--------|
| موجودی نقد صرافی به Currency C | Holding با `assetKey = exchange:{id}:cash:{C}` یا جدول cash جدا — **نه** قاطی با token chain |
| USDT-TRC20 | assetKey زنجیره |
| واحد پول USDT در feeCurrency | Currency registry |

## 8. exchangeRateToBase
همیشه: **چند واحد base per 1 واحد ارز مبدأ نرخ** (یا معکوس مستند در Currency-CrossRate با یک convention سراسری). همه featureها یک direction.

---

## Reversal فقط از Core

**ممنوع** پیاده‌سازی مستقل void+insert بدون journal.

```text
reverseCryptoOperation(operationId) 
  → core.reverseOperation(operationId)
  → adapter Crypto: plan domain inverse rows by assetKey (نه symbol)
  → journal reverse / void
  → rebuild holdings by assetKey
```

هر transfer با `transferGroupId` + **`operationId` یکسان** روی هر دو leg (+ fee_burn leg).  
`transferId` فقط alias خواندن legacy در migration.

نمونه Reversal transfer:
```text
1. core loads operationId (همه rows: transfer_out, transfer_in, fee_burn)
2. void domain rows / insert inverse with new operationId, reversesOperationId
3. journal inverse
4. rebuildHolding({exchangeId, assetKey}) for both sides
```

---

## Internal در برابر External Transfer

### تفکیک اجباری

| kind | معنی | ردیف‌ها | counterparty |
|------|------|---------|--------------|
| `internal_transfer` | هر دو طرف **مالک کاربر** (exchange/wallet در سیستم) | `transfer_out` + `transfer_in` + optional fee_burn | `counterExchangeId` پر |
| `external_outflow` | خروج به آدرس/صرافی **خارج از سیستم** | فقط `transfer_out` (یا type صریح `external_send`) | `counterExchangeId` **null**؛ `externalAddress` / `externalLabel` |
| `external_inflow` | ورود از خارج | فقط `transfer_in` (یا `external_receive`) | null؛ `externalAddress` / `externalLabel` |

فیلدها:
```text
transferScope: 'internal' | 'external'
externalAddress?: string
externalLabel?: string  // "friend", "exchange-binance-other", …
economicKind?: 'self_custody_move' | 'gift_in' | 'gift_out' | 'income' | 'expense' | 'unknown_acquisition' | 'unknown_disposal' | 'bridge'
```

### Cost Basis

| kind | اثر |
|------|-----|
| internal | PL=0؛ cost منتقل out→in |
| external_outflow + gift_out / expense | disposal با cost آزادشده؛ realized یا expense طبق economicKind |
| external_outflow + unknown_disposal | disposal at cost (یا user-entered proceeds اگر فروش خارج سیستم) |
| external_inflow + income | acquisition با cost = fair value user-entered یا 0 طبق policy |
| external_inflow + gift_in | acquisition cost 0 یا FMV (تنظیمات مالیات) |
| external_inflow + unknown_acquisition | **کاربر باید cost basis وارد کند** — بدون حدس market اجباری |

Deposit از صرافی خارجی به wallet خودی در سیستم: اگر مبدأ در app نیست → `external_inflow`؛ اگر هر دو exchange در app هستند → `internal_transfer`.

### API
```text
executeInternalTransfer({ fromExchangeId, toExchangeId, assetKey, gross, fee… })
executeExternalSend({ fromExchangeId, assetKey, gross, fee, externalAddress, economicKind })
executeExternalReceive({ toExchangeId, assetKey, net, costBasis?, economicKind, externalAddress? })
```
همه با `operationId` + journal.

---

## Bridge / Cross-Network (تغییر assetKey)

```text
USDT-ERC20  →bridge→  USDT-TRC20
```

این **internal_transfer ساده با یک assetKey نیست**.

مدل canonical:
```text
operationId = B, economicKind = bridge
1) disposal/transfer_out روی assetKey A (gross) + fee_burn
2) acquisition/transfer_in روی assetKey B (net)
cost: transferredCost از A به B (همان CostBasisEngine با kind bridge یا pair transfer_out A + transfer_in B با transferredCost)
realizedPL = 0 مگر bridge provider settlement خلاف بگوید
assert: instrumentId_A ≠ instrumentId_B
```

فیلد اختیاری: `bridgeProvider`, `bridgeTxHash`.

CostBasisEngine: `kind: 'bridge_out' | 'bridge_in'` یا همان transfer_out/in با `linkedRole: 'bridge'` و `transferredCost`.

### Opening / import
از Core `opening_position` استفاده شود — نه BUY ساختگی.  
شامل: migration، موجودی اولیه، gift، airdrop (با economicKind).

### فرمول دقیق Bridge Cost

```text
gross_A, fee_qty, net_B
assert gross_A = net_B + fee_qty  (same economic token units)

costPool_A before = totalInvested_A
costPerUnit = costPool_A / qty_A
releasedForOut = costPerUnit * gross_A

feeBurnCost = costPerUnit * fee_qty     // cost attributed to burned units
transferredCost = costPerUnit * net_B   // = releasedForOut - feeBurnCost
assert transferredCost + feeBurnCost = releasedForOut

bridge_out: qty_A -= gross_A; totalInvested_A -= releasedForOut
fee_burn: realizedPL = 0; journal expense for feeBurnCost in base
bridge_in: qty_B += net_B; totalInvested_B += transferredCost
average_B = totalInvested_B / qty_B
```

مثال: 100 USDT-ERC20, fee 1, net 99 TRC20, cost pool 10,000 IRR برای 100 unit:
```text
released = 10000, feeBurnCost = 100, transferredCost = 9900
```

### فروش واقعی خارج سیستم (`economicKind = external_sale`)

```text
executeExternalSale({
  fromExchangeId, assetKey, quantity,
  proceedsAmount, proceedsCurrency,  // الزامی
  exchangeRateToBase, conversionPath?,
  recordExternalCash?: boolean, // اگر true: cash خارج سیستم فقط memo — نه acc داخلی
  externalCounterparty?: string,
  asOf, operationId
})
```

- Domain: disposal (external_outflow) با proceeds
- CostBasis: realizedPL = proceedsInBase - soldCost - fees
- Journal: Cr crypto asset cost; Dr external_clearing یا expense/income residual; **اگر** پول به حساب بانکی داخل app واریز شد → جدا operation deposit؛ وگرنه فقط clearing/equity memo
- proceeds currency + FX قفل روی operation

---

## Cash: یک SoT

`inv_crypto_cash` = **تنها** Domain SoT موجودی نقد صرافی/ولت.

`fin_accounts` با `systemRole=exchange_cash` = projection حسابداری (linked) — **نه** balance موازی که جدا update شود.

Binance 1000 USDT settlement → یک حقیقت در fin_accounts + fin_journal_lines؛ crypto cash فقط projection (P0-DOC-001).

## Lots
برای FIFO: `lotId` روی هر خرید. network, txHash, wallet address برای on-chain.
WAC می‌تواند بدون lot کار کند؛ مدل data lot را برای policy FIFO نگه می‌دارد.

---

## USDT / stablecoin — `economicKind` روی Position (نه UI)

نقش را **registry/position** تعیین می‌کند، نه صفحه:

| economicKind | معنی | جدول |
|--------------|------|------|
| `cash` / `cash_like` | موجودی تسویه صرافی/ولت | `inv_crypto_cash` |
| `asset` / `investment` | دارایی قابل معامله با cost basis واقعی | `inv_crypto_holdings` |

```text
خرید 10,000 USDT با IRR → economicKind=investment → cost از معامله
موجودی USDT برای جفت‌کردن سفارش → economicKind=cash_like روی CashPosition
```

گزارش Net Worth / P&L / Cost Basis / Cash Flow بر اساس **economicKind** است نه صرفاً symbol=USDT.

## totalFeesPaidBase

```text
totalFeesPaidBase = lifetime accumulated fee metric
≠ current cost basis
≠ remaining cost
```

- هنگام فروش **کاهش نمی‌یابد**
- فقط آمار تاریخی / گزارش fee
- Cost basis از engine و totalInvested/lots می‌آید — **نه** از totalFeesPaidBase

## UI ساده vs مدل غنی

**ساده:** symbol نمایش، qty، ارزش، سود، [خرید][فروش][انتقال].  
**Advanced Details:** network, contract, txHash, fee treatment, cost basis, economicKind.

## یک Asset Registry

`ref_instruments` = **تنها** هویت.  
Metadata کریپتو (`chainId`, `contractAddress`, `decimals`, `assetKey`) روی instrument/metadata — **نه** registry موازی `inv_crypto_assets` به‌عنوان SoT دوم.

## Currency ≠ Asset

`IRR` = currency. `USDT-TRC20` = asset.  
نقش USDT در گزارش با **economicKind** روی position کنترل می‌شود (cash_like vs investment).

---

## identity و conservation (تأیید P0)

- هویت: `instrumentId` / `assetKey` — نه `symbol` alone
- USDT-TRC20 و USDT-ERC20 دو instrument جدا
- انتقال: **gross / fee / net** تفکیک + conservation rule (gross = net + fee در واحد مربوطه)

---

Scope و Transfer/Fee/Network: **`Crypto-V1-Scope.md`**.

## FEAT-P0 LOCK (Crypto)

### Identity (P0-003/004)
- `instrumentId` = FK `ref_instruments.id` only (SoT)
- `assetKey` = provider/mapping index only — **never PK/SoT**
- `symbol` = display label only
- APIs: `holdingId` or `instrumentId` — never symbol-only rebuild

### Quantity / fee (P0-005)
Mandatory: `grossQuantity`, `feeQuantity`, `netQuantity`, `feePresence`
- fee from base/received → holding Δ = **net**
- fee in quote → holding Δ = **gross** (=net)

### C2C cost (P0-006)
```text
sourceCostReleased = CostBasisEngine.release(fromHolding, qty)
destCost = sourceCostReleased + acquisitionFees (policy)
```
**Forbidden:** using latest market price to set destination historical cost.

### Cash vs asset (P0-007)
- `inv_crypto_cash` = only SoT for exchange/fiat/cash-like balances
- Token/network assets only in holdings (USDT-TRC20 ≠ cash row)

---
## FEAT-P0-002 Snapshot
`currentBalance` / holding `quantity` / `totalInvested` = projection. Mutate only via operations + rebuild. No public setBalance API.

---
## FEAT-P0-004 DEEP
`instrumentId` never equals `assetKey` as storage PK.
assetKey may be stored on instrument meta for provider sync only.

## FEAT-P0-005 DEEP — fee/quantity
| feePresence | holding Δ |
| fee none / fee_in_quote | net = gross |
| fee_from_base / fee_from_received | net = gross − feeQuantity |
Always store gross, fee, net. Four-mode fixtures + conservation required.

## FEAT-P0-006 DEEP — C2C cost basis
releasedCost = CostBasisEngine.dispose(fromHoldingId, qty)
destCost = releasedCost + feesCapitalizedPerPolicy
Forbidden: market value as historical destination cost.

## FEAT-P0-007 DEEP — cash vs asset
Exchange cash-like → inv_crypto_cash. Network tokens → holdings.
No synthetic IRR/USDT cash rows inside token holdings.

---

## P&L چندارزی ایران: سود ریالی با افت قیمت دلاری (CRITICAL)

### مسئله واقعی کاربر

کاربر ممکن است **با ریال** رمزارز بخرد. بعداً:

- قیمت دارایی به **تتر/دلار** افت کند  
- ولی **نرخ تتر به ریال** (یا دلار به ریال) زیاد بالا برود  

در نتیجه به **ریال** ممکن است هنوز **سود** نشان دهد، در حالی که به **تتر** زیان است.

اگر سیستم فقط یک عدد «سود» بدهد، کاربر گمراه می‌شود و حسابداری نادرست است.

### تفکیک اجباری (سه لایه)

برای هر holding در `baseCurrency` کاربر (معمولاً IRR):

| مؤلفه | معنی | تقریبی |
|--------|------|--------|
| **Asset P&L (quote)** | تغییر قیمت دارایی نسبت به quote (مثلاً BTC/USDT) | \(q \times (P^{q}_{now} - P^{q}_{cost})\) |
| **FX P&L** | تغییر نرخ quote→base روی cost و روی ارزش | اثر \(\Delta FX\) روی ارزش و بهای تمام‌شده |
| **Total P&L (base)** | سود/زیان نهایی به ارز پایه | \(Value_{base} - Cost_{base}\) |

```text
valueBase(asOf) = qty × price(quote, asOf) × fx(quote→base, asOf)
costBase        = totalCostBase قفل‌شده از خریدها (از CostBasisEngine در costCurrency=base)
totalUnrealizedBase = valueBase - costBase
```

**گزارش باید حداقل نشان دهد:**

1. `unrealizedTotalBase` (مثلاً IRR)  
2. `unrealizedInQuote` (مثلاً USDT) — اگر quote ≠ base  
3. تجزیه اختیاری ولی توصیه‌شده: `pnlAssetQuote` + `pnlFxBase` طوری که جمعاً با total سازگار باشد  

### مثال عددی (fixture الزامی)

```text
خرید: 1 BTC
پرداخت: 2_000_000_000 IRR
نرخ: 1 USDT = 50_000 IRR  →  معادل cost ≈ 40_000 USDT
قیمت BTC همان لحظه: 40_000 USDT

بعداً:
قیمت BTC: 35_000 USDT   (افت دارایی به تتر)
نرخ: 1 USDT = 70_000 IRR  (رشد تتر/ریال)

valueBase = 1 × 35_000 × 70_000 = 2_450_000_000 IRR
costBase  = 2_000_000_000 IRR
totalUnrealizedBase = +450_000_000 IRR   ← هنوز سود ریالی

valueQuote = 35_000 USDT
costQuote  ≈ 40_000 USDT
unrealizedQuote = −5_000 USDT           ← زیان دلاری/تتری
```

سیستم **حق ندارد** فقط «سود» یا فقط «زیان» بگوید بدون واحد و لایه.

### قوانین پیاده‌سازی

1. Cost basis برای کاربر ایرانی معمولاً در **`costCurrency = baseCurrency (IRR)`** از همان خرید ریالی (یا تبدیل قفل‌شده در operation) ساخته می‌شود — نه میانگین خام USDT با IRR.
2. Unrealized به base همیشه: `price(asOf) × fx(asOf)` با **هر دو historical**؛ نه قیمت امروز × نرخ قدیم یا برعکس.
3. Realized در فروش:  
   - `proceedsBase` از cash leg واقعی یا از quote×fx قفل‌شده همان فروش  
   - `costBaseReleased` از engine  
   - `realizedBase = proceedsBase - costBaseReleased`  
   - در صورت امکان `realizedQuote` جدا برای همان فروش.
4. UI: برچسب واضح «سود/زیان به ریال» در برابر «به تتر/دلار»؛ ترجیحاً هر دو.
5. Golden fixture: سناریوی بالا + فروش جزئی در همان شرایط.

### ارتباط با اسناد دیگر

- `Cost-Basis-Engine.md` — cost در costCurrency یکسان  
- `Currency-CrossRate.md` — `valueInBase = price × fx` با asOf هم‌زمان  
- گزارش پرتفوی نباید Net Worth را فقط از قیمت تتری بدون FX بسازد وقتی base=IRR است.

---
## P0-042 DEEP — rebuild quantity = net

Raw on tx: `grossQuantity`, `feeQuantity`, `netQuantity` (all required when fee possible).

```text
rebuild holding.quantity = Σ signed netQuantity (active ops only)
```

**Forbidden:** summing legacy `tx.quantity` when gross/net exist without mapping quantity→net.

## P0-043 DEEP — C2C fee in base asset

C2C = **one** Financial Operation with multiple legs:

- dispose leg on from-asset (qty + released cost)
- fee leg if fee in BTC/from-asset (`feePresence=fee_from_base` / burn)
- acquire leg on to-asset with dest cost = released − feeBurnCostPolicy + quote fees

CostBasisEngine must document: fee-from-base reduces source qty and allocates cost to fee-burn vs transferred remainder **before** assigning dest basis.

## P0-044 DEEP — transfer fee vs moved cost

Internal transfer with network fee from source:

```text
qty_moved = gross − fee_burn
cost_moved = proportional cost of qty_moved
cost_fee_burn = cost of fee_burn qty (policy: proportional)
realized on fee_burn: usually 0 or expense per Fee matrix — NOT mixed into dest average silently
```

Dest holding receives **only** cost_moved. Fee economic effect separate.

## P0-045 DEEP — totalFeesPaidBase

**Forbidden as independent ever-increasing SoT.**

```text
totalFeesPaidBase = DERIVED Σ feeBase from active (non-reversed) operations
```

Optional snapshot OK if rebuildable. Distinguish report modes: `feesGrossEver` (includes reversed for audit) vs `feesNetEffective` (active only).

## P0-046 DEEP — identity

`holding.instrumentId` / tx.instrumentId = `ref_instruments.id` only.
`assetKey` = migration/provider alias only — never rebuild key.

## P0-047 DEEP — USDT cash vs USDT token

| Role | Where |
|------|--------|
| Settlement cash-like (exchange balance in USDT) | `inv_crypto_cash` / cash account currency USDT |
| On-chain USDT-TRC20 / ERC20 | instrument holdings |

Valuation: cash USDT → FX to base; token USDT → price of instrument (often ~1 USDT) × FX.
**Forbidden:** counting same economic USDT once as cash and once as token without distinct custody rows.

## P0-048 DEEP — feePresence exclusive

Enum/state **mutually exclusive** per leg (validation):

`none | fee_in_quote | fee_from_base | fee_from_received | fee_external`

Cannot combine `fee_from_base` + `fee_from_received` on same leg. Network fee is either modeled as one of these or a **separate leg** with its own feePresence — not double-applied to same qty.

## P0-049 DEEP — address ownership

On chain tx write:

```text
assert address ∈ wallet.addresses for selected networkId
assert network matches instrument/network of holding
```

Reject mismatched address/network/wallet attribution.

## Multi-currency P&L (P0 golden)

When quote path involves USDT (or other) and user `baseCurrency` is IRR (or any third currency), **do not** report `(Δ price in USDT)×qty` as final base P&L.

Required decomposition: `assetPriceEffectBase`, `fxEffectBase`, `feeEffectBase`, `externalCashFlowEffectBase`, plus totals.

Golden numbers and acceptance tests: `docs/core/fixtures/GOLDEN-CRYPTO-BTC-USDT-IRR-PNL.md`.

---

## P0-FIX-003 — Identity (implementation prose lock)

**Forbidden in new implementation:**

```sql
-- FORBIDDEN rebuild identity (P0-DOC-003):
-- WHERE assetKey = ?
-- WHERE symbol = ?
-- USE: holdingId OR (exchangeId + instrumentId [+ networkId])
```

**Forbidden keys for holding identity:** `symbol`, `assetKey` as logical PK.

**Canonical rebuild key:**

```text
rebuild = holdingId
       OR (exchangeId + instrumentId [+ networkId])
```

| Field | Role |
|-------|------|
| `instrumentId` | canonical identity (`ref_instruments.id`) |
| `symbol` | display label only |
| `assetKey` | SYSTEM_INDEX / provider convenience only |

Any remaining legacy snippet that still shows `symbol`/`assetKey` in WHERE for rebuild is **LEGACY — superseded** by this section.

---

## P0-FIX-004 — Quantity / fee semantics (single truth table)

**Raw fields (always persist — never drop):**

```text
feePresence
grossQuantity
feeQuantity
netQuantity
```

| feePresence | Holding quantity effect |
|-------------|-------------------------|
| `none` | gross = net; feeQuantity = 0 |
| `fee_in_quote` | gross = net; fee in quote asset |
| `fee_from_base` | net = gross − feeQuantity |
| `fee_from_received` | net = gross − feeQuantity |
| `fee_external` | gross = net; fee separate funding |

Equations:

```text
if feePresence ∈ {none, fee_in_quote, fee_external}:
  netQuantity = grossQuantity
else: /* fee_from_base | fee_from_received */
  netQuantity = grossQuantity − feeQuantity
```

**gross and fee are never discarded.** Only this table is authoritative; older conflicting matrices are LEGACY.

---

## P0-FIX-005 — economicFeeRole gate

Before any cost mutation, set **one** of:

`acquisition_fee_from_received` | `post_acquisition_network_burn` | `sale_fee_from_proceeds` | `standalone_asset_burn`

No role → no pool change.

---

## P0-FIX-006 — C2C cost (implementation)

`economic_trade_or_swap` only: destination cost from **explicit consideration**, not source mark.

Forbidden example: `toTotalBase = fromTotalBase + feeBase` when `fromTotalBase` is market value.

---

## P0-FIX-007 — totalFeesPaidBase is DERIVED

```text
totalFeesPaidBase = Σ feeBase of active (non-voided) fee events for the holding/pool
```

- Recomputed on **rebuild** / after reversal
- **Not** an independent SoT on the holding row
- **No** `setTotalFeesPaidBase()` public API

Stored column (if present) = cache only; mismatch → rebuild wins.
