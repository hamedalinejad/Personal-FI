# Cross-Feature P0 Bugs — 2026-09

| ID | وضعیت | محل قفل |
|----|--------|---------|
| P0-001 | **CLOSED** | Canonical-Financial-Operation — Core sole reverse |
| P0-002 | **CLOSED** | Income/Expense — correction via reverseOperation + new op |
| P0-003 | **CLOSED** | operationId + reversesOperationId + reversalOperationId |
| P0-004 | **CLOSED** | Field-Write-Contract — snapshot not SoT in prose |
| P0-005 | **CLOSED** | API-Result — decimal string only |
| P0-006 | **CLOSED** | Feature-Independence — nullable account FK |
| P0-007 | **CLOSED** | db/05-constraints-polymorphic |
| P0-008 | **CLOSED** | types.md sole relatedFeature enum |
| P0-009 | **CLOSED** | date + createdAt + id order |
| P0-010 | **CLOSED** | Date-Semantics-Matrix |

در تعارض با Feature prose قدیمی، این جدول و اسناد قفل برنده است.

## Batch P0-011 … P0-020

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-011 | **CLOSED** | exchangeRateToBase canonical; «نرخ تتر» فقط UI |
| P0-012 | **CLOSED** | baseCurrencyAtOperation NOT NULL + immutable rates |
| P0-013 | **CLOSED** | CanonicalFeeEvent + one economic effect |
| P0-014 | **CLOSED** | convert fee before aggregate; currency guard |
| P0-015 | **CLOSED** | domain precision/sign validation |
| P0-016 | **CLOSED** | operationId required on all financial commands |
| P0-017 | **CLOSED** | IDEMPOTENCY_CONFLICT on hash mismatch |
| P0-018 | **CLOSED** | accountKind canonical; bankProductType separate |
| P0-019 | **CLOSED** | cardLast4/token only; no PAN |
| P0-020 | **CLOSED** | available ≠ ledger; commitments once |

## Batch P0-021 … P0-030

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-021 | **CLOSED** | credit_account v1 reject یا liability جدا؛ no silent overdraft |
| P0-022 | **CLOSED** | transfer principal legs + independent fee leg |
| P0-023 | **CLOSED** | Income correction Core-only |
| P0-024 | **CLOSED** | Expense correction Core-only |
| P0-025 | **CLOSED** | exclusive template source + unique occurrence link |
| P0-026 | **CLOSED** | financialOperationId canonical on occurrence |
| P0-027 | **CLOSED** | cash link nullable / SettlementPort |
| P0-028 | **CLOSED** | UNIQUE(templateId, scheduledOccurrenceKey) |
| P0-029 | **CLOSED** | anchorDay + monthClamp last_day policy |
| P0-030 | **CLOSED** | one reverseOperation for bounce after clear |

## Batch P0-031 … P0-040

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-031 | **CLOSED** | reversalOperationId canonical; acc link derived |
| P0-032 | **CLOSED** | currentNetWorth vs committedAdjustedNetWorth |
| P0-033 | **CLOSED** | cash via operationId; header accountTransactionId legacy |
| P0-034 | **CLOSED** | single fee treatment enum + mapping table |
| P0-035 | **CLOSED** | fee context scheduleVersion + base snapshot |
| P0-036 | **CLOSED** | rate by periodStart; accrueTo policy |
| P0-037 | **CLOSED** | interestModel + dayCount explicit |
| P0-038 | **CLOSED** | grace capitalize/waive flags explicit |
| P0-039 | **CLOSED** | versioned allocation waterfall |
| P0-040 | **CLOSED** | immutable schedule snapshots referenced by payments |

