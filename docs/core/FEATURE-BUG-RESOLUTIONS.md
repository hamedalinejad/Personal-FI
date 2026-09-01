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
