# Feature Bug Resolutions (from FEATURE-BUG-REGISTER-2026-09-01)

تصمیم‌های واحد — در تعارض با متن قدیمی Feature، **این سند برنده است** تا Feature docs به‌روز شوند.

## FEAT-P0-001 Standalone leakage
Cash links optional via `CashSettlementPort`. States: Integrated | Standalone. No mandatory FK to `acc_*`.

## FEAT-P0-002 Snapshot vs Ledger
Ledger/events SoT; snapshot projection only. Mutate only via Financial Operation → rebuild.

## FEAT-P0-003 / 004 Identity
`ref_instruments.id` only identity. `assetKey` = provider index. `symbol` = label. Crypto: `instrumentId` ≠ `assetKey` as PK.

## FEAT-P0-005 Fee/quantity
Always `grossQuantity`, `feeQuantity`, `netQuantity`, `feePresence`. Holding qty = net when fee from base; net=gross when fee in quote.

## FEAT-P0-006 C2C cost
`sourceCostReleased` from CostBasisEngine only. Destination cost = released + acquisition fees. Never market price for historical cost.

## FEAT-P0-007 Crypto cash
`inv_crypto_cash` = cash SoT. Token holdings = assets only. No fake USDT row in holdings for fiat/cash-like exchange balance.

## FEAT-P0-008 Loan accountingTreatment
Canonical enum one value: `reduction_of_carrying_amount` (preferred). Alias deprecated: `reduction_of_liability` → same meaning in migration.

## FEAT-P0-009… (see sections below as patched in feature files)

## FEAT-P0-024 FX
`1 from = rate to`; amountTo = amountFrom × rate. Forward multiply, inverse divide.

## FEAT-P0-025 Bridge
No hard-coded USDT path; `configured_bridge` only.

## FEAT-P0-027 quoteType
`last | nav | close | mid | indicative | manual | other`

## FEAT-P0-029 source
`sourceKind`: manual | api | import + sourceId/adapterKey

## FEAT-P0-032 Stocks cash
`ledgerCash` | `settledCash` | `availableCash` | `pendingSettlement`

## FEAT-P0-035 Dividend
gross / withholding / net separate; income=gross; cash=net

## FEAT-P0-036 Fund performance
income, realized, unrealized independent; predictedProfit metadata only

## FEAT-P0-039 Metals delivery
Atomic: digital out + physical in + fees; NW conserved

## FEAT-P0-046 Goal
currentAmount = progress/allocation not a portfolio asset

Full register checkboxes: FEATURE-BUG-REGISTER-2026-09-01.md status column.


## Complete P0 index

| ID | Resolution location |
|----|---------------------|
| 001-002 | CashSettlementPort · Field-Write-Contract · this doc |
| 003-007 | Investment-Crypto FEAT-P0 LOCK |
| 008-017 | Debt-Loan-Management FEAT-P0 LOCK |
| 018-019 | Cheque-Management FEAT-P0 LOCK |
| 020-021 | Accounts-Banking FEAT-P0 LOCK |
| 022-023 | Expense/Income FEAT-P0 LOCK |
| 024-025 | Currency-CrossRate + Accounting-Calculation-Invariants |
| 026-031 | Price-Fetching FEAT-P0 LOCK |
| 032-035 | Investment-Stocks-Iran FEAT-P0 LOCK |
| 036-037 | Fixed-Income-Funds FEAT-P0 LOCK |
| 038-040 | Investment-Metals FEAT-P0 LOCK |
| 041-043 | Physical-Assets FEAT-P0 LOCK |
| 044-045 | Budget-Management FEAT-P0 LOCK |
| 046-047 | Financial-Goals FEAT-P0 LOCK |
| 048-050 | Tax-Management FEAT-P0 LOCK |

P1 items: accepted decisions in FEATURE-BUG-REGISTER (STATUS RESOLVED); implement with same locks + API-Result, Pagination, Document links, etc.


## P1 DEEP locks (FEAT-P1-001…030)

