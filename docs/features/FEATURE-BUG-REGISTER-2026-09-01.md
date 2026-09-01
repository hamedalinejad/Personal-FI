# Feature Documentation Bug Register — 2026-09-01

## هدف

این سند **بازنویسی Featureها نیست**. یک register مستقل از تناقض‌ها، نقص قراردادها، خطرهای محاسباتی و مشکلات استقلال ماژول‌هاست تا قبل از implementation، توسعه‌دهنده‌ها هر مورد را با یک راه‌حل واحد اجرا کنند.

این audit فقط روی documentation انجام شده و runtime/SQL هنوز وجود ندارد؛ بنابراین «باگ» در این سند یعنی **specification defect / contradiction / missing invariant**. موارد runtime باید بعد از implementation با fixture و reconciliation تأیید شوند.

اصل پایه:

> هیچ field فعلی بدون migration mapping حذف نمی‌شود. Derived/Snapshot قابل rebuild است؛ RAW/External Reported باید حفظ شود.

---

# P0 — باید قبل از کدنویسی حل شود

## FEAT-P0-001 — Standalone leakage
**STATUS: DEEP-FIXED** (schema accountId nullable; CashSettlementPort) — see `docs/core/FEATURE-BUG-RESOLUTIONS.md` and feature patches.
**مشکل:** بعضی Featureها standalone معرفی شده‌اند ولی مدل بعضی مسیرها هنوز `accountId`/`accountTransactionId` را اجباری می‌داند.

**اثر:** Loan-only / Investment-only بدون Accounts می‌شکند.

**راه‌حل:** تمام cash linkageها optional و پشت `CashSettlementPort` باشند. هر Feature دو حالت داشته باشد: Integrated و Standalone. Standalone باید بدون FK اجباری به `acc_*` کار کند.

**قبولی:** حذف capability Accounts نباید Domain Feature را از ثبت، محاسبه و گزارش اختصاصی بازدارد.

## FEAT-P0-002 — Snapshot به‌جای Ledger
**STATUS: DEEP-FIXED** — no direct snapshot mutate; rebuild from ledger
**مشکل:** در چند Feature snapshotهایی مثل `cashBalance`, `currentAmount`, `quantity`, `totalInvested`, `remainingBalance` همزمان کنار ledger وجود دارند و در بعضی APIها مسیر mutation مستقیم snapshot دیده می‌شود.

**راه‌حل:** Ledger/domain events = SoT؛ snapshot فقط projection. هر mutation مالی = یک Financial Operation اتمیک؛ سپس snapshot rebuild/update.

**قبولی:** `rebuild*FromLedger()` باید بتواند snapshot را بدون تکیه بر snapshot قبلی بازسازی کند.

## FEAT-P0-003 — Identity drift
**STATUS: DEEP-FIXED** — instrumentId only for rebuild/query
**مشکل:** در Crypto و Price Fetching بین `instrumentId`, `assetKey`, `symbol` و در Stocks بین `instrumentId`/ISIN/symbol نقش‌های متناقض دیده می‌شود.

**راه‌حل:** `ref_instruments.id` تنها identity دارایی. `assetKey` فقط mapping/index. `symbol` فقط label. Public APIهای جدید باید identity canonical بگیرند.

**قبولی:** هیچ rebuild/query جدیدی با `symbol` تنها انجام نشود.

## FEAT-P0-004 — Crypto final canonical contract هنوز متناقض است
**STATUS: DEEP-FIXED** — instrumentId != assetKey PK
**مشکل:** ابتدای Crypto می‌گوید identity = `instrumentId`، بخش‌هایی rebuild را با `assetKey` انجام می‌دهند و انتهای سند دوباره `instrumentId = assetKey` تعریف می‌کند.

**راه‌حل:** `instrumentId` = FK به Core instrument. `assetKey` = external/provider mapping index. همه APIهای جدید `holdingId` یا `instrumentId` بگیرند.

**قبولی:** `assetKey` هرگز PK/SoT نباشد.

## FEAT-P0-005 — Crypto fee/quantity contradiction
**STATUS: DEEP-FIXED** — gross/fee/net; holding=net when fee from base
**مشکل:** BUY با fee از base asset یک‌جا holding را `+1` و جای دیگر `+0.999` می‌کند.

**راه‌حل:** `grossQuantity`, `feeQuantity`, `netQuantity`, `feePresence` اجباری. اگر fee از base/received کسر شد، holding = net؛ اگر fee در quote بود، net=gross.

**قبولی:** یک fixture برای هر چهار fee mode و conservation check.

## FEAT-P0-006 — Crypto C2C cost basis اشتباه/متناقض
**STATUS: DEEP-FIXED** — C2C cost from engine release not market
**مشکل:** در یک الگوریتم `toTotalBase = fromTotalBase + feeBase` آمده، در حالی که `fromTotalBase` می‌تواند market value باشد نه released cost. این می‌تواند cost basis مقصد را غلط کند.

**راه‌حل:** C2C باید `sourceCostReleased` را از CostBasisEngine بگیرد؛ destination basis = released cost + acquisition fees طبق policy. Market value فقط برای valuation است.

