# Deep Feature Audit — 2026-09-02

## هدف
این سند **بازنویسی Featureها نیست**. رجیستر جامع باگ‌ها، تناقض‌ها، خلأهای قراردادی و روش حل آن‌هاست تا قبل از شروع implementation، SPECها به یک قرارداد قابل‌اجرا تبدیل شوند و هیچ field/business rule موجود حذف نشود.

## Scope
بررسی عمیق اسناد فعلی Featureها و تطبیق با قراردادهای Core، مخصوصاً:
- Accounts & Banking
- Income / Expense
- Cheque
- Debt & Loan
- Crypto
- Stocks Iran + Corporate Actions
- Fixed Income Funds
- Metals
- Physical Assets
- Budget
- Goals
- Bills / Recurring
- Notification
- Reports
- Dashboard
- Portfolio / Wealth
- Tax

مرجع‌های اصلی برای تطبیق: `Canonical-Financial-Operation.md`, `Financial-Invariants.md`, `Data-Model-Relationship-Matrix.md`, `Date-Semantics-Matrix.md`, `core/types/types.md`.

---

# P0 — باید قبل از SPEC Freeze حل شوند

| ID | حوزه | باگ / تناقض | اثر | راه‌حل canonical | وضعیت |
|---|---|---|---|---|---|
| P0-001 | Core/All | بعضی Featureها هنوز الگوی قدیمی `void + reversal` را خودشان توصیف می‌کنند، در حالی که Core مالک reversal است. | دو implementation و double reversal | فقط `core.reverseOperation`; Feature فقط `FinancialOperationAdapter.buildReversalPlan` | OPEN |
| P0-002 | Income/Expense | `correctIncome/correctExpense` هم reversal دستی acc و هم تراکنش جدید را مرحله‌بندی می‌کنند؛ با Core reversal می‌تواند دوباره cash را معکوس کند. | double cash movement | correction = یک Financial Operation جدید با `reversesOperationId`; Core تمام legs را معکوس کند | OPEN |
| P0-003 | All | `isVoided` به‌تنهایی برای تشخیص lineage کافی نیست. | زنجیره اصلاح/برگشت قابل ابهام | `operationId`, `reversesOperationId`, `reversalOperationId` و domain lineage اجباری | OPEN |
| P0-004 | All | snapshotهای مالی در برخی Featureها هنوز در prose به‌عنوان موجودی جاری معرفی می‌شوند. | drift و گزارش غلط | ledger/domain journal تنها SoT؛ snapshot فقط projection و rebuildable | OPEN |
| P0-005 | All | برخی APIهای Feature-local هنوز `Decimal` object در خروجی نمونه دارند. | serialization و API inconsistency | Public API فقط primitive؛ مبلغ = decimal string | OPEN |
| P0-006 | All | برخی جدول‌ها `accountId` اجباری و همزمان Standalone معرفی شده‌اند. | standalone غیرممکن | FK به Accounts در حالت Standalone nullable/adapter-based؛ domain core مستقل | OPEN |
| P0-007 | All | polymorphic `relatedFeature/relatedId` بدون enforce واقعی FK ممکن است dangling شود. | orphan links | validate در operation + link registry + FK واقعی هرجا ممکن | OPEN |
| P0-008 | All | `relatedFeature` در Core بسته است اما برخی docs هنوز local string تعریف می‌کنند. | typo و mapping failure | تنها `core/types/types.md` منبع enum | OPEN |
| P0-009 | All | ترتیب زمانی بعضی rebuildها فقط `date` است. | دو رویداد یک روز نتیجه nondeterministic | order = business/effective date + createdAt + stable id/sequence | OPEN |
| P0-010 | All | distinction بین `businessDate` و `createdAt` در همه Featureها یکسان نیست. | گزارش تاریخی غلط | Date-Semantics-Matrix؛ businessDate برای business reports | OPEN |
| P0-011 | All | برخی نرخ‌ها هنوز در متن «نرخ تتر» نامیده شده‌اند در حالی که Core قرارداد `baseCurrency` عمومی دارد. | FX semantic bug | نام canonical = `exchangeRateToBase`; quote/rate source جدا | OPEN |
| P0-012 | All | base currency در بعضی داده‌ها implicit است. | بازسازی تاریخی غیرممکن | `fin_operations.baseCurrencyAtOperation` + rate snapshot immutable | OPEN |
| P0-013 | All | fee در بعضی Featureها total و breakdown است اما accounting treatment واحد ندارد. | double count fee | CanonicalFeeEvent + explicit treatment + one cash effect | OPEN |
| P0-014 | All | `feeAmount` ممکن است در currency متفاوت از transaction باشد و در بعضی فرمول‌ها مستقیم جمع می‌شود. | P&L غلط | fee conversion قبل از aggregation؛ currency equality guard | OPEN |
| P0-015 | All | صفر/منفی/precision constraints هنوز برای همه entityها یکسان نشده. | invalid balances | DB CHECK + domain validation + asset/currency precision policy | OPEN |
| P0-016 | All | idempotency فقط در Core توضیح داده شده ولی بعضی APIهای Feature operationId مستقل ندارند. | duplicate financial operation | تمام financial commands operationId اجباری | OPEN |
| P0-017 | All | retry با command متفاوت و operationId یکسان باید conflict شود ولی در Featureها مشخص نیست. | corruption | hash canonical command + `IDEMPOTENCY_CONFLICT` | OPEN |
| P0-018 | Accounts | `accountType` در ابتدای سند با enum legacy دیگری conflict دارد. | schema/API mismatch | یک canonical `accountKind`؛ legacy فقط mapping/migration | OPEN |
| P0-019 | Accounts | `cardNumber` خام هنوز در entity field وجود دارد در حالی که Deep Lock حذف PAN را می‌گوید. | امنیت | DB جدید فقط last4/token; migration read-only | OPEN |
| P0-020 | Accounts | `getAvailableBalance` چک‌های pending را کم می‌کند ولی transaction types/fees را باید دقیقاً یک‌بار حساب کند. | available غلط | query canonical commitment aggregation؛ available ≠ ledger | OPEN |
| P0-021 | Accounts | overdraft برای credit_account با rule «موجودی منفی ممنوع» conflict دارد. | domain ambiguity | credit account را v1 ممنوع یا مدل liability جدا؛ default reject negative | OPEN |
| P0-022 | Accounts | transfer fee در توضیح `±amount ± fee` است ولی cash leg دقیقاً برای fee همه مسیرها یکسان نیست. | cash mismatch | اصل transfer و fee دو leg مستقل در یک operation | OPEN |
| P0-023 | Income | `correctIncome` با manual reversal acc و سپس new acc row با Core reversal هم‌پوشانی دارد. | double movement | replace with Core reversal plan | OPEN |
| P0-024 | Expense | همان مشکل correction دو لایه در Expense وجود دارد. | double movement | same canonical correction pattern as Income | OPEN |
| P0-025 | Income/Expense | recurring template و Bills template هر دو قابلیت مشابه دارند. | duplicate generation | exclusive source policy + unique source link per occurrence | OPEN |
| P0-026 | Recurring | `br_occurrences` فقط یک `transactionId` polymorphic برای inc/exp دارد. | ambiguous FK | `financialOperationId` canonical + domain link typed/validated | OPEN |
| P0-027 | Recurring | `accountTransactionId` برای Standalone nullable نشده. | module cannot run alone | optional CashSettlementPort result | OPEN |
| P0-028 | Recurring | dedupe generation فقط بر اساس active/unread notification یا job state کافی نیست. | duplicate occurrence/transaction | unique `(brItemId, scheduledOccurrenceKey)` + operation idempotency | OPEN |
| P0-029 | Recurring | monthly + day 31 rule فقط «آخر ماه» دارد ولی بعد از آن آیا drift به 30/28 یا حفظ anchor روز 31؟ مشخص نیست. | schedule drift | anchor day + explicit month-clamp policy | OPEN |
| P0-030 | Cheque | `cleared → bounced` reversal flow هم `void` و هم reversal دارد؛ باید دقیقاً یک economic inverse باشد. | double reversal | original clear operation voided; one reversal operation | OPEN |
| P0-031 | Cheque | `reversalTransactionId` به acc reversal اشاره می‌کند ولی canonical reversal entity operation-based است. | lineage ambiguity | store `reversalOperationId`; acc link derived | OPEN |
| P0-032 | Cheque | `pending payable` تعهد است ولی Net Worth به‌صورت اختیاری آن را liability احتمالی می‌نامد. | double subtraction / unclear metric | دو metric رسمی: current net worth و committed-adjusted view | OPEN |
| P0-033 | Loan | `accountTransactionId` روی Loan و `ln_transactions` چند معنا پیدا می‌کند. | cash lineage ambiguity | cash leg فقط از operation; domain stores operation/cashLink | OPEN |
| P0-034 | Loan | `accountingTreatment` برای fee هم `reduction_of_carrying_amount` دارد و در prior docs `reduction_of_liability`. | journal inconsistency | canonical enum + explicit mapping table | OPEN |
| P0-035 | Loan | feeهای percentage_of_installment با installment قابل تغییر در early payment هستند ولی snapshot مبنای محاسبه fee مشخص نیست. | fee recalculation drift | fee context شامل scheduleVersion/period/installmentBase snapshot | OPEN |
| P0-036 | Loan | variable rate در `ln_rate_history` بر اساس dueDate انتخاب می‌شود، اما payment قبل/بعد از due date semantics کامل نیست. | interest mismatch | effectiveDate <= accrual period; define accrual boundaries | OPEN |
| P0-037 | Loan | day-count و period-based rate ممکن است همزمان اعمال شوند بدون contract precedence. | interest wrong | rate engine contract: rate basis + day count mutually explicit | OPEN |
| P0-038 | Loan | grace behavior برای declining/qarz تعریف شده ولی اثر accrued interest capitalization روی principal روشن نیست. | schedule wrong | explicit grace capitalization policy | OPEN |
| P0-039 | Loan | partial payment allocation به principal/interest/fee/penalty باید deterministic باشد اما priority policy در entity contract کافی نیست. | remaining balance wrong | canonical allocation waterfall/versioned policy | OPEN |
| P0-040 | Loan | early payment می‌تواند schedule را rebuild کند اما تاریخچه schedule version لازم است. | historical reconstruction failure | immutable `ln_schedule_snapshots` + version referenced by payments | OPEN |
| P0-041 | Loan | cancelLoan پس از پرداخت ممنوع است، ولی disbursement + no payment cancellation باید reversal operation کامل داشته باشد. | incomplete cancellation | cancellation = Core reversal + status operation | OPEN |
| P0-042 | Crypto | سند در یک بخش می‌گوید holding با `netQuantity` آپدیت شود و در rebuildهای قدیمی `tx.quantity` را مستقیم جمع می‌زند. | quantity inconsistency | transaction raw fields = gross/net explicit; rebuild uses `netQuantity` | OPEN |
| P0-043 | Crypto | C2C نمونه SELL/BUY دارد اما fee از BTC است و cost basis BTC باید fee treatment روشن داشته باشد. | P&L/cost mismatch | one operation with legs; fee asset leg; receiving asset cost policy explicit | OPEN |
| P0-044 | Crypto | transfer با fee از source asset هزینه را proportional منتقل می‌کند؛ economic fee باید جدا از transferred cost basis باشد. | cost basis ambiguity | split cost: transferred basis + fee-burn basis; fee policy in CostBasisEngine | OPEN |
| P0-045 | Crypto | `totalFeesPaidBase` به‌عنوان فیلد تجمعی «هرگز کاهش نمی‌یابد» با rebuild/reversal سازگار نیست. | fee report drift | define gross-ever vs net-effective fee; snapshot calculated from active operations | OPEN |
| P0-046 | Crypto | `assetKey` در legacy rebuild و `instrumentId` در canonical identity همزمان دیده می‌شوند. | identity split | `ref_instruments.id` sole identity; assetKey migration alias only | OPEN |
| P0-047 | Crypto | USDT settlement cash و USDT token asset جدا هستند اما conversion/valuation cross-link policy کافی نیست. | double count | cash account and asset instrument distinct; valuation role explicit | OPEN |
| P0-048 | Crypto | network fee و fee from received ممکن است همزمان مدل شوند. | double fee | `feePresence` mutually exclusive enum/state validation | OPEN |
| P0-049 | Crypto | wallet address چندگانه است ولی holding per-network است؛ transaction address ownership validation لازم است. | invalid on-chain attribution | address must belong to selected network/wallet | OPEN |
| P0-050 | Stocks | rebuild weighted average فقط buy/sell را در snippet نشان می‌دهد، در حالی که CAها quantity/cost را تغییر می‌دهند. | cost basis wrong | rebuild all supported CA types through CorporateActionEngine | OPEN |
| P0-051 | Stocks | `instrumentId` در holding به‌صورت string توصیف شده ولی Core ref instrument UUID است. | FK/type mismatch | `instrumentId: UUID` + actual FK | OPEN |
| P0-052 | Stocks | `feeAmount = breakdown sum` برای legacy rows ممکن نیست و zero/default کردن breakdown می‌تواند معنای historical را عوض کند. | data loss | legacy total preserved; breakdown nullable; new rows require invariant | OPEN |
| P0-053 | Stocks | `feeTax` هم transaction cost است و Tax Feature هم tax event دارد. | tax double count | transaction tax vs tax liability must have distinct event/treatment | OPEN |
| P0-054 | Stocks | T+n settlement و cashBalance تاریخی هنوز یک as-of reconstruction contract کامل ندارند. | historical portfolio wrong | tradeDate, settlementDate, effective cash date separated | OPEN |
| P0-055 | Stocks | Corporate Action lifecycle dates متعدد است اما entity اصلی فقط `date` را نشان می‌دهد. | CA timing wrong | store required CA lifecycle dates per action type | OPEN |
| P0-056 | Stocks | rights fractional entitlement/cash-in-lieu بدون precision/allocation policy می‌تواند سهم/پول تولید کند. | orphan value | fractional policy + cash-in-lieu operation | OPEN |
| P0-057 | Funds | NAV، transactionPrice و externalReportedProfit جدا شده‌اند ولی valuation as-of و stale policy باید mandatory باشد. | wrong NAV/P&L | `priceAsOf`, source, quoteType, stale state | OPEN |
| P0-058 | Funds | ETF cash از Stocks brokerage عبور می‌کند اما `brokerageId`/account semantics در همه paths یکسان نیست. | duplicate/missing cash | one CashSettlementPort route per venue | OPEN |
| P0-059 | Funds | accumulation fund و distribution fund treatment of NAV income needs explicit P&L decomposition. | return misclassification | separate NAV return, distributed income, reinvested income | OPEN |
| P0-060 | Metals | `purityRatio` و `purity` جداست ولی canonical identity برای same metal/purity باید unique enforce شود. | duplicate holdings | unique `(platformId, metalType, purityCode)` | OPEN |
| P0-061 | Metals | price per mg «same purity» است ولی valuation برای fine gold vs gross metal weight نیاز به quote semantics دارد. | valuation wrong | price quote must declare gross/fine basis | OPEN |
| P0-062 | Metals | `gold_coin` با حباب سکه و purityRatio استاندارد شده، اما cost/valuation basis of coin is not same as bullion. | wrong P&L | coin is separate instrument class; valuation provider quote basis explicit | OPEN |
| P0-063 | Metals | physical delivery کاهش holding می‌دهد و delivery fee cash می‌کاهد؛ transfer of ownership به Physical Asset lineage لازم است. | missing asset history | one delivery operation + target physical asset creation/link | OPEN |
| P0-064 | Physical Assets | write-off loss = `currentValue` در سند، که لزوماً carrying cost نیست. | P&L wrong | realized loss based on released carrying cost less proceeds; valuation adjustment separate | OPEN |
| P0-065 | Physical Assets | `purchasePrice` ثابت می‌ماند ولی چند خرید gold/coin روی asset واحد انجام می‌شود. | total cost ambiguity | derive cost pool from pa_transactions; snapshot only | OPEN |
| P0-066 | Physical Assets | maintenance expense در asset return لحاظ می‌شود ولی ممکن است Expense عمومی هم ساخته شود. | double expense | maintenance either linked expense operation, never duplicate | OPEN |
| P0-067 | Budget | `totalIncome` هم auto و هم manual override است؛ بعد از override definition of zero-based funding مبهم می‌شود. | budget allocation wrong | source mode `calculated|manual`; audit manual amount and source period | OPEN |
| P0-068 | Budget | strictMode در توضیح «محدود می‌شود» ولی صراحتاً ثبت واقعی نباید reject شود. | UI/API conflict | budget validation is advisory; financial operation never blocked by budget | OPEN |
| P0-069 | Budget | loan payment budget only expense portions را مصرف می‌کند، اما fee/interest/penalty allocation باید operation-linked و immutable باشد. | budget mismatch | link to payment operation and exact expense components | OPEN |
| P0-070 | Budget | rollover ساخت دوره بعد را atomic توصیف می‌کند ولی idempotency closeBudget مشخص نیست. | duplicate next budget | unique period + close operation idempotency | OPEN |
| P0-071 | Goals | `updateGoal` اجازه تغییر مستقیم `currentAmount` می‌دهد، در حالی که contribution ledger SoT است. | bypass accounting | remove direct financial mutation; only contributions/rebuild | OPEN |
| P0-072 | Goals | source=manual/transfer می‌تواند cash واقعی بسازد ولی transfer semantics با source=budget/income یکسان نیست. | double count | contribution source contract + CashSettlementPort only for actual cash movement | OPEN |
| P0-073 | Goals | withdraw FIFO روی contributions با mixed label/real cash می‌تواند برداشت واقعی را به contribution label متصل کند. | cash attribution wrong | separate earmarked accounting from actual cash ownership; withdrawal allocation policy | OPEN |
| P0-074 | Bills | `markAsPaid` با amount/date/accountId ممکن است occurrence amount را بدون immutable audit تغییر دهد. | history loss | occurrence amount override creates amendment event; original preserved | OPEN |
| P0-075 | Bills | `exchangeRateToBase` را «نرخ تتر» توصیف کرده در حالی که base currency عمومی است. | FX wrong | generic baseCurrency rate + source/asOf | OPEN |
| P0-076 | Notification | dedupe rule فقط unread notification را چک می‌کند؛ read notification می‌تواند دوباره ساخته شود. | duplicates | DB unique dedupe key per event occurrence, independent of read state | OPEN |
| P0-077 | Notification | `category` و `relatedFeature` mapping مستقیم ادعا شده ولی category شامل bills/loan/... و RelatedFeature values متفاوت/بیشتر دارد. | mapping bug | explicit mapping table; do not use equality as contract | OPEN |
| P0-078 | Reports | `rep_net_worth_snapshots` JSON/fields ممکن است با number schema ذخیره شوند و Financial-Invariants string است. | precision loss | all financial persisted/API values decimal TEXT | OPEN |
| P0-079 | Reports | `getNetWorth(date)` اگر از current cash snapshots استفاده کند historical as-of غلط می‌شود. | historical net worth wrong | reconstruct cash/asset/liability as-of date from ledgers/snapshots validated to date | OPEN |
| P0-080 | Reports | گزارش USDT/FX historical نیاز به conversion path دارد ولی بعضی outputs فقط یک rate می‌گیرند. | cross-currency wrong | valuation graph + conversionPath for >1 hop | OPEN |
| P0-081 | Portfolio | `calculateNetWorth` با `includeCashInWealth` دو semantic خروجی دارد و ممکن است UI آن را یک Net Worth بداند. | user confusion/double count | rename to `calculateWealthView` + explicit `cashScope`, or two typed outputs | OPEN |
| P0-082 | Portfolio | snapshot JSON نمونه از `number` استفاده می‌کند. | precision loss | decimal strings throughout snapshot JSON | OPEN |
| P0-083 | Portfolio | brokerage/platform cash ممکن است هم در investment valuation و هم cash section جمع شود. | double count | canonical component registry with `cashScope` and ownership | OPEN |
| P0-084 | Tax | `feeTax` در Investments و `tax_records` دو منبع مالیاتی بالقوه‌اند. | double tax | fee tax = transaction cost; tax liability = tax event; explicit relationship | OPEN |
| P0-085 | Tax | پرداخت Tax با `withdrawal-expense-tax` صحیح است، ولی رابطه با Expense generic باید reject/delegate واحد باشد. | duplicate ledger | one `payTax` financial operation | OPEN |
| P0-086 | Tax | investment transaction tax metadata legacy fields کنار `linkedTaxEventId` مانده‌اند. | competing SoT | new writes only central tax event; legacy read-only migration | OPEN |
| P0-087 | Dashboard | `getDashboardData` aggregate است ولی date/as-of consistency بین widgets صریح نیست. | widgets disagree | one `asOf`/businessDate context passed to every query | OPEN |
| P0-088 | Dashboard | offline cached dashboard ممکن است stale بودن هر widget را نشان ندهد. | false freshness | widget-level `asOf`, `lastRebuiltAt`, stale flag | OPEN |
| P0-089 | Dashboard | fast summary APIs می‌توانند مستقیماً از snapshot بخوانند؛ Core invariant اجازه snapshot-only truth نمی‌دهد. | wrong dashboard | query projection must be validated/rebuildable | OPEN |
| P0-090 | Cross-feature | Reports/Portfolio/Dashboard ممکن است یک مفهوم P&L را با definitionهای مختلف بخوانند. | inconsistent numbers | canonical metric definitions + shared query engine | OPEN |
| P0-091 | Cross-feature | Investment cash adapters و Accounts cash ledger ممکن است هر دو balance snapshot را owner بدانند. | drift | Accounts owns bank cash; venue feature owns venue cash; operation links both | OPEN |
| P0-092 | Cross-feature | opening balances/positions باید financial operation باشند ولی همه Featureها یک contract ندارند. | unbalanced opening state | canonical `opening` operation with source/asOf/provenance | OPEN |
| P0-093 | Cross-feature | import/restore ممکن است transaction را بدون operationId وارد کند. | non-replayable history | import creates migration/import operation IDs and preserves external IDs | OPEN |
| P0-094 | Cross-feature | source=`migration` با business operation semantics مخلوط است. | audit ambiguity | operation source separate from transaction source | OPEN |
| P0-095 | Cross-feature | external price provider failure باید valuation را stale کند نه transaction registration را block کند. | offline violation | price provider secondary; manual/last-known price supported | OPEN |
| P0-096 | Cross-feature | price `marketDate` و `fetchedAt` در valuation یکسان فرض می‌شوند. | historical price wrong | marketDate/priceAsOf primary; fetchedAt provenance only | OPEN |
| P0-097 | Cross-feature | transaction correction بعد از تغییر baseCurrency نباید historical amountInBase را تغییر دهد. | historical report drift | immutable operation base currency and amountInBase | OPEN |
| P0-098 | Cross-feature | conversion path چند مرحله‌ای در some docs omitted. | FX loss/rounding ambiguity | persist conversion path + intermediate currencies when >1 hop | OPEN |
| P0-099 | Cross-feature | rounding at intermediate step vs final step policy برای همه Featureها واحد نیست. | penny/wei differences | one RoundingPolicy engine/version stored in operation | OPEN |
| P0-100 | Cross-feature | Reconcile repair ممکن است snapshot را fix کند بدون اینکه repair operation/audit شود. | silent mutation | repair is explicit, audited, permissioned, and never rewrites ledger | OPEN |