| ID | Lock |
|----|------|
| P1-001 | Every money field has currency code; multi-currency lines explicit |
| P1-002 | Fee conversion locks FX on operation (feeCurrency, feeAmount, amountInBase) |
| P1-003 | All reversals go through Core reverse(operationId); feature adapters only plan |
| P1-004 | Multi-row writes share one operationId; child rows store operationId |
| P1-005 | Transfer kind internal vs external; external does not preserve counterparty holding cost |
| P1-006 | sourceType opening vs import distinct; opening is operation |
| P1-007 | Historical valuation uses priceAsOf+fxAsOf never current |
| P1-008 | EXTERNAL_REPORTED fields never overwritten by calculated |
| P1-009 | Party links optional but typed when present |
| P1-010 | Document links via docs_links not raw paths as SoT |
| P1-011 | Idempotency: same operationId+commandHash → same result |
| P1-012 | Soft delete only for financial; hard delete matrix applies |
| P1-013 | Notifications never mutate finance |
| P1-014 | Reports query API not feature tables |
| P1-015 | Import dry-run before commit |
| P1-016 | Duplicate detection independent of operationId |
| P1-017 | Offline mode no network for core ops |
| P1-018 | License gates features not data access |
| P1-019 | Feature disable keeps data |
| P1-020 | Cheque sayad fields optional with validation when present |
| P1-021 | Bills generate ops; template ≠ ledger |
| P1-022 | Recurring uses businessDate rules + timezone policy |
| P1-023 | Budget income override stores actor, reason, version |
| P1-024 | Budget envelope currency; cross-currency needs conversion policy |
| P1-025 | Goal v1 single currency or full FX policy — pick one, enforce |
| P1-026 | Account ledger vs available vs pending vs cleared |
| P1-027 | Shared brokerage cash one ledger per custody account |
| P1-028 | Attachments = documentId; path legacy only |
| P1-029 | API DecimalString ISO dates JSON-safe enums only |
| P1-030 | List APIs: page, sort, dateFrom/To, status, source, stable order |


## FEAT-P0-050 … 059 (Stocks + Funds) — LOCK 2026-09-01

- **050** rebuild must include all CA types via CorporateActionEngine (no buy/sell-only snippet).
- **051** instrumentId = UUID FK → ref_instruments.id everywhere (holdings, txs, CA).
- **052** feeAmount total always preserved for legacy; breakdown components nullable; new rows require sum invariant.
- **053** feeTax is transaction cost only; tax events / liabilities live in Tax Feature (linkedTaxEventId).
- **054** tradeDate, settlementDate, effective/actual cash date separated for historical as-of cash & position.
- **055** CA entity stores full lifecycle dates (announcement, record, ex, effective, settlement, payment).
- **056** fractionalPolicy + explicit cash-in-lieu operation; no orphan fractional value.
- **057** NAV valuation requires priceAsOf, source, quoteType, staleState.
- **058** ETF cash only through one CashSettlementPort route (stocks_iran_brokerage venue).
- **059** Accumulation/Distribution P&L decomposed: NAV return, distributed income, reinvested income, realized on units.


## FEAT-P0-060 … 070 (Metals / Physical / Budget) — LOCK 2026-09-01

- **060** Metals holding unique (platformId, metalType, purityCode)
- **061** Metal price quoteBasis gross vs fine mandatory
- **062** gold_coin ≠ bullion; separate class + quote basis
- **063** delivery op creates/links Physical Asset with lineage + carrying cost
- **064** write-off uses carrying cost released, not currentValue alone
- **065** PA cost pool from pa_transactions; header purchasePrice snapshot
- **066** maintenance linked once; no double expense
- **067** Budget totalIncome mode calculated|manual with audit
- **068** strictMode advisory; never block financial operation
- **069** loan budget link = operation + exact expense portions
- **070** closeBudget idempotent + unique period


## FEAT-P0-071 … 080 (Goals / Bills / Notification / Reports) — LOCK 2026-09-01

- **071** Goals: no direct currentAmount mutation on updateGoal; contributions/rebuild only
- **072** Contribution sources: real cash only manual/transfer via CashSettlementPort; budget/income earmark only
- **073** Withdraw allocation separates earmark vs real-cash pools (FIFO within class)
- **074** Bills markAsPaid amount change = amendment; original preserved
- **075** exchangeRateToBase generic to baseCurrency (not tether-hardcoded)
- **076** Notification dedupeKey unique regardless of read state
- **077** Explicit category ↔ RelatedFeature map; no === contract
- **078** Reports money fields decimal TEXT
- **079** Historical net worth from ledger reconstruction as-of
- **080** Multi-hop valuation requires conversionPath