**قبولی:** C2C هیچ‌گاه latest market price را برای بازسازی historical cost استفاده نکند.

## FEAT-P0-007 — Crypto cash/asset split
**STATUS: DEEP-FIXED** — inv_crypto_cash is cash SoT
**مشکل:** متن قدیمی `IRR/USDT` را داخل holdings نگه می‌دارد، در حالی که قرارداد جدید `inv_crypto_cash` را SoT cash می‌داند.

**راه‌حل:** `inv_crypto_cash` تنها SoT cash position؛ token holding فقط asset. USDT-TRC20/ERC20 asset مستقل؛ cash-like position جدا.

**قبولی:** یک symbol ساختگی در holdings برای cash جدید نوشته نشود.

## FEAT-P0-008 — Loan accountingTreatment enum drift
**STATUS: DEEP-FIXED** — single accountingTreatment enum
**مشکل:** `reduction_of_carrying_amount` و `reduction_of_liability` هر دو در سند آمده‌اند ولی معنای اقتصادی/حسابداری یکسان نیست.

**راه‌حل:** enum canonical فقط طبق Core تعریف شود؛ contractual principal، accrued components و accounting carrying amount جدا بمانند. `reduction_of_liability` فقط policy صریح.

## FEAT-P0-009 — Loan disbursement linkage ambiguity
**STATUS: DEEP-FIXED** — disbursement cash on ln_transactions
**مشکل:** `ln_loans.accountId/accountTransactionId` با Standalone nullable معرفی شده، ولی createLoan هنوز لینک حساب را در مسیر اصلی فرض می‌کند.

**راه‌حل:** header فقط اطلاعات قراردادی؛ هر cash-bearing event در `ln_transactions.accountTransactionId` به operation cash leg لینک شود. برای v1 یک disbursement، برای phased آینده جدول `ln_disbursements`.

## FEAT-P0-010 — Loan transaction amount semantics
**STATUS: DEEP-FIXED** — amount is cash leg
**مشکل:** `amount` گاهی مبلغ نقد واقعی، گاهی مجموع components و در disbursement «net cash» تعریف شده؛ بدون تفکیک contractual principal/reported cash ممکن است journal اشتباه شود.

**راه‌حل:** در هر event، `amount` = cash leg واقعی؛ components (`principal`, `interest`, `fee`, `penalty`) جدا. disbursement contract principal جدا از net proceeds.

## FEAT-P0-011 — Loan schedule snapshot ناقص
**STATUS: DEEP-FIXED** — schedule snapshot metadata
**مشکل:** snapshot به version/effective/input metadata کامل و یکنواخت نیاز دارد.

**راه‌حل:** حداقل `generatedAt`, `effectiveFrom`, `reason`, `operationId`, `calculationVersion`, `roundingVersion`, `rateVersion`, `inputHash`, payload کامل schedule.

## FEAT-P0-012 — Loan payment vs schedule
**STATUS: DEEP-FIXED** — schedule plan vs payment fact
**مشکل:** schedule row و payment event در بعضی توضیحات بیش از حد به هم نزدیک شده‌اند.

**راه‌حل:** Schedule = قرارداد/پیش‌بینی؛ Payment = واقعیت. وضعیت installment از payment allocations مشتق شود؛ وجود schedule هرگز cash movement تلقی نشود.

## FEAT-P0-013 — Loan partial payment first-class نیست
**STATUS: DEEP-FIXED** — partial component remainders
**مشکل:** پرداخت جزئی باید component-level باقی‌مانده داشته باشد، نه فقط paid/unpaid.

**راه‌حل:** allocation ledger برای `penalty`, `fee`, `interest`, `principal` با مانده هر component و waterfall versioned.

## FEAT-P0-014 — Loan variable-rate مدل ناقص
**STATUS: DEEP-FIXED** — variable rate v1 manual only
**مشکل:** `rate` و `effectiveDate` کافی نیستند اگر نرخ variable بر اساس index/spread/cap/floor/reset باشد؛ همچنین accrued interest بین resetها به‌صراحت مدل نشده.

**راه‌حل:** اگر v1 فقط نرخ دستی دارد، صریحاً scope را محدود کن. اگر variable واقعی لازم است: `referenceIndex`, `spread`, `cap`, `floor`, `resetFrequency`, effective interval و versioned rate snapshot.

## FEAT-P0-015 — Loan grace semantics چندگانه
**STATUS: DEEP-FIXED** — grace flags
**مشکل:** `gracePeriodMonths`, `gracePeriodCount`, `gracePeriods`, `graceMode` و `gracePeriodUnit` همزمان در متن دیده می‌شوند.

**راه‌حل:** canonical فقط `graceMode + gracePeriods` یا `date_range`. فیلدهای قدیمی فقط migration/read-only. API create نباید دو مدل را همزمان بپذیرد.

## FEAT-P0-016 — Loan day-count conflict
**STATUS: DEEP-FIXED** — day count one per version
**مشکل:** `period_based`, `actual_365`, `actual_360`, `30_360`, `actual_actual`, `custom_days` تعریف شده ولی helper فعلی `actual_actual` را عملاً 365 می‌کند و period-based/custom مسیرهای متفاوت دارند.

