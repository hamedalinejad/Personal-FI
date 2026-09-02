# Personal-FI — Deep Financial / Feature Audit
## تاریخ ممیزی: 2026-09-02

> این سند **Audit-only** است: در این مرحله Featureها بازنویسی نشده‌اند و هیچ field موجودی عمداً حذف نشده است.
> هدف: پیدا کردن باگ، تناقض، خلأ قراردادی و نیاز محاسباتی پیش از implementation؛ با تمرکز ویژه بر دقت حسابداری، چندارزی، سرمایه‌گذاری، و استفاده مستقل هر Feature.

---

# 1) استاندارد بررسی

هر عدد مالی باید از این زنجیره قابل توضیح باشد:

```text
Raw Fact
  → Financial Operation
  → Domain Ledger
  → Journal / Cash
  → Calculation Engine
  → Valuation
  → Report
```

اصل‌ها:

- Snapshot = projection/cache؛ نه SoT.
- Financial Operation = atomic boundary + operationId.
- Retry = همان operationId؛ command متفاوت = IDEMPOTENCY_CONFLICT.
- Reversal = operation جدید؛ correction = reversal + operation جدید.
- Amount/price/rate/quantity = decimal string در مرز و decimal engine در محاسبه.
- Historical report = price/FX/cash/debt as-of؛ نرخ یا قیمت امروز ممنوع.
- Offline = بدون شبکه هم ثبت، rebuild، report و recovery قابل انجام است.
- Feature استقلال خود را با API/Port حفظ می‌کند؛ import مستقیم repository Feature دیگر ممنوع.

---

# 2) شدت

| سطح | معنی |
|---|---|
| **P0** | محاسبه بالقوه غلط، double-count، از دست رفتن داده، شکست lineage/atomicity/Standalone؛ قبل از SPEC Freeze حل شود |
| **P1** | خلأ مهم که implementation را مجبور به حدس‌زدن می‌کند |
| **P2** | بهبود/Technical Debt/UX |
| **N** | نیاز محصولی یا قراردادی؛ الزاماً bug نیست |

---

# 3) P0 — Cross-Cutting

| ID | حوزه | مشکل/ریسک | روش حل | معیار پذیرش |
|---|---|---|---|---|
| X-001 | Reversal | بعضی Featureها هنوز مسیر دستی void+reversal دارند در حالی که Core مالک reversal است. | فقط `core.reverseOperation()`؛ Feature فقط `buildReversalPlan`. | یک reverse تمام cash/domain/journal را دقیقاً یک‌بار معکوس کند. |
| X-002 | Correction | الگوی اصلاح باید original + reverse + corrected را یک operation graph ببیند. | `reversesOperationId` + operationId جدید. | هیچ double cash effect. |
| X-003 | Identity | Crypto در بخش‌های مختلف `instrumentId` و `assetKey` را identity نشان می‌دهد. | فقط `ref_instruments.id` = canonical identity؛ assetKey=index. | rebuild/query بدون symbol/assetKey identity. |
| X-004 | Snapshot | بعضی متن‌ها balance/holding/cashBalance را مثل SoT توصیف می‌کنند. | ledger/journal = SoT؛ snapshot فقط projection. | فساد snapshot با reconcile تشخیص داده شود. |
| X-005 | API types | نمونه‌های API هنوز در بعضی جاها Decimal/number مالی دارند. | public API فقط decimal string. | JSON مثال‌ها و contractها فاقد number مالی باشند. |
| X-006 | Polymorphic | `relatedFeature + relatedId` FK واقعی ندارد. | atomic validation + `acc_transaction_links` + reconcile orphan. | orphan=0 در fixture. |
| X-007 | Enum | relatedFeature/account type در بعضی Featureها local تعریف شده. | single Core enum owner. | CI/doc check against Core enum. |
| X-008 | FX | واژه «نرخ تتر» با baseCurrency عمومی قاطی شده. | canonical `exchangeRateToBase`; quoteCurrency جدا. | base=IRR/USD/EUR/USDT با یک semantic. |
| X-009 | FX attribution | فقط total base P&L کافی نیست و منشأ سود مبهم می‌ماند. | asset price effect + FX effect + fee effect + cash-flow effect. | مثال BTC/IRR پایین. |
| X-010 | Historical | historical report اگر latest rate/price بگیرد غلط می‌شود. | `asOf`, `priceAsOf`, `fxAsOf`, settlement cutoff. | تغییر قیمت امروز تاریخچه را عوض نکند. |
| X-011 | Fee | feeAmount و fee breakdown ممکن است دوبار در cost/P&L اثر کنند. | CanonicalFeeEvent + explicit treatment. | هر fee یک economic effect. |
| X-012 | Precision | گردکردن در Feature می‌تواند با engine متفاوت شود. | یک Precision/Rounding Engine + policyVersion. | same input/version => same result. |
| X-013 | Offline | valuation/rebuild ممکن است به provider وابسته شود. | local last-known/manual price و stale flag. | airplane mode transaction/rebuild موفق. |
| X-014 | Durability | SQLite commit و IDB persist دو state دارند. | pendingCommit + recovery state machine. | crash بین دو مرحله منجر به lost financial op نشود. |
| X-015 | Ordering | rebuild بعضی جاها date-only است. | business/effective date + createdAt + stable id. | two same-day events deterministic. |
| X-016 | Source of Truth | domain + journal + cash ممکن است سه بار در report جمع شوند. | هر metric یک SoT مشخص داشته باشد. | no duplicate aggregation. |
| X-017 | Data preservation | legacy/canonical fields در بعضی سندها overlap دارند. | legacy read-only; canonical new writes; raw preserved. | import/export roundtrip field loss=0. |
| X-018 | Audit | actor/source/reason باید در اصلاح حساس حاضر باشد. | fin_audit_log + operationId. | repair/reversal traceable. |
| X-019 | Reconcile | هر projection باید rebuild path داشته باشد. | ReconcileAdapter + rebuildXFromLedger. | intentional corruption => mismatch. |
| X-020 | Architecture | prose alone استقلال Feature را enforce نمی‌کند. | ESLint/architecture tests/no direct repository imports. | illegal dependency fails CI. |