## FEAT-P0-081 … 089 (Portfolio / Tax / Dashboard) — LOCK 2026-09-02

- **081** calculateWealthView + explicit cashScope; typed wealth components
- **082** port snapshot JSON money fields decimal strings
- **083** component registry prevents brokerage cash double count
- **084** feeTax vs tax liability separation
- **085** one payTax operation only
- **086** linkedTaxEventId SoT; legacy tax metadata read-only
- **087** shared asOf context across dashboard widgets
- **088** widget-level stale / lastRebuiltAt
- **089** dashboard projections must be rebuildable/validated


## FEAT-P0-090 … 100 (Cross-feature) — LOCK 2026-09-02

Full text: `CROSS-FEATURE-P0-090-100-LOCKS.md`

- **090** Canonical metrics + shared query for P&L/wealth
- **091** Bank cash vs venue cash ownership split
- **092** Opening only via canonical opening operation
- **093** Import always has operationId
- **094** operationSource separate from domain source
- **095** Price failure does not block ops; manual/last-known OK
- **096** priceAsOf primary vs fetchedAt provenance
- **097** Immutable amountInBase / baseCurrencyAtOperation
- **098** Persist multi-hop conversionPath
- **099** One RoundingPolicy + version on operation
- **100** Reconcile repair explicit/audited; no silent mutation


## Cross-Cutting Contracts Batch (non-numbered P0 hygiene)

Authority: `docs/core/CROSS-CUTTING-CONTRACTS-BATCH.md`

1. Entity date semantics (createdAt/updatedAt/eventAt/businessDate/settlementDate/dueDate/marketDate/paymentDate/fetchedAt)
2. Shared ListQuery / ListResult pagination+filter
3. Feature surface: getById, list, reconcile, rebuild (when projections)
4. Deletion/archive/cancel only via Deletion-Policy-Matrix
5. No domain attachmentPath — Document Management + docs_links
6. Categories from central registry only
7. Party identity = ref_parties; payee text = snapshot
8. External IDs namespaced (source/provider/namespace/id)
9. Price mappings invalid/expired lifecycle
10. price_history.quoteType required (last/close/nav/indicative/manual/…)


## Cross-Cutting Contracts Batch 2

Authority: `docs/core/CROSS-CUTTING-CONTRACTS-BATCH-2.md`

1. StalePolicy per asset class (configurable, versioned)
2. Tax year + calendar (jalali/gregorian) + periodKey
3. Budget period uses user timezone/business calendar policy
4. Goal monthly recommendation monthCount/dayCount policy
5. Recurring catchUpPolicy (single_latest | all_missed | skip_missed)
6. Notification dedupe schema + expiresAt/retention
7. Reports API modes: current | asOf | period | sinceInception
8. Investment P&L bridge: opening/period/realized/closing valuation
9. Cost basis method per asset class + engineVersions on operations
10. Stock CA fractional rounding via instrument precision + market rules


## Cross-Cutting Contracts Batch 3

Authority: `docs/core/CROSS-CUTTING-CONTRACTS-BATCH-3.md`

1. Fund redemption fee/tax separated from realized return and distribution income
2. Metals delivery transfers historical carrying cost to PA
3. PA revaluation does not auto-realize (default)
4. Loan accrued interest ≠ principal ≠ cash payment
5. Loan feeDue vs feePaid independent
6. Loan payment reverse undoes schedule allocation
7. Cheque clear/bounce preserve date history
8. budgetChequeRecognition single policy (pending vs cleared)
9. Goals v1 earmark unless segregated cash account
10. Wealth view explicit liabilityScope


## Cross-Cutting Contracts Batch 4

Authority: `docs/core/CROSS-CUTTING-CONTRACTS-BATCH-4.md`

1. Net Worth excludes pending cheques unless separate metric
2. Snapshots require source watermark / lastOperationId
3. Rebuild deterministic + offline (no live providers)
4. Import raw immutable; normalization derived
5. Migration rollback documented per schema version
6. Single-writer lock on all financial writes
7. Optimistic UI confirmed only after durable persist
8. Canonical API error codes
9. Atomic domain + journal + cash operations
10. SQLite↔secondary persist crash recovery protocol


## Cross-Cutting Contracts Batch 5