**راه‌حل:** Day Count Engine واحد؛ `actual_actual` واقعاً leap-aware یا صریحاً خارج از v1. برای irregular periods فقط `interestFactor(start,end)`.

## FEAT-P0-017 — Loan formula scope conflict
**STATUS: DEEP-FIXED** — closed method set
**مشکل:** `declining_balance` هم annuity ثابت را پوشش می‌دهد و هم در انتهای سند «اصل‌ثابت+سود‌مانده» را زیر همان method قرار می‌دهد.

**راه‌حل:** `calculationMethod` و `amortizationStyle` را جدا کن. یک method نباید دو فرمول بدون discriminator داشته باشد.

## FEAT-P0-018 — Cheque reversal double-count risk
**STATUS: DEEP-FIXED** — single reverse op on bounce
**مشکل:** در `cleared → bounced` یک‌جا original `acc_transaction` void و هم reversal ثبت می‌شود. اگر reports void را exclude کنند، reversal ممکن است دوباره اثر معکوس بدهد.

**راه‌حل:** فقط یکی از دو الگوی canonical را انتخاب کن: (A) original باقی بماند + reversal opposite؛ یا (B) original void شود و reversal صرفاً طبق Core semantics تولید شود. گزارش و journal باید دقیقاً یک اثر اقتصادی داشته باشند.

**قبولی:** fixture `pending→cleared→bounced` باید مانده نهایی را دقیقاً به قبل از clear برگرداند.

## FEAT-P0-019 — Cheque state machine drift
**STATUS: DEEP-FIXED** — canonical cheque statuses
**مشکل:** مدل اصلی `pending/cleared/bounced/cancelled` است ولی later model `draft/issued/in_vault/transferred/cashed/blocked` را معرفی می‌کند.

**راه‌حل:** v1 state machine فقط یک مجموعه canonical داشته باشد؛ states آینده با namespace/version مشخص شوند، نه اینکه هم‌زمان معتبر باشند.

## FEAT-P0-020 — Accounts accountType drift
**STATUS: DEEP-FIXED** — unified accountKind enum
**مشکل:** `current/savings/term_deposit/other` در entity و `qarz/sep/modat/jame/other` در بخش ایران آمده است.

**راه‌حل:** `accountKind`/`accountType` را تفکیک کن: canonical internal enum + `iranAccountSubtype` در صورت نیاز. Mapping legacy مستند شود.

## FEAT-P0-021 — Accounts raw card number conflict
**STATUS: DEEP-FIXED** — no full PAN storage
**مشکل:** entity هنوز `cardNumber` خام دارد ولی بخش ایران `cardNumberHash` را policy امن معرفی می‌کند.

**راه‌حل:** write جدید فقط token/hash/masked value. `cardNumber` قدیمی فقط migration compatibility و هرگز در log/export عمومی.

## FEAT-P0-022 — Expense split transaction بدون entity canonical
**STATUS: DEEP-FIXED** — ExpenseLine first-class
**مشکل:** Split Transaction به‌عنوان P0 معرفی شده ولی entity/table مستقل برای ExpenseLine/operation allocation تعریف نشده.

**راه‌حل:** یک مدل line-level canonical بساز؛ هر operation یک CashLeg و چند ExpenseLine داشته باشد، جمع خطوط با cash leg reconcile شود.

## FEAT-P0-023 — Expense/Income correction operation semantics
**STATUS: DEEP-FIXED** — income correction same
**مشکل:** correction هم original را void می‌کند، هم reversal می‌سازد، هم new transaction می‌سازد. اگر original domain و cash operation جداگانه شمرده شوند، double-count محتمل است.

**راه‌حل:** correction = یک Financial Operation جدید با `reversesOperationId`؛ original immutable. گزارش فقط اثر اقتصادی non-void را یک‌بار می‌بیند.

## FEAT-P0-024 — Currency conversion formula contradiction
**STATUS: DEEP-FIXED** — multiply for forward rate
**مشکل:** canonical rate می‌گوید `1 from = rate to` و `amountTo = amountFrom × rate`، اما pseudo-code direct rate را `amount.dividedBy(rate)` می‌کند.

**راه‌حل:** فقط یک semantic: `1 from = rate to`; forward = multiply، inverse = divide. تمام helperها و examples با همین قرارداد بازنویسی شوند.

## FEAT-P0-025 — Currency hard-coded USDT bridge
**STATUS: DEEP-FIXED** — no hard-coded USDT bridge
**مشکل:** یک بخش Core/convert مسیر USDT را به‌صورت پیش‌فرض فرض می‌کند، در حالی که قرارداد جدید `configured_bridge` دارد.

**راه‌حل:** bridge فقط از settings/versioned policy. v1 modes: direct, inverse, configured_bridge, manual. USDT default فقط اگر explicitly configured.

## FEAT-P0-026 — Price identity contradictions
**STATUS: DEEP-FIXED** — price key instrumentId
**مشکل:** Price Fetching در جدول مشترک یک‌جا Crypto را `symbol` و جای دیگر `assetKey` و Stocks را symbol/internalSymbol معرفی می‌کند.