---

# P1 — مهم، قبل از implementation نهایی

1. تمام entityها باید برای `createdAt/updatedAt/eventAt/businessDate/settlementDate/dueDate/marketDate/paymentDate/fetchedAt` date semantics مشخص داشته باشند.
2. همه public queryها باید pagination/filter contract مشترک داشته باشند.
3. همه Featureها باید `getById`, list, reconcile, rebuild (اگر projection دارند) contract مشابه داشته باشند.
4. حذف فیزیکی، archive و cancel باید در Deletion Policy Matrix یکسان باشند.
5. attachmentPath باید به Document Management منتقل شود؛ domain نباید storage path را مالک باشد.
6. categoryها باید registry مرکزی داشته باشند؛ string آزاد ممنوع.
7. party/person identity باید `ref_parties` باشد؛ payee/payer متن آزاد فقط display snapshot باشد.
8. all external IDs باید namespace/source/provider داشته باشند؛ یک externalId جهانی کافی نیست.
9. همه price mappings باید قابلیت invalid/expired شدن داشته باشند.
10. price history باید quote type داشته باشد: last/close/NAV/indicative/manual.
11. stale policy برای هر asset class باید قابل تنظیم ولی canonical باشد.
12. tax year باید با calendar همراه باشد؛ 1404 بدون Jalali/2025 بدون Gregorian کافی نیست.
13. budget period باید timezone/business calendar کاربر را لحاظ کند.
14. goal monthly recommendation باید day-count/month-count policy مشخص داشته باشد.
15. recurring scheduler باید catch-up policy داشته باشد: اگر برنامه چند روز اجرا نشد، یک occurrence یا همه occurrenceها؟
16. notifications باید expiration/retention policy و unique dedupe schema داشته باشند.
17. reports باید distinction بین current, as-of, period-return و since-inception را در API داشته باشند.
18. P&L سرمایه‌گذاری باید opening position/opening cost/period transactions/realized/closing valuation را جدا نگه دارد.
19. cost basis method باید per asset class/config version باشد و در operation engineVersions ذخیره شود.
20. stock CA fractional rounding باید به instrument precision و market rule وصل شود.
21. fund redemption fee/tax باید از realized return و distribution income جدا باشد.
22. metals delivery باید دقیقاً مشخص کند asset physical جدید چه cost basis تاریخی می‌گیرد.
23. physical asset revaluation نباید خودکار realized P&L تولید کند مگر policy صریح.
24. loan interest accrued but unpaid باید از principal و cash payment جدا باشد.
25. loan fee due vs fee paid باید دو state/amount مستقل داشته باشد.
26. loan payment reversal باید schedule allocation را نیز معکوس کند.
27. cheque clearing و bounced باید payment date/effective cash date را حفظ کنند.
28. budget spending linked to cheque باید هنگام pending ایجاد شود یا هنگام cleared؛ یک policy واحد لازم است.
29. goals باید روشن کند هدف فقط earmark است یا واقعاً cash segregated؛ v1 بهتر است earmark باشد مگر cash account اختصاصی وجود داشته باشد.
30. portfolio wealth باید liability scope مشخص کند: loan principal only یا accrued interest/fees هم.
31. Net Worth نباید «pending cheque» را به liability واقعی اضافه کند مگر metric جداگانه.
32. all snapshots باید source watermark/last operation id داشته باشند تا stale detection دقیق شود.
33. rebuild باید deterministic و بدون provider/network باشد.
34. import باید raw source data را حفظ کند و normalization را overwrite نکند.
35. migration rollback باید برای هر schema version documented باشد.
36. offline single-writer lock باید در همه financial writes enforced شود.
37. UI optimistic updates برای financial values باید بعد از durable persist confirm شوند.
38. API error codes باید برای validation/conflict/idempotency/insufficient balance/stale data canonical شوند.
39. all financial operations باید atomic across domain + journal + cash; persistence failure باید recovery state داشته باشد.
40. crash between SQLite commit and IndexedDB persist نیاز به durable recovery protocol دارد.
41. audit log باید actor/source/reason/operationId را حفظ کند.
42. audit log و financial event نباید با هم یکی شوند.
43. report export باید قبل از export stale snapshot را detect/rebuild کند.
44. Excel/PDF export باید precision string را بدون floating conversion حفظ کند.
45. user-facing labels نباید semantic field names را تغییر دهند؛ mapping docs لازم است.
46. all local modules باید capability API داشته باشند تا بدون parent UI اجرا شوند.
47. feature package boundaries باید circular dependency را منع کنند.
48. cross-feature writes فقط operation adapter/CashSettlementPort؛ direct repository calls ممنوع.
49. common reference tables باید seed/migration contract داشته باشند.
50. all uniqueness constraints باید partial unique indexes برای nullable identifiers داشته باشند.