Authority: `docs/core/CROSS-CUTTING-CONTRACTS-BATCH-5.md`

1. Audit log: actor, source, reason, operationId
2. Audit log ≠ financial event
3. Report export stale detect/rebuild preflight
4. Excel/PDF keep decimal strings (no float)
5. UI labels mapped; semantic field names stable
6. Modules runnable via Capability API without parent UI
7. No circular feature package dependencies
8. Cross-feature writes only via operation/CashSettlementPort
9. Reference tables seed/migration contract
10. Partial unique indexes for nullable identifiers


## P2 — Documentation quality

- `NAMING-GLOSSARY.md` — transaction/operation/event/ledger/journal/cash/snapshot; voided/reversed/cancelled/archived
- `DOCUMENTATION-STYLE-P2.md` — legacy aliases, Feature README, formulas→engines, decimal strings, diagrams from matrix



## X-001 … X-010 (Cross-feature) — LOCKED

Authority: `CROSS-FEATURE-X-001-010-LOCKS.md`

- X-001 Core-only reverseOperation; Feature buildReversalPlan
- X-002 Correction graph: reverse + new op; no double cash
- X-003 ref_instruments.id identity only
- X-004 Snapshot projection; ledger SoT
- X-005 Public API decimal strings
- X-006 Polymorphic links + orphan reconcile
- X-007 Single Core enum owner
- X-008 exchangeRateToBase canonical; tether label UI-only
- X-009 FX-attributed P&L components
- X-010 Historical asOf/priceAsOf/fxAsOf



## X-011 … X-020 — LOCKED

Authority: `CROSS-FEATURE-X-011-020-LOCKS.md`

Fee single effect · rounding engine · offline rebuild · dual-store durability · deterministic order · one SoT per metric · data preservation · audit on repair · projection rebuild · CI architecture boundaries.



## Crypto CR-001 … CR-015 — LOCKED

Authority: `docs/features/05-Investment/05-01-Investment-Crypto/CRYPTO-CR-001-015-LOCKS.md`



## Stocks ST-001 … ST-012 — LOCKED

Authority: `docs/features/05-Investment/05-02-Investment-Stocks-Iran/STOCKS-ST-001-012-LOCKS.md`



## Funds FI-001 … FI-010 — LOCKED

Authority: `docs/features/05-Investment/05-03-Fixed-Income-Funds/FUNDS-FI-001-010-LOCKS.md`



## Metals ME-001…ME-010 / Physical PA-001…PA-009 — LOCKED

- Metals: `METALS-ME-001-010-LOCKS.md`
- Physical: `PHYSICAL-PA-001-009-LOCKS.md`



## Loan LN-001 … LN-015 — LOCKED

Authority: `docs/features/04-Debt-Loan-Management/LOAN-LN-001-015-LOCKS.md`



## Accounts AC-001…006 / Income-Expense IE-001…007 — LOCKED

- Accounts: `ACCOUNTS-AC-001-006-LOCKS.md`
- I/E: `INCOME-EXPENSE-IE-001-007-LOCKS.md`



## Cheque/Budget/Goals/Bills feature locks — LOCKED

- CH: `CHEQUE-CH-001-007-LOCKS.md`
- BU: `BUDGET-BU-001-007-LOCKS.md`
- GO: `GOALS-GO-001-006-LOCKS.md`
- BR: `BILLS-BR-001-007-LOCKS.md`



## Notification / Reports-Portfolio / Tax locks — LOCKED

- NO: `NOTIFICATION-NO-001-005-LOCKS.md`
- RP: `REPORTS-PORTFOLIO-RP-001-009-LOCKS.md`
- TX: `TAX-TX-001-006-LOCKS.md`



## P1 Global Contracts

Authority: `docs/core/P1-GLOBAL-CONTRACTS.md`  
Field matrix · commands/queries · reversal plan · rebuild determinism · ValuationContext · attribution · wealth vs P&L · cash ownership.



## P1 Iran / Performance / Fixtures / Acceptance

Authority: `P1-IRAN-PERFORMANCE-FIXTURES-ACCEPTANCE.md`



## P0-FINAL-001…004

See `P0-FINAL-001-004-LOCKS.md` and `EXECUTIVE-STATUS.md`.



## P0-FINAL-005…010 — LOCKED

Authority: `P0-FINAL-005-010-LOCKS.md`