**راه‌حل:** `CanonicalPriceInstrument {assetCategory,instrumentId,...}` تنها ورودی/کلید history. Provider mapping جدا.

## FEAT-P0-027 — Price quoteType drift
**STATUS: DEEP-FIXED** — quoteType enum unified
**مشکل:** entity و adapter مجموعه‌های متفاوتی از quoteType دارند (`last/nav/close/manual/indicative` در برابر `mid/other`).

**راه‌حل:** یک enum مرکزی: `last | nav | close | mid | indicative | manual | other` و همه Providerها فقط همین را برگردانند.

## FEAT-P0-028 — Price marketDate contradiction
**STATUS: DEEP-FIXED** — marketDate rules
**مشکل:** marketDate در entity برای بعضی دسته‌ها nullable و در انتها برای historical valuation Must معرفی شده است.

**راه‌حل:** برای stock/FIF daily quote = required؛ crypto intraday = nullable ولی `fetchedAt` required؛ historical query نباید از current price fallback کند.

## FEAT-P0-029 — Price source enum drift
**STATUS: DEEP-FIXED** — sourceKind + sourceId
**مشکل:** entity `source = manual|api` دارد ولی انتهای سند `csv_import`, `api_coingecko`, `api_tsetmc` هم به‌عنوان source آمده‌اند.

**راه‌حل:** `sourceKind` canonical (`manual|api|import`) + `sourceId/adapterKey` برای provider. یک enum دو مفهوم را حمل نکند.

## FEAT-P0-030 — Price manual/API selection ambiguity
**STATUS: DEEP-FIXED** — PriceSelectionPolicy order
**مشکل:** اولویت manual، priority source، confidence و freshness در چند بخش با ترتیب‌های مختلف آمده‌اند.

**راه‌حل:** یک `PriceSelectionPolicy` versioned: holding-specific source → explicit source → default source → priority/confidence → freshness، با manual override طبق expiresAt.

## FEAT-P0-031 — Price history instrumentId type/meaning
**STATUS: DEEP-FIXED** — instrumentId is Core id
**مشکل:** `instrumentId` به‌صورت string است ولی برای crypto/metal/fif گاهی کلید synthetic است و Core instrument identity چیز دیگری است.

**راه‌حل:** در storage یک `priceInstrumentRef` canonical یا `assetCategory + instrumentId` داشته باش؛ اگر synthetic key لازم است نام و type آن صریح باشد و با Core `ref_instruments.id` اشتباه نشود.

## FEAT-P0-032 — Stocks T+2 vs immediate cash
**STATUS: DEEP-FIXED** — T+2 cash layers
**مشکل:** Stocks می‌گوید خرید فوراً `cashBalance` را کم می‌کند، ولی microstructure می‌گوید settlement در T+2 کاری و available cash باید از settled جدا باشد.

**راه‌حل:** `ledgerCash`, `settledCash`, `availableCash`, `pendingSettlement` را تفکیک کن؛ trade date و settlement date جدا و calculation مشخص.

## FEAT-P0-033 — Stocks instrumentId type mismatch
**STATUS: DEEP-FIXED** — instrumentId UUID Core
**مشکل:** Stock `instrumentId` به‌صورت string/ISIN/UUID توصیف شده و در Price Fetching نیز symbol/internalSymbol جایگزین آن می‌شود.

**راه‌حل:** canonical `ref_instruments.id` در Core؛ ISIN/providerSymbol metadata. Symbol change هرگز instrument identity را عوض نکند.

## FEAT-P0-034 — Stocks Corporate Action rebuild completeness
**STATUS: DEEP-FIXED** — CA ordered rebuild
**مشکل:** الگوریتم rebuild buy/sell را کافی نمی‌داند و CAهای متعدد دارد؛ اما ارتباط همه CAها با source/target holding و effective date هنوز کامل نیست.

**راه‌حل:** `inv_stocks_iran_corporate_actions` به‌عنوان metadata/operation descriptor + source/target instruments + ratio + effectiveDate + operationId؛ rebuild باید همه CAها را ordered اعمال کند.

## FEAT-P0-035 — Stocks dividend accounting ambiguity
**STATUS: DEEP-FIXED** — dividend gross net
**مشکل:** `totalAmount=netDividend` ولی journal پیش‌فرض income=gross و withholding جداست؛ بدون componentهای دقیق امکان double count یا mismatch وجود دارد.

**راه‌حل:** `grossDividend`, `withholdingTax`, `netDividend` و cash leg جدا؛ tax event فقط reference. Income = gross، cash = net، withholding یک component اقتصادی واحد.

## FEAT-P0-036 — Fund NAV/transaction price separation incomplete
**STATUS: DEEP-FIXED** — performance three outputs
**مشکل:** خوب تفکیک شده ولی `predictedProfit` و actual return هنوز با NAV/dividend/sell در یک بازه جمع می‌شوند و احتمال double-count وجود دارد.