## Batch P0-041 … P0-049

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-041 | **CLOSED** | cancel after disbursement only via Core reverse; no cancel after payments |
| P0-042 | **CLOSED** | rebuild uses netQuantity |
| P0-043 | **CLOSED** | C2C one op; fee-from-base cost policy explicit |
| P0-044 | **CLOSED** | transfer cost_moved vs cost_fee_burn split |
| P0-045 | **CLOSED** | totalFeesPaidBase derived from active ops |
| P0-046 | **CLOSED** | instrumentId sole identity |
| P0-047 | **CLOSED** | USDT cash ≠ USDT token instrument |
| P0-048 | **CLOSED** | feePresence mutually exclusive |
| P0-049 | **CLOSED** | address must match wallet+network |

## Batch P0-050 … P0-059 (Stocks + Funds) — CLOSED 2026-09-01

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-050 | **CLOSED** | rebuildStockHolding / reconcile از CorporateActionEngine + همه CA types؛ snippet فقط buy/sell ممنوع |
| P0-051 | **CLOSED** | instrumentId: UUID + FK واقعی به ref_instruments.id (نه string آزاد) |
| P0-052 | **CLOSED** | feeAmount legacy preserved؛ breakdown nullable؛ new rows invariant sum |
| P0-053 | **CLOSED** | feeTax = transaction cost only؛ tax liability از Tax Feature / linkedTaxEventId جدا |
| P0-054 | **CLOSED** | tradeDate + settlementDate + effectiveCashDate/actualCashDate برای as-of reconstruction |
| P0-055 | **CLOSED** | CA lifecycle dates کامل (announcement/record/ex/effective/settlement/payment) روی entity |
| P0-056 | **CLOSED** | fractionalPolicy + cash-in-lieu operation صریح |
| P0-057 | **CLOSED** | priceAsOf + source + quoteType + staleState mandatory برای NAV/valuation |
| P0-058 | **CLOSED** | یک CashSettlementPort route per venue برای ETF cash (stocks_iran_brokerage) |
| P0-059 | **CLOSED** | P&L decomposition: NAV return / distributed / reinvested / realized جدا |

محل تفصیل: Investment-Stocks-Iran.md, Corporate-Actions-Spec.md, Settlement-Accounting.md, Fixed-Income-Funds.md, Corporate-Action-Engine.md

## Batch P0-060 … P0-070 (Metals + Physical + Budget) — CLOSED 2026-09-01

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-060 | **CLOSED** | UNIQUE(platformId, metalType, purityCode); purityRatio not identity |
| P0-061 | **CLOSED** | price quoteBasis: gross_metal \| fine_metal (and coin); valuation matches basis |
| P0-062 | **CLOSED** | gold_coin separate instrument class; provider quote includes premium; not bullion×purity |
| P0-063 | **CLOSED** | physical_delivery: one op → metals qty↓ + fee + create/link pa_assets with sourceOperationId + carrying cost |
| P0-064 | **CLOSED** | write-off loss = released carrying cost − proceeds; currentValue=0 snapshot only; explicit carrying/loss fields |
| P0-065 | **CLOSED** | cost pool from pa_transactions; header purchasePrice snapshot/legacy only |
| P0-066 | **CLOSED** | maintenance = linked expense operation once; no double into expense + asset return |
| P0-067 | **CLOSED** | incomeSourceMode calculated\|manual; manual amount + source period audited |
| P0-068 | **CLOSED** | strictMode advisory only; financial ops never blocked by budget |
| P0-069 | **CLOSED** | loan→budget links operation + exact interest/fee/penalty components immutable |
| P0-070 | **CLOSED** | closeBudget idempotent; unique period; no duplicate next budget |

تفصیل: Investment-Metals.md, Physical-Assets.md, Budget-Management.md