---

# 4) P0 — نمونه طلایی Crypto: خرید با IRR و تغییر هم‌زمان BTC و USDT

## سناریو

Base Currency = IRR

در زمان خرید:

```text
quantity = 0.2 BTC
BTC/USDT = 50,000
USDT/IRR = 100,000
```

ارزش خرید:

```text
0.2 × 50,000 × 100,000
= 1,000,000,000 IRR
```

در تاریخ بعد:

```text
BTC/USDT = 45,000    ← BTC نسبت به USDT افت کرده
USDT/IRR = 150,000   ← USDT نسبت به IRR رشد کرده
```

ارزش جاری:

```text
0.2 × 45,000 × 150,000
= 1,350,000,000 IRR
```

بنابراین:

```text
P&L in IRR = +350,000,000 IRR
```

ولی در خود USDT:

```text
0.2 × (45,000 - 50,000)
= -1,000 USDT
```

## Attribution بدون double-count

### اثر حرکت قیمت BTC با FX اولیه

```text
assetPriceEffect
= q × (P1-P0) × FX0
= 0.2 × (-5,000) × 100,000
= -100,000,000 IRR
```

### اثر حرکت FX روی قیمت فعلی BTC

```text
fxEffect
= q × P1 × (FX1-FX0)
= 0.2 × 45,000 × 50,000
= +450,000,000 IRR
```

### جمع

```text
-100,000,000 + 450,000,000
= +350,000,000 IRR
```

## قرارداد جدید موردنیاز برای Valuation/Reports

```text
valueAtAsOfBase
costAtBookBase
pnlBase
assetPriceEffectBase
fxEffectBase
feeEffectBase
externalCashFlowEffectBase
realizedPnlBase
unrealizedPnlBase
```

**ممنوع:**

```text
(currentPriceUSDT - averageBuyUSDT) × quantity
```

به‌عنوان P&L نهایی کاربر base=IRR.

همچنین:

```text
currentValueIRR - historicalCostIRR
```

باید قابل decomposition باشد؛ صرفاً یک total مبهم کافی نیست.

## Acceptance Tests