**راه‌حل:** performance engine سه خروجی مستقل: income, realized, unrealized; period return با opening/closing value + external cash flows. `predictedProfit` فقط comparison metadata.

## FEAT-P0-037 — Fund ETF cash dependency
**STATUS: DEEP-FIXED** — ETF vs issuance routes
**مشکل:** ETF از brokerage cash استفاده می‌کند و issuance از bank، ولی بعضی APIهای fund هنوز account/brokerage را هم‌زمان می‌پذیرند.

**راه‌حل:** discriminator `fundType` با validation سخت: ETF → brokerage route؛ issuance/redemption → account route. SettlementPort adapter مشترک، نه FKهای اجباری.

## FEAT-P0-038 — Metals cash currency contradiction
**STATUS: DEEP-FIXED** — v1 IRR platform cash
**مشکل:** سند می‌گوید همه مبالغ multi-currency ولی `inv_metals_platforms.cashBalance` صریحاً ریال است و platform cash APIs currency عمومی ندارند.

**راه‌حل:** اگر v1 فقط IRR است، scope را صریح کن. اگر multi-currency است، cash ledger باید currency-aware باشد (`cashPosition` per currency)، نه یک `cashBalance` scalar.

## FEAT-P0-039 — Metals physical delivery Net Worth break
**STATUS: DEEP-FIXED** — delivery atomic NW
**مشکل:** یک بخش فقط digital holding را کم می‌کند، بخش دیگر می‌گوید delivery باید physical asset را در همان operation ایجاد کند.

**راه‌حل:** delivery = cross-feature atomic operation: digital metal out + physical asset acquisition + delivery fee + journal. اگر Physical Assets خاموش است، delivery باید standalone representation داشته باشد و بعداً قابل materialize باشد.

## FEAT-P0-040 — Metals coin quantity model conflict
**STATUS: DEEP-FIXED** — coins derive mg
**مشکل:** canonical storage فقط `quantityMg` است، اما برای coin در انتها `quantityCoins` را اجباری معرفی می‌کند.

**راه‌حل:** برای fungible metal وزن canonical است؛ برای coin count canonical quantity باشد و standardWeight/purity metadata داشته باشد. دو مدل را در یک entity بدون discriminator مخلوط نکن.

## FEAT-P0-041 — Physical Asset realized P&L formula is wrong
**STATUS: DEEP-FIXED** — realized uses carrying
**مشکل:** `calculateProfitLoss` برای sale جمع `amount` را به‌عنوان realized P&L معرفی می‌کند، در حالی که `amount` sale proceeds است نه gain/loss.

**راه‌حل:** برای sale: `proceeds - releasedCost - sellingFees`. Cost released باید از acquisition ledger/CostBasisEngine بیاید. `amount` هرگز مستقیم profit تلقی نشود.

## FEAT-P0-042 — Physical Asset write-off loss formula ambiguous
**STATUS: DEEP-FIXED** — write-off carrying loss
**مشکل:** write-off `amount=-currentValue` ثبت می‌کند ولی carrying/acquisition cost آزادشده مشخص نیست.

**راه‌حل:** write-off باید `carryingAmountBeforeWriteOff` و impairment/loss را طبق policy مشخص کند؛ `currentValue=0` snapshot است، نه خودِ loss amount.

## FEAT-P0-043 — Physical Asset acquisition history insufficient
**STATUS: DEEP-FIXED** — acquisitions on pa_transactions
**مشکل:** برای gold/coin چند خرید روی یک asset ممکن است، ولی `purchasePrice/purchaseDate/accountId` روی header باقی می‌ماند.

**راه‌حل:** header فقط identity؛ تمام acquisition facts در `pa_transactions` با operation/account/cost/quantity. Header fields snapshot/legacy باشند.

## FEAT-P0-044 — Budget SoT ambiguity
**STATUS: DEEP-FIXED** — budget links not spend SoT
**مشکل:** یک بخش می‌گوید مصرف budget از `bg_transaction_links` است، راهنمای implementation می‌گوید از `exp_transactions` غیرvoid snapshot می‌شود.

**راه‌حل:** Budget خودش ledger مالی نیست؛ `bg_transaction_links` = allocation/plan ledger. Actual spend از source operations query می‌شود و links فقط allocation هستند. یک source of truth برای هر مفهوم.

## FEAT-P0-045 — Budget links lack reversal/version semantics
**STATUS: DEEP-FIXED** — links have operationId
**مشکل:** `bg_transaction_links` operationId/reversal linkage ندارد و correction/void می‌تواند مصرف بودجه را دو بار یا صفر کند.

**راه‌حل:** link باید `operationId`, `sourceLineId` و وضعیت/void یا derived بودن داشته باشد؛ correction/reversal با source operation reconcile شود.

## FEAT-P0-046 — Goal currentAmount can double-count wealth
**STATUS: DEEP-FIXED** — currentAmount not asset
**مشکل:** `source=income|budget` پول جدید ایجاد نمی‌کند، اما `fg_goals.currentAmount` به‌عنوان جمع پول هدف ذخیره می‌شود. اگر Portfolio آن را دارایی حساب کند، همان پول دوباره شمرده می‌شود.