## Batch P0-071 … P0-080 (Goals + Bills + Notification + Reports) — CLOSED 2026-09-01

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-071 | **CLOSED** | updateGoal metadata only; currentAmount only via contributions/rebuild |
| P0-072 | **CLOSED** | contribution source contract; CashSettlementPort only for manual/transfer real cash |
| P0-073 | **CLOSED** | withdraw FIFO per cash-class; earmark vs real-cash attribution separated |
| P0-074 | **CLOSED** | markAsPaid amount override → amendment event; original occurrence amount preserved |
| P0-075 | **CLOSED** | exchangeRateToBase = rate to user baseCurrency + asOf/source; not hard-coded tether |
| P0-076 | **CLOSED** | dedupeKey UNIQUE independent of isRead |
| P0-077 | **CLOSED** | explicit category↔RelatedFeature mapping table; no equality contract |
| P0-078 | **CLOSED** | all financial persisted/API values decimal TEXT string |
| P0-079 | **CLOSED** | getNetWorth(date) reconstructs as-of from ledgers; no current snapshot for historical |
| P0-080 | **CLOSED** | multi-hop FX/USDT uses conversionPath; single rate insufficient |

تفصیل: Financial-Goals.md, Bills-Recurring-Transactions.md, Notification-Reminder-System.md, Reports-Analytics.md

## Batch P0-081 … P0-089 (Portfolio + Tax + Dashboard) — CLOSED 2026-09-02

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-081 | **CLOSED** | calculateWealthView + cashScope typed outputs; Net Worth label not ambiguous |
| P0-082 | **CLOSED** | snapshot/API money = decimal strings |
| P0-083 | **CLOSED** | canonical component registry; platform cash not double-counted with holdings |
| P0-084 | **CLOSED** | feeTax = transaction cost; tax liability = tax event/records only |
| P0-085 | **CLOSED** | single payTax financial operation; generic expense rejected/delegated |
| P0-086 | **CLOSED** | new writes → linkedTaxEventId only; legacy inv tax fields read-only |
| P0-087 | **CLOSED** | one asOf/businessDate context for all dashboard widgets |
| P0-088 | **CLOSED** | per-widget asOf, lastRebuiltAt, stale flag |
| P0-089 | **CLOSED** | snapshot/projection only if rebuildable + validated; not sole truth |

تفصیل: Portfolio-Wealth-Overview.md, Tax-Management.md, Dashboard.md

## Batch P0-090 … P0-100 (Cross-feature) — CLOSED 2026-09-02

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-090 | **CLOSED** | canonical metric definitions + shared query engine (Reports/Portfolio/Dashboard) |
| P0-091 | **CLOSED** | Accounts owns bank cash; venue owns venue cash; link via operation only |
| P0-092 | **CLOSED** | canonical opening operation with asOf + provenance |
| P0-093 | **CLOSED** | import/restore always assigns operationId; external IDs preserved |
| P0-094 | **CLOSED** | operationSource/provenance ≠ domain transaction source |
| P0-095 | **CLOSED** | price provider secondary; manual/last-known allowed; no block offline |
| P0-096 | **CLOSED** | priceAsOf/marketDate primary; fetchedAt provenance only |
| P0-097 | **CLOSED** | amountInBase + baseCurrencyAtOperation immutable after commit |
| P0-098 | **CLOSED** | multi-hop conversionPath persisted |
| P0-099 | **CLOSED** | single RoundingPolicy engine + policyVersion on operation |
| P0-100 | **CLOSED** | repair explicit, audited, permissioned; never silent ledger rewrite |

مرجع واحد: `docs/core/CROSS-FEATURE-P0-090-100-LOCKS.md`


## Cross-Cutting Contracts Batch — LOCKED 2026-09-02

Date semantics · shared pagination · getById/list/reconcile/rebuild · Deletion matrix · docs_links only · category registry · ref_parties · namespaced external IDs · price mapping lifecycle · quoteType on price_history.

See `CROSS-CUTTING-CONTRACTS-BATCH.md`.


## Cross-Cutting Contracts Batch 2 — LOCKED 2026-09-02

StalePolicy · tax calendar · budget TZ · goal month policy · bills catch-up · notification retention/dedupe schema · report modes · P&L bridge · cost basis versions · CA fractional precision.

See `CROSS-CUTTING-CONTRACTS-BATCH-2.md`.