1. BTC ↓ / USDT-IRR ثابت → P&L منفی.
2. BTC ثابت / USDT-IRR ↑ → P&L مثبت FX.
3. BTC ↓ / USDT-IRR ↑ → ممکن است P&L مثبت باشد.
4. BTC ↑ / USDT-IRR ↓ → asset gain ممکن است FX را خنثی کند.
5. fee در USDT، BTC، IRR و asset دیگر باید جدا و فقط یک بار اثر کند.
6. تغییر baseCurrency فعلی کاربر نباید historical as-booked را rewrite کند.

---

# 5) P0 — Crypto

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| CR-001 | `instrumentId` و `assetKey` هویت دوگانه شده‌اند. | فقط instrumentId canonical؛ assetKey derived mapping. |
| CR-002 | quantity / netQuantity در بخش‌های مختلف semantics یکسان ندارند. | grossQuantity + netQuantity + feeQuantity؛ holding فقط net effects. |
| CR-003 | BUY با fee از asset در متن‌های مختلف holding=1 و holding=0.999 دارد. | `feePresence=fee_from_base_asset` ⇒ net=0.999؛ fee_in_quote ⇒ net=1. |
| CR-004 | C2C BUY leg مقدار gross/net را روشن نمی‌کند. | grossReceived, feeQuantity, netReceived. |
| CR-005 | C2C destination cost گاهی از market value نتیجه می‌شود. | transferredCost = released source cost + allocated acquisition fees. |
| CR-006 | rebuild snippet با assetKey/symbol filter دارد. | rebuild با holdingId/instrumentId. |
| CR-007 | `totalFeesPaidBase` با reverse متناقض است. | جدا کردن `effectiveFeesBase` از lifetime posted/audit metric. |
| CR-008 | network fee با fee_from_received ممکن است دوبار کم شود. | یک FeeEvent؛ invariant gross=net+fee در same-asset mode. |
| CR-009 | price provider نباید transaction correctness را block کند. | trade price از خود command؛ price API فقط suggestion/valuation. |
| CR-010 | transfer internal نباید sell+buy شود. | transfer_out/in + cost carry + realized=0. |
| CR-011 | bridge ERC20→TRC20 ساده transfer نیست. | bridge operation + source/target instruments + transferred cost + fee burn. |
| CR-012 | external receive بدون cost basis مشخص P&L آینده را خراب می‌کند. | user cost/F MV/zero-basis policy صریح. |
| CR-013 | airdrop/gift/staking/reward اقتصادی متفاوت‌اند. | economicKind + cost/income policy مستقل. |
| CR-014 | fee asset غیر از base/quote multi-asset است. | fee asset instrument + historical rate/price + fee journal. |
| CR-015 | acquisition date/lots باید برای FIFO آینده حفظ شود. | acquiredAt/businessDate/operationId raw preserve. |

---

# 6) P0 — Stocks Iran

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| ST-001 | TradeDate و SettlementDate در گزارش ممکن است قاطی شوند. | P&L با tradeDate؛ cash with settlementDate. |
| ST-002 | CAها باید در rebuild لحاظ شوند. | CorporateActionEngine تنها transform. |
| ST-003 | rights/fractional/cash-in-lieu allocation دقیق نیست. | entitlement + fractionalPolicy + cashInLieu event. |
| ST-004 | symbol change identity را نباید عوض کند. | instrumentId ثابت + symbol history. |
| ST-005 | adjusted prices نباید raw history را overwrite کنند. | raw immutable + derived adjusted series. |
| ST-006 | feeTax و tax liability مستقل‌اند. | feeTax فقط transaction cost؛ tax_events جدا. |
| ST-007 | dividend gross/withholding/net نیاز به 3 value دارد. | grossDividend + withholding + net cash. |
| ST-008 | transfer brokerage→brokerage باید cost carry باشد. | transfer CA/event; realized=0. |
| ST-009 | delisting/worthless share policy غایب/ناقص است. | explicit write-off/disposal operation. |
| ST-010 | lot/tick/market rules باید input validation بدهند. | registry-driven constraints. |
| ST-011 | P&L باید quantity/price/FX/fee decomposition داشته باشد. | attribution output مثل Crypto. |
| ST-012 | provider mapping با symbol خام خطرناک است. | providerSymbol+market+priceProviderId. |

---