---

# P2 — کیفیت و نگهداری

- یک naming glossary برای `transaction`, `operation`, `event`, `ledger`, `journal`, `cash`, `snapshot` ایجاد شود.
- همه docs باید از یک زبان برای `voided`, `reversed`, `cancelled`, `archived` استفاده کنند.
- aliasهای legacy باید در appendix باشند نه در canonical examples.
- هر Feature یک `README` کوتاه با Source of Truth و dependencies داشته باشد.
- فرمول‌های طولانی باید به Engine ارجاع دهند و فقط contract/fixture را در Feature نگه دارند.
- نمونه‌های TypeScript نباید با `Decimal` object به‌عنوان public API ادامه پیدا کنند.
- JSON examples باید decimal strings داشته باشند.
- نمودارهای dependency باید از Data Model Relationship Matrix تولید شوند، نه دستی.

---

# Golden Fixtures اجباری قبل از شروع کدنویسی

## Accounting
- Income 100 + Expense 40 → cash 60; journal balanced.
- Transfer 100 + fee 2 → source -102, destination +100, fee 2; no income/expense for principal.
- Correction 100→120 → original void + one reversal + new operation; net cash 120.

## Loan
- declining monthly fixed rate
- variable rate change mid-loan
- irregular first period
- grace period
- partial payment allocation
- early payment with/without schedule recalculation
- origination/monthly/early-payment/tiered fee
- loan cancellation before/after payment