## Cross-Cutting Contracts Batch 3 — LOCKED 2026-09-02

Funds fee vs income · metals→PA cost · PA revaluation · loan accrual/fees/reverse · cheque dates · budget↔cheque policy · goals earmark · wealth liabilityScope.

See `CROSS-CUTTING-CONTRACTS-BATCH-3.md`.


## Cross-Cutting Contracts Batch 4 — LOCKED 2026-09-02

Net worth vs pending cheques · snapshot watermarks · offline rebuild · import raw · migration rollback · single-writer · optimistic UI · error codes · atomic ops · dual-store recovery.

See `CROSS-CUTTING-CONTRACTS-BATCH-4.md`.


## Cross-Cutting Contracts Batch 5 — LOCKED 2026-09-02

Audit fields · audit≠financial · export preflight/precision · label mapping · headless capability · no circular features · port-only cross writes · ref seeds · partial unique indexes.

See `CROSS-CUTTING-CONTRACTS-BATCH-5.md`.



## X-001 … X-010 — LOCKED 2026-09-02

Reversal Core-only · correction graph · instrument identity · snapshot≠SoT · decimal string API · polymorphic links · Core enums · FX naming · FX attribution · historical asOf.

See `CROSS-FEATURE-X-001-010-LOCKS.md`.



## X-011 … X-020 — LOCKED 2026-09-02

See `CROSS-FEATURE-X-011-020-LOCKS.md`.



## Crypto CR-001 … CR-015 — LOCKED 2026-09-02

See `docs/features/05-Investment/05-01-Investment-Crypto/CRYPTO-CR-001-015-LOCKS.md`.



## Stocks ST-001 … ST-012 — LOCKED 2026-09-02

See `STOCKS-ST-001-012-LOCKS.md` under Investment-Stocks-Iran.



## Funds FI-001 … FI-010 — LOCKED 2026-09-02

See `FUNDS-FI-001-010-LOCKS.md` under Fixed-Income-Funds.



## Metals ME-001…010 & Physical PA-001…009 — LOCKED 2026-09-02

See feature lock files under Metals and Physical-Assets.



## Loan LN-001 … LN-015 — LOCKED 2026-09-02

See `LOAN-LN-001-015-LOCKS.md` under Debt-Loan-Management.



## Accounts AC-001…006 & IE-001…007 — LOCKED 2026-09-02

See feature lock files under Accounts-Banking and Income.

## Market data quality (56–65)

| ID | وضعیت | سند |
|----|--------|-----|
| 56 Pipeline order | **CLOSED** | Market-Data-Quality-Pipeline.md |
| 57 OHLC invariants | **CLOSED** | same |
| 58 Duplicate composite key | **CLOSED** | same |
| 59 Timeframe enum | **CLOSED** | same |
| 60 Effectively-once live | **CLOSED** | same |
| 61 Crash-safe checkpoint | **CLOSED** | same |
| 62 Shutdown order | **CLOSED** | same |
| 63 Recovery startup | **CLOSED** | same |
| 64 Event-driven observability | **CLOSED** | same |
| 65 Immutable event log | **CLOSED** | same |


## CH / BU / GO / BR locks — LOCKED 2026-09-02

See respective feature `*-LOCKS.md` files.



## NO / RP / TX locks — LOCKED 2026-09-02

See Notification, Reports-Analytics, Tax-Management `*-LOCKS.md` files.



## P0-FINAL-001…004 — LOCKED 2026-09-02

Cash SoT single · instrumentId in CostBasis · fee funding vocabulary · fee burn closed form. See `P0-FINAL-001-004-LOCKS.md`.



## P0-FINAL-005…010 — LOCKED 2026-09-02

Attribution · FX path · price/FX selection · T+n · dividend journals. See `P0-FINAL-005-010-LOCKS.md`.



## P0-FINAL-011…014 — LOCKED 2026-09-02

See `P0-FINAL-011-014-LOCKS.md`.