# 7) P0 — Fixed Income Funds

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| FI-001 | NAV و transactionPrice نباید یکی فرض شوند. | separate fields and engines. |
| FI-002 | ETF market price و NAV متفاوت‌اند. | valuationMode explicit. |
| FI-003 | Distribution income با unrealized return نباید جمع شود. | income / realized / unrealized buckets. |
| FI-004 | Reinvest نباید income را دو بار ثبت کند. | one operation with income leg + acquisition leg; no duplicate bank cash. |
| FI-005 | management fee treatment مبهم می‌تواند cost/P&L را خراب کند. | FeeTreatment explicit. |
| FI-006 | subscription/redemption settlement dates و cutoff باید ثبت شوند. | application/trade/settlement timestamps. |
| FI-007 | predictedProfit نباید economic P&L باشد. | EXTERNAL_REPORTED/forecast only. |
| FI-008 | brokerage cash برای FIF ETF نباید balance موازی بسازد. | shared broker cash account. |
| FI-009 | historical NAV priceSource/marketDate لازم است. | immutable price observations. |
| FI-010 | Period Return فقط current unrealized نیست. | opening value + flows + income + realized + closing. |

---

# 8) P0 — Metals

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| ME-001 | quantityMg و quantityCoins دو SoT بالقوه‌اند. | quantityMg تنها SoT؛ coin count derived/input helper. |
| ME-002 | gross/fine quote basis باید همیشه معلوم باشد. | `quoteBasis` mandatory on price. |
| ME-003 | pricePerMg of 18K و 24K قابل‌جایگزینی نیست. | purity-aware quote. |
| ME-004 | gold coin ≠ generic gold bullion. | instrument/quote semantics مستقل. |
| ME-005 | platform cashBalance هنوز در proseهای مختلف متفاوت است. | canonical cash account + projection. |
| ME-006 | request physical delivery نباید الزاماً holding را debit کند. | requested/processing = request state؛ delivered = economic transfer. |
| ME-007 | delivery cancellation بعد از debit نیاز به reverse دارد. | no debit before delivery یا explicit reservation model. |
| ME-008 | delivery fee و trading fee جدا هستند. | separate FeeCategories. |
| ME-009 | metals→physical باید carrying cost را منتقل کند. | sourceOperationId + transferred cost basis. |
| ME-010 | making/labor/tax components نیاز به breakdown دارند. | generic fee/tax components with treatment. |

---

# 9) P0 — Physical Assets

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| PA-001 | write-off باید carrying amount را از current market value جدا کند. | loss = released carrying value − residual proceeds. |
| PA-002 | purchasePrice header پس از multiple acquisitions SoT نیست. | pa_transactions SoT. |
| PA-003 | maintenance expense ممکن است با Expense دوباره ثبت شود. | one economic operation. |
| PA-004 | capital improvement ≠ maintenance. | capitalized improvement vs expense. |
| PA-005 | sale fee/tax باید جدا شود. | disposal fee events. |
| PA-006 | theft/insurance recovery lifecycle نیاز دارد. | write-off + recovery event. |
| PA-007 | revaluation باید unrealized باشد. | valuation event فقط. |
| PA-008 | physical gold received from Metals باید lineage داشته باشد. | sourceFeature/sourceOperation/source transaction. |
| PA-009 | currency/FX باید روی خرید و valuation تاریخی حفظ شود. | original currency + exchangeRateToBase. |

---

# 10) P0 — Loan

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| LN-001 | `effectiveDate <= dueDate` برای variable rate کافی نیست. | rate selection by accrual interval. |
| LN-002 | dayCount و periodBased rate precedence مبهم است. | explicit calculation mode. |
| LN-003 | grace capitalization کامل مشخص نشده. | explicit accrue/capitalize/forgive policy. |
| LN-004 | partial payment باید residual هر component را نگه دارد. | component-level outstanding state. |
| LN-005 | feeDue/feePaid/waived جدا لازم‌اند. | assessment vs settlement records. |
| LN-006 | early payment باید schedule version بسازد. | immutable schedule snapshots. |
| LN-007 | last installment residual باید exact باشد. | final principal = exact remaining principal. |
| LN-008 | multi-currency repayment ممکن است FX gain/loss واقعی بسازد. | contractual currency + settlement currency + book FX + explicit FX realization. |
| LN-009 | multiple draw facilities نیاز draw operations دارند یا باید v1 explicitly forbidden شوند. | decide and document. |
| LN-010 | waiver/write-off/settlement discount باید operation مستقل باشد. | explicit adjustment operation. |
| LN-011 | refinance/restructure/reschedule lineage لازم دارد. | new schedule version + parent operation. |
| LN-012 | penalty compounding باید policy داشته باشد. | explicit penalty accrual rule. |
| LN-013 | borrowed و lent journal mapping یکسان نیست. | separate mapping. |
| LN-014 | cancel بعد از disbursement باید canonical reverse داشته باشد. | Core reversal subject to no-later-payment guard. |
| LN-015 | Loan-only local settlement باید پول را در یک local cash account قابل گزارش نگه دارد. | LocalSettlementAdapter → fin_account. |

---

# 11) P0 — Accounts & Banking

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| AC-001 | `accountType` چند enum متضاد دارد. | canonical `accountKind`; legacy mapping. |
| AC-002 | `cardNumber` خام با Deep Lock متناقض است. | last4/token only. |
| AC-003 | `credit_account` و negative balance policy مبهم است. | v1 reject negative unless explicit liability model. |
| AC-004 | archive account فقط با zero balance کافی نیست اگر commitments وجود داشته باشند. | zero ledger + no blocking commitments. |
| AC-005 | IBAN/accountNumber uniqueness scope نیازمند precision است. | partial unique indexes + institution scope. |
| AC-006 | fee transfer باید یک economic leg باشد. | separate fee operation/lines. |

---

# 12) P0 — Income / Expense

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| IE-001 | correction docs هنوز manual reversal + new acc دارند. | Core reversal only. |
| IE-002 | future-date باید با businessDate ارزیابی شود. | user timezone businessDate. |
| IE-003 | refund/chargeback مسیر مستقل لازم دارد. | reversal/refund command. |
| IE-004 | investment cash flows نباید Income/Expense عادی تلقی شوند. | investment operation classifications. |
| IE-005 | recurring و Bills duplication ممکن است. | source exclusivity + unique occurrence. |
| IE-006 | category باید به chart of accounts mapping داشته باشد. | canonical category→COA mapping. |
| IE-007 | standalone feature باید با CashSettlementPort قابل اجرا باشد یا requirement صریحاً Accounts-required باشد. | document per-feature dependency. |

---

# 13) P0 — Cheque

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| CH-001 | clear→bounce می‌تواند دو reversal ایجاد کند. | one reverseOperation for clear op. |
| CH-002 | dueDate نباید cash-date شود. | effectiveCashDate/clearedDate. |
| CH-003 | bounced receivable نیاز به state of receivable دارد. | cheque domain + cash reversal. |
| CH-004 | return/bounce fee جدا باشد. | fee event. |
| CH-005 | Sayadi + cheque number uniqueness/validation دقیق لازم است. | field validation + scoped unique. |
| CH-006 | pending payable در Net Worth اصلی نباشد. | separate committed metric. |
| CH-007 | partial clearing اگر unsupported است صریحاً reject شود. | v1 validation. |

---

# 14) P0 — Budget

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| BU-001 | `strictMode` نام hard-block دارد ولی rule soft است. | semantic rename or explicit soft-confirm contract. |
| BU-002 | spentAmount/totalSpent derived هستند ولی stored fields دارند. | mark snapshot + rebuild source. |
| BU-003 | expense reversal باید budget consumption را برگرداند. | links by operationId + reverse. |
| BU-004 | closeBudget ممکن است next budget را duplicate کند. | unique period + idempotent close. |
| BU-005 | manual income override audit/provenance لازم دارد. | sourceMode + reason. |
| BU-006 | cheque recognition timing باید یک policy global داشته باشد. | on_pending vs on_cleared. |
| BU-007 | budget transfer نباید cash/journal بسازد. | planning-only operation. |

---

# 15) P0 — Financial Goals

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| GO-001 | Goal currency با contributionهای چندارزی مبهم است. | fixed goal currency; convert each contribution as-of. |
| GO-002 | currentAmount باید derived/snapshot باشد. | contribution ledger + rebuild. |
| GO-003 | manual contribution فقط در funding mode مناسب باید cash move بسازد. | earmark vs segregated_cash. |
| GO-004 | withdrawal FIFO نیاز allocation lineage دارد. | withdrawal allocation records. |
| GO-005 | completed + withdrawal/reopen transition مشخص نیست. | state machine. |
| GO-006 | targetDate گذشته/ماه صفر edge case دارد. | validation + explicit immediate target behavior. |