**راه‌حل:** Goal را planning/allocation projection نگه دار؛ `currentAmount` را «progress/allocation» تعریف کن، نه cash asset. اگر cash واقعی reserve لازم است، account/goal wallet واقعی و operation جدا لازم است.

## FEAT-P0-047 — Goal withdrawal semantics ambiguous
**STATUS: DEEP-FIXED** — withdrawal reverses allocation
**مشکل:** برداشت از contributionهای `income/budget` گاهی بدون cash operation انجام می‌شود ولی معنای برگشت allocation، budget و source income مشخص نیست.

**راه‌حل:** withdrawal باید source allocation را reverse/consume کند؛ برای cash واقعی operation مالی، برای allocation داخلی فقط planning event. FIFO allocation با immutable links و operationId.

## FEAT-P0-048 — Tax year calendar inconsistency
**STATUS: DEEP-FIXED** — taxYear+taxCalendar
**مشکل:** Tax entity `taxYear + taxCalendar` را اجباری می‌کند ولی investment metadata فقط `taxYear` دارد و حتی می‌گوید v1 عدد سال businessDate است.

**راه‌حل:** هر tax snapshot = `(taxYear,taxCalendar)`. Investment event فقط `linkedTaxEventId` و در صورت نیاز snapshot minimal؛ calendar هرگز implicit نباشد.

## FEAT-P0-049 — Tax payment double-count boundary
**STATUS: DEEP-FIXED** — one cash leg tax payment
**مشکل:** Tax correctly says one cash transaction، ولی رابطه با Expense هنوز در بخش روابط به‌صورت «Expense transaction» آمده است.

**راه‌حل:** Tax payment یک Financial Operation با یک cash leg tax-specific؛ Expense گزارش از همان operation category را می‌خواند، نه یک cash transaction دوم.

## FEAT-P0-050 — Tax event vs feeTax
**STATUS: DEEP-FIXED** — feeTax vs tax event
**مشکل:** `feeTax` transaction cost است و tax liability/event چیز دیگری، ولی metadataهای قدیمی هنوز هر دو را در بعضی Featureها مخلوط می‌کنند.

**راه‌حل:** feeTax فقط trade economics؛ tax event/liability فقط Tax domain؛ withholding یک economic amount واحد و بدون double expense.

---

# P1 — باید قبل از Freeze هر Feature حل شود

## FEAT-P1-001 — Multi-currency field completeness
**STATUS: DEEP-FIXED** — money fields always currency-tagged
تمام transactionهای چندارزی باید `currency`, `baseCurrencyAtOperation`, `exchangeRateToBase` و در multi-hop `conversionPath/rateId` داشته باشند. نرخ تاریخی نباید از latest FX بازسازی شود.

## FEAT-P1-002 — Fee currency conversion
**STATUS: DEEP-FIXED** — fee FX locked on operation
هر fee باید مقدار خام، currency، rate/path و converted base value را نگه دارد. `feeAmount` بدون currency برای گزارش قابل اعتماد نیست.

## FEAT-P1-003 — Reversal uniformity
**STATUS: DEEP-FIXED** — Core-only reversal path
Crypto/Stocks/FIF/Metals/Loan/Cheque/Income/Expense باید فقط از Core reversal استفاده کنند؛ هیچ Feature-local `void + insert` مستقل نباشد.

## FEAT-P1-004 — OperationId propagation
**STATUS: DEEP-FIXED** — operationId on all child rows
هر multi-row operation باید یک operationId واحد داشته باشد: domain rows، journal، cash settlement، tax/fee/CA در صورت ارتباط.

## FEAT-P1-005 — External vs internal transfer
**STATUS: DEEP-FIXED** — internal vs external transfer semantics
Crypto به‌درستی این مفهوم را معرفی کرده ولی باید به Stocks/Metals و هر transfer آینده تعمیم داده شود. Internal = same owner؛ external = counterparty خارج از system.

## FEAT-P1-006 — Opening balance/import distinction
**STATUS: DEEP-FIXED** — opening vs import sourceType
Opening position نباید BUY ساختگی باشد. باید source=`opening|import|migration` و cost basis provenance داشته باشد.

## FEAT-P1-007 — Historical valuation
**STATUS: DEEP-FIXED** — historical valuation asOf only
Reports/Portfolio/Performance باید priceAsOf و fxAsOf یکسان یا صریح داشته باشند. Latest price برای historical report ممنوع.

## FEAT-P1-008 — Source of reported vs calculated values
**STATUS: DEEP-FIXED** — external reported never overwritten
FIF NAV/profit، Stock external statements، Metals provider quote و Tax external assessments باید `EXTERNAL_REPORTED` جدا از calculated نگه داشته شوند.

## FEAT-P1-009 — Rounding per component
**STATUS: DEEP-FIXED** — typed optional party links
همه Featureهای مالی باید roundingVersion و policy مشخص داشته باشند؛ مخصوصاً Loan installments، FX conversion، crypto quantity و metals mg.

