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