---

# 16) P0 — Bills / Recurring

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| BR-001 | duplicate occurrence generation | unique `(brItemId, occurrenceKey)` + operation idempotency. |
| BR-002 | day 31 monthly recurrence drift | anchor day + clamp policy. |
| BR-003 | missed scheduler periods | catch-up policy. |
| BR-004 | autoCreateTransaction با confirmation semantics مختلف است. | mode=`manual|confirm|auto`. |
| BR-005 | scheduled amount vs actual paid amount | separate fields. |
| BR-006 | payment vs due date | payment operation uses paymentDate. |
| BR-007 | standalone execution | optional CashSettlementPort. |

---

# 17) P0 — Notification

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| NO-001 | dedupe وابسته به unread بودن است و بعد از read می‌تواند دوباره ایجاد شود. | event/occurrence identity independent of read. |
| NO-002 | background scheduler exact timing را تضمین نمی‌کند. | due reconciliation on app activation. |
| NO-003 | read/dismiss/snooze مفاهیم جدا هستند. | separate state or explicit v1 simplification. |
| NO-004 | category==relatedFeature mapping blind است. | explicit mapping table. |
| NO-005 | repeating custom reminder occurrence key ندارد. | deterministic recurrence key. |

---

# 18) P0 — Reports / Portfolio / Dashboard

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| RP-001 | نمونه‌های number مالی در Portfolio وجود دارد. | تمام money/price/rate fields = string. |
| RP-002 | historical net worth به price/FX/cash/debt as-of نیاز دارد. | one ValuationContext. |
| RP-003 | Portfolio و Reports includeCash semantics متفاوت‌اند. | one canonical wealth view + explicit cashScope. |
| RP-004 | wealthDelta ≠ P&L. | separate wealth movement attribution. |
| RP-005 | pending cheque باید metric جدا باشد. | committedAdjustedNetWorth. |
| RP-006 | investment return با cash flows مخدوش می‌شود. | period return with opening/flows/closing; TWR/MWR semantics. |
| RP-007 | dashboard widgets source timestamps متفاوت دارند. | shared asOf + per-widget watermark/stale. |
| RP-008 | snapshot بدون watermark unreliable است. | sourceWatermark. |
| RP-009 | export از stale snapshot خطرناک است. | rebuild or explicit stale warning/fail. |

---

# 19) P0 — Tax

| ID | مشکل/نیاز | روش حل |
|---|---|---|
| TX-001 | `tax_events` و `tax_records` دو نام/SoT هستند. | یک canonical entity؛ دیگری compatibility/view. |
| TX-002 | tax payment باید یک cash leg داشته باشد. | one Financial Operation. |
| TX-003 | tax refund نباید generic income باشد. | explicit tax refund operation. |
| TX-004 | source of tax liability با payment source متفاوت است. | separate sourceOperation/source fields and payment account. |
| TX-005 | tax rules باید versioned باشند. | ruleId + version + effective period. |
| TX-006 | legacy tax fields نباید new writes بگیرند. | linkedTaxEventId canonical. |

---

# 20) P1 — همه Featureها باید این قراردادها را تکمیل کنند

## 20.1 Data / Field

برای هر field:

```text
RAW / DERIVED / SNAPSHOT / EXTERNAL_REPORTED / LABEL
Owner
Editable?
SoT
Rebuild source
Migration status
```

هیچ field فقط به دلیل «قدیمی/زیاد» حذف نشود.

## 20.2 API

هر Feature فقط دو surface اصلی داشته باشد:

```text
commands
queries
```

Command:

```text
request.operationId
→ validate
→ atomic op
→ result.operationId
```

Public JSON = primitive/decimal strings.

## 20.3 Reversal

هر Feature مالی باید بتواند بگوید:

```text
original operation
→ affected domain rows
→ journal lines
→ cash legs
→ snapshot targets
→ reverse plan
```

## 20.4 Rebuild

```text
same ledger + same engineVersions + same asOf
→ same result
```

---

# 21) P1 — Valuation Context سراسری

در کل پروژه یک context واحد پیشنهاد/لازم است:

```typescript
interface ValuationContext {
  valuationAsOf: string;
  priceAsOf?: string;
  fxAsOf?: string;
  cashAsOf?: string;
  liabilityAsOf?: string;
  baseCurrency: string;
  valuationMode?: string;
}
```

همه Portfolio/Report/Feature valuationها باید همین semantics را map کنند.

---

# 22) P1 — Attribution Model سراسری

برای دارایی‌های چندارزی:

```text
Total P&L
├── Asset price effect
├── FX effect
├── Fees
├── Realized P&L
├── Unrealized P&L
└── External cash flows (not P&L)
```

**نکته:** external cash flow نباید سود تلقی شود. انتقال پول به پرتفوی wealth را بالا می‌برد ولی P&L ایجاد نمی‌کند.

برای transfer داخلی:

```text
Wealth Δ = 0
P&L = 0
Cost basis moves
```

برای network fee:

```text
Wealth Δ < 0
P&L effect = fee according to accounting policy
```

---

# 23) P1 — Investment Return vs Wealth Change

گزارش‌ها باید این چهار مفهوم را قاطی نکنند:

```text
Contribution / Withdrawal
Price return
FX return
Realized income / expense
```

مثال:

```text
1,000m IRR contribution
Asset unchanged
```

Wealth +1,000m است؛ P&L = 0.

---

# 24) P1 — Cash Ownership

طبق قرارداد فعلی، یک «جیب پول» نباید دو balance مستقل داشته باشد.

Canonical:

```text
fin_accounts + fin_journal_lines = cash truth
```

Feature cash tables مانند:

```text
inv_crypto_cash
brokerage cash projections
metals platform cash projection
```

نباید SoT مستقل شوند. اگر نگه داشته شوند:

```text
finAccountId FK
balance = derived/snapshot
```

---

# 25) P1 — Iranian Accounting Detail

برای پوشش جدی ایران باید این concepts در قراردادها جا بیفتند بدون اینکه UI را زیاد کنند:

- ریال canonical؛ تومان فقط display.
- businessDate شمسی/محلی در کنار storage Gregorian/UTC.
- IBAN/Shaba، بانک، شعبه، نوع حساب.
- چک صیادی و Sayadi ID.
- سود/کارمزد/جریمه وام به صورت component-level.
- settlement بورس و T+n.
- dividend و withholding.
- حق تقدم و افزایش سرمایه.
- صندوق صدور/ابطال و ETF.
- عیار/وزن خالص/اجرت فلز.
- cash delivery از فلز دیجیتال به فیزیکی.
- نرخ FX تاریخی در هر عملیات چندارزی.

---

# 26) P1 — Performance و سادگی

تعداد Feature زیاد قابل قبول است؛ تعداد Page زیاد نه.

الگوی پیشنهادی:

```text
9-ish main pages
+ contextual sheets/drawers
+ Feature APIs
+ Core engines
```

Heavy reports:

```text
background local rebuild
→ snapshot with watermark
→ UI reads result
```

UI نباید مستقیم SQL روی چند Feature اجرا کند.

---

# 27) Golden Fixture Pack — اجباری

## Core

- income
- expense
- transfer
- reversal
- correction
- fee
- multi-currency

## Crypto

- IRR buy / USDT valuation
- BTC down + USDT/IRR up
- BTC up + USDT/IRR down
- fee in quote
- fee in base asset
- C2C
- internal transfer
- network fee burn
- bridge
- external gift
- airdrop
- opening

## Stocks Iran

- buy/sell
- dividend gross/withholding/net
- bonus
- split/reverse split
- capital increase
- rights issue/exercise/sell
- brokerage transfer
- settlement delay
- delisting/write-off

## Funds

- issue
- redemption
- ETF buy/sell
- distribution
- reinvest
- NAV vs market
- fee treatment

## Metals

- 18K
- 24K
- coin
- fine/gross pricing
- buy/sell
- delivery
- delivery cancellation
- delivery fee
- metals→physical lineage

## Loan

- monthly declining
- weekly
- custom day count
- variable rate
- grace
- partial payment
- early payment
- fee due/paid/waived
- final residual
- multi-currency repayment
- reversal

---

# 28) Acceptance Matrix Before SPEC Freeze

| محور | شرط |
|---|---|
| Identity | یک canonical identity per asset |
| Money | decimal string everywhere |
| FX | direction + as-of + path |
| P&L | price/FX/fee/cash-flow attribution |
| Fee | one economic effect |
| Accounting | balanced journal |
| Cash | one SoT |
| Reversal | exact inverse |
| Idempotency | same operationId retry safe |
| Historical | deterministic as-of |
| Snapshot | rebuildable + watermark |
| Offline | no provider dependency for correctness |
| Standalone | Feature without Accounts UI works |
| API | commands/queries + serializable result |
| Data preservation | no silent field loss |
| Reconcile | expected vs actual |
| Fixtures | green before implementation release |

---

# 29) Priority Order پیشنهادی

## Gate 1 — قبل از code

1. Crypto identity/fee/net semantics
2. FX + attribution
3. Cash SoT
4. Reversal/correction
5. API decimal contract
6. ValuationContext
7. Date semantics
8. Standalone CashSettlement

## Gate 2 — financial engines

1. CostBasisEngine
2. FXEngine
3. ValuationEngine
4. LoanScheduleEngine
5. CorporateActionEngine
6. ReconciliationEngine

## Gate 3 — feature fixtures

Crypto → Loan → Stocks → Funds → Metals → Physical → Cheque → Income/Expense → Budget/Goals → Reports/Dashboard.

---

# 30) نکات مهمی که در همین نسخه تأیید شدند

1. **Crypto canonical identity contradiction**: global Core = instrumentId، ولی انتهای Crypto هنوز assetKey/exchangeId را identity می‌خواند.
2. **Crypto fee contradiction**: fee_from_base_asset در قسمت‌های مختلف gross و net را متفاوت به holding می‌دهد.
3. **Portfolio number leakage**: هنوز نمونه‌های `number` برای financial values وجود دارند.
4. **Income/Expense correction duplication**: متن‌های قدیمی manual reversal در کنار Core reversal باقی مانده‌اند.
5. **Metals delivery lifecycle**: درخواست تحویل نباید با انتقال واقعی دارایی یکی شود.
6. **Accounts enum collision**: accountType/accountKind چند contract متفاوت دارند.
7. **Missing FX attribution contract**: نرخ base محاسبه می‌شود ولی attribution price-vs-FX در یک خروجی یکپارچه تثبیت نشده.
8. **Missing single ValuationContext**: engines وجود دارند، اما contract واحد as-of هنوز باید سخت‌گیرانه شود.
9. **Field-Level-Data-Ownership-Matrix خالی است** و به‌عنوان مرجع field ownership فعلاً قابل اتکا نیست؛ این باید قبل از implementation تکمیل شود.
10. **چند سند مرجع مثل Currency-CrossRate / Price-Fetching با مسیرهایی که Featureها به آن‌ها لینک می‌دهند در checkout فعلی قابل resolve نبودند**؛ این باید به‌عنوان documentation integrity item بررسی شود، نه اینکه فرض شود سند وجود دارد.

---

# 31) نتیجه نهایی

جهت معماری فعلی پروژه بسیار مناسب است:

```text
Simple UI
Modular Features
Accounting Core
Offline-first
Decimal-safe
Rebuildable
Partial Licensing
```

اما برای یک سیستم حسابداری/سرمایه‌گذاری که قرار است **در ایران و در حالت چندارزی واقعاً قابل اعتماد باشد**، مهم‌ترین مرحله باقی‌مانده دیگر افزایش Feature نیست؛ بلکه بستن قراردادهای دقیق محاسباتی است.

قانون نهایی:

> هر عدد مالی باید بتواند جواب بدهد:
>
> «از کجا آمد؟ با چه نرخ و قیمتی؟ در چه تاریخ؟ با چه کارمزدی؟ در چه ارزی؟ چه مقدارش تغییر قیمت بوده؟ چه مقدارش FX بوده؟ چه مقدارش cash-flow بوده؟ و آیا قابل بازسازی است؟»

تا زمانی که این سؤال‌ها برای یک Feature پاسخ deterministic نداشته باشند، آن Feature از نظر SPEC آماده implementation نیست.