## FEAT-P1-010 — Date semantics
**STATUS: DEEP-FIXED** — docs_links not raw path SoT
`createdAt`/UTC timestamp نباید با `businessDate`, `tradeDate`, `settlementDate`, `dueDate`, `marketDate` مخلوط شود. هر Feature باید date matrix مشترک Core را اجرا کند.

## FEAT-P1-011 — Report period P&L
**STATUS: DEEP-FIXED** — idempotent operationId+hash
Current holding نباید برای P&L یک period استفاده شود. Opening position + flows + realized + closing valuation لازم است.

## FEAT-P1-012 — Price source stale policy
**STATUS: DEEP-FIXED** — soft-delete financial matrix
Staleness باید per assetCategory/quoteType/source باشد؛ «قیمت قدیمی» باید در API output قابل مشاهده باشد.

## FEAT-P1-013 — Price dedupe identity
**STATUS: DEEP-FIXED** — notifications non-authoritative
Dedupe key باید حداقل `(assetCategory,instrumentId,quoteMarket,priceCurrency,sourceId,time bucket)` باشد. Symbol-only dedupe ممنوع.

## FEAT-P1-014 — Corporate actions source/target
**STATUS: DEEP-FIXED** — reports via query API
Merger, spin-off, rights, symbol/ISIN change باید source/target instrument و effective date داشته باشند؛ symbol change نباید historical transaction را rewrite کند.

## FEAT-P1-015 — Iranian stock market calendar
**STATUS: DEEP-FIXED** — import dry-run required
T+2، تعطیلات، session، lotSize، priceTick و settlement باید versioned/configurable باشند، نه hard-coded در feature logic.

## FEAT-P1-016 — Iranian loan convention scope
**STATUS: DEEP-FIXED** — duplicate detection beyond operationId
مرابحه، قرض‌الحسنه، فروش اقساطی، جعاله و سایر loanTypeIrها نباید صرفاً label باشند اگر فرمول/fee/penalty متفاوت دارند. هر type باید policy/profile مشخص یا explicit unsupported داشته باشد.

## FEAT-P1-017 — Penalty legal/policy version
**STATUS: DEEP-FIXED** — offline core without network
Loan penalty formula نباید به‌عنوان حقیقت حقوقی ثابت hard-code شود. باید policy/version/effectiveDate و امکان manual override مستند داشته باشد.

## FEAT-P1-018 — Fund performance double-count
**STATUS: DEEP-FIXED** — license gates features not data
Dividend + NAV drop + reinvest باید در total return طوری ترکیب شوند که یک سود دوبار شمرده نشود. Performance engine باید cash flow-aware باشد.

## FEAT-P1-019 — Metals valuation source
**STATUS: DEEP-FIXED** — disable feature keeps data
قیمت طلا باید market/price type/purity/unit و asOf داشته باشد. قیمت 24K نباید silently برای 18K استفاده شود.

## FEAT-P1-020 — Physical delivery continuity
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
انتقال Digital Metal → Physical Asset باید lineage و cost basis منتقل‌شده را حفظ کند؛ cost نباید صفر یا market value جدید شود مگر policy صریح.

## FEAT-P1-021 — Recurring duplicate generation
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
Income/Expense recurring و Bills هر دو scheduler دارند. باید idempotency key برای occurrence داشته باشند تا یک دوره دوبار تولید نشود.

## FEAT-P1-022 — Recurring date semantics
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
`nextOccurrence`/`nextDueDate` باید business date و timezone کاربر داشته باشد؛ `createdAt` UTC نباید مبنای schedule باشد.

## FEAT-P1-023 — Budget income override provenance
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
`totalIncome` override باید source، enteredAt، reason و version داشته باشد؛ وگرنه گزارش تاریخی قابل audit نیست.

## FEAT-P1-024 — Budget allocation currency
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
Budget/envelope باید currency مشخص داشته باشد و allocation از transaction با currency متفاوت بدون conversion policy ممنوع باشد.

## FEAT-P1-025 — Goal currency
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
Goal entity فعلاً IRR-centric است ولی contribution exchangeRate دارد. Goal باید یا تک‌ارزی v1 باشد و enforce کند، یا multi-currency را با valuation policy کامل پشتیبانی کند.

## FEAT-P1-026 — Account available balance
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
Available balance فعلاً soft warning برای pending cheques است. باید distinction `ledger/available/cleared/pending` در Core و Reports ثابت باشد.

## FEAT-P1-027 — Brokerage/Platform cash ledger reuse
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
FIF ETF و Stocks نباید دو cash balance برای یک brokerage بسازند؛ Metals/Crypto نیز باید cash ledger مستقل و قابل reconcile داشته باشند.

## FEAT-P1-028 — Attachment ownership
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
Featureها attachmentPathهای مستقل دارند در حالی که Document Management وجود دارد. قرارداد باید مشخص کند attachment metadata کجاست و Feature فقط documentId نگه می‌دارد یا legacy path را حفظ می‌کند.

## FEAT-P1-029 — API serialization
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
تمام Public API examples باید primitive serializable باشند: DecimalString، ISO date، JSON-safe enum. `Decimal` object در response ممنوع.

## FEAT-P1-030 — Pagination/filter contract
**STATUS: RESOLVED** — decision locked; implement per resolution doc.
List APIs باید pagination, sort, date range, status, source و stable ordering داشته باشند؛ مخصوصاً transaction historyهای بزرگ.

---

# P2 — تمیزی و جلوگیری از بدهی فنی

1. فایل‌های `spec.md` کوتاه فقط pointer/index باشند و contract مستقل نداشته باشند.
2. نام‌های `tradeId`, `transferId`, `assetKey`, `symbol`, `accountTransactionId` در یک Naming Glossary canonical شوند.
3. `relatedFeature + relatedId` polymorphic links باید یک policy واحد برای validation/reconcile داشته باشند.
4. هر enum فقط یک owner داشته باشد؛ Feature enum محلی فقط extension واقعی باشد.
5. هر Feature یک README/index کوتاه داشته باشد و جزئیات در همان سند canonical باقی بماند؛ duplicate spec ممنوع.
6. APIهای deprecated باید تاریخ deprecation و migration mapping داشته باشند.
7. هر Feature باید یک `Feature Capability Contract` داشته باشد: required core capabilities، optional integrations، standalone behavior.
8. UI page count از domain entity count مستقل باشد؛ entity جدید لزوماً صفحه جدید نمی‌سازد.

---

# ماتریس اولویت اجرا

| مرحله | کار |
|---|---|
| 1 | P0-001 تا P0-050 — رفع تناقض‌های مالی/هویتی/standalone |
| 2 | Golden fixtures برای Loan/Crypto/Stocks/FIF/Metals/Cheque |
| 3 | Reconcile contract برای تمام snapshotها |
| 4 | P1 historical FX/price/date/fee/reversal |
| 5 | P1 recurring/budget/goal/report |
| 6 | P2 naming/spec cleanup |
| 7 | SPEC-FREEZE فقط پس از عبور همه P0ها |

---

# Golden Fixtureهای اجباری قبل از implementation freeze

## Loan
- borrowed + origination fee + monthly fee
- lent + repayment
- Qarz + service fee
- declining + irregular first period
- variable rate change
- partial payment allocation
- early payment + recast
- penalty cap
- multi-currency settlement
- cancel before/after payment

## Crypto
- BUY fee in quote
- BUY fee from base
- SELL fee from base
- internal transfer no fee
- internal transfer network fee
- external send/receive
- C2C with fee on from/to
- bridge ERC20 → TRC20
- WAC/FIFO opening position
- reversal of transfer with fee burn

## Stocks Iran
- T+2 settlement
- buy/sell fee breakdown
- dividend gross/withholding/net
- bonus
- split/reverse split
- rights issue/exercise/sale
- symbol/ISIN change
- merger/spin-off
- brokerage cash reconciliation

## Fixed Income Funds
- issuance/redemption
- ETF via brokerage
- NAV ≠ subscription ≠ redemption
- distribution dividend
- reinvest two-leg operation
- redemption fee
- historical NAV valuation
- performance without double-count

## Metals
- 18K vs 24K
- purity ratio
- gram/kg/oz input normalization
- coin count
- buy/sell fee currency
- digital → physical delivery
- platform cash reconciliation
- historical price + FX

## Core cross-feature
- Income correction
- Expense split
- Cheque pending→cleared→bounced
- Budget link after reversal
- Goal allocation from income without double-count
- Tax payment exactly one cash leg
- Historical report with missing price/FX

---

# Definition of Done برای هر Feature

قبل از شروع کدنویسی Feature فقط وقتی آماده است که:

- [ ] Source of Truth مشخص باشد.
- [ ] Snapshot/derived fields قابل rebuild باشند.
- [ ] هیچ FK اجباری به Feature اختیاری وجود نداشته باشد.
- [ ] Public API canonical و JSON-safe باشد.
- [ ] همه مبالغ DecimalString باشند.
- [ ] currency + FX direction مشخص باشد.
- [ ] businessDate/date semantics مشخص باشد.
- [ ] fee gross/net/currency/provenance مشخص باشد.
- [ ] reversal فقط از Core انجام شود.
- [ ] operationId برای عملیات چندردیفی وجود داشته باشد.
- [ ] external reported از calculated جدا باشد.
- [ ] offline operation بدون price provider کار کند.
- [ ] historical valuation از current data استفاده نکند.
- [ ] migration هیچ fieldی را silent drop نکند.
- [ ] حداقل golden fixtureهای Feature تعریف شده باشند.
- [ ] standalone mode تست‌پذیر باشد.
- [ ] Feature بدون ساخت صفحه‌های اضافی قابل استفاده باشد.

---

## نتیجه نهایی

این سند عمداً **هیچ Feature اصلی را rewrite نمی‌کند**. هدف آن این است که تمام مواردی که قبل از implementation باید یک تصمیم واحد داشته باشند در یک register قرار گیرند.

بعد از حل P0ها، هر Feature فقط باید بخش‌های متناقض خودش را اصلاح کند؛ مدل موجود و fieldهای فعلی حفظ می‌شوند و deprecated data فقط با migration mapping کنار گذاشته می‌شود.