## Crypto
- BUY with fee in quote
- BUY with fee from base asset
- SELL with fee in sold asset
- C2C USDT→BTC with fee in BTC
- wallet transfer without fee
- wallet transfer with network fee
- cross-platform transfer with different destination holdings
- USDT cash vs USDT token

## Stocks Iran
- buy/sell with fee breakdown
- T+2 settlement
- dividend
- bonus shares
- split/reverse split
- capital increase cash rights
- rights exercise/sale/expiry/fractional cash-in-lieu
- symbol/ISIN change

## Funds
- subscription vs NAV
- redemption vs NAV
- distribution income
- accumulation NAV growth
- reinvested distribution
- ETF brokerage cash

## Metals
- 18K gold purchase/sale
- 24K vs 18K separate holdings
- silver/copper
- coin with premium
- platform deposit/withdraw
- physical delivery + delivery fee + physical asset creation

## Physical Assets
- multiple gold purchases weighted average
- partial sale
- full sale
- valuation only
- maintenance expense
- write-off with carrying cost different from current value

## Cross-feature
- Tax payment exactly once in cash ledger
- Budget allocation without cash movement
- Goal income tagging without duplicate cash
- Goal manual withdrawal with one real cash movement
- pending cheque vs cleared cheque vs bounced reversal
- historical Net Worth as-of before/after an operation
- base currency change after historical transactions
- offline operation with no price provider

---

# Definition of Done for every bug

A bug is RESOLVED only when:

1. canonical owner is named;
2. old field is preserved if historical data may contain it;
3. write path is defined;
4. read/rebuild path is defined;
5. API contract is defined;
6. migration/rollback impact is defined;
7. standalone mode is considered;
8. offline mode is considered;
9. decimal/rounding/FX semantics are explicit;
10. golden fixture exists;
11. no duplicate Source of Truth remains.

## Important conclusion
این رجیستر عمداً **هیچ Feature موجودی را بازنویسی نمی‌کند**. هدف آن این است که ابتدا contradictions و calculation risks قفل شوند؛ سپس هر Feature فقط در حد لازم اصلاح شود. حذف field فقط زمانی مجاز است که migration/legacy preservation صریحاً آن را پوشش دهد.