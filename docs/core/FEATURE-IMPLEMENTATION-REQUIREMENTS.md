# Feature-by-Feature Implementation Requirements

> **UI-agnostic must-support lists.** Detail lives in Feature LOCKS + Core.  
> Authority chain: LOCKS > Core contracts > Feature doc.  
> Global rules: `CANONICAL-FINANCIAL-REQUIREMENTS.md`.

---

## Accounts & Banking

Must support:

- account identity and kind
- IBAN/Shaba **normalized** uniqueness
- safe card metadata only (no full PAN storage)
- non-negative normal asset accounts unless explicitly credit/liability modeled
- archive preconditions
- cash **through Core journal** only
- transfer principal + fee as **one** operation graph

Canonical: Accounts P0 locks · Canonical-Cash-Model · Canonical-Financial-Operation.

---

## Income / Expense

Must support:

- atomic posting via Core
- correction via Core **reversal** (not in-place money edit)
- refund / chargeback lineage
- category → COA mapping
- standalone operation via port
- recurring source exclusivity
- `businessDate` in user-profile timezone

Canonical: IE locks · Date-Semantics · Feature-Independence.

---

## Loan

Must support:

- `day_count` vs `period_based` mode
- explicit day-count convention
- variable-rate interval lookup
- grace capitalization / forgiveness flags
- component-level balances (principal / interest / fee / penalty)
- fee due / paid / waived
- versioned schedule
- exact final principal residual (last installment)
- FX on repayment when currencies differ
- borrowed vs lent accounting roles
- reversal of payment allocation
- local settlement mode

Canonical: Loan locks · Debt-Loan-Management · P0 residual / FX locks.

---

## Crypto

Must support:

- `instrumentId` only as identity
- location by venue / network
- gross / net / fee quantity
- fee funding vocabulary + `economicFeeRole`
- buy / sell
- internal transfer
- network fee burn
- bridge (`same_owner_bridge`)
- true economic swap / C2C (`economic_trade_or_swap`)
- external receive cost policy
- opening balance
- staking / airdrop / gift economics
- third-asset fee
- historical FX and multi-currency cost basis
- realized / unrealized + **2-axis** P&L attribution

**Before coding:** C2C = consideration-based dest cost (`P0-COST-BASIS-PNL-001-005-LOCK.md`).

Canonical: CRYPTO-CR locks · Cost-Basis-Engine · Instrument-Identity.

---

## Stocks Iran

Must support:

- trade vs settlement date
- corporate-action engine
- rights / fractional / CIL policy
- lot / tick / market validation
- symbol history without identity break
- raw vs adjusted price separation
- dividend gross / withholding / net
- broker transfer carrying cost
- delisting / write-off operation
- `feeTax` separated from tax liability
- P&L decomposition
- deterministic provider mapping

Canonical: ST locks · Settlement-Accounting · Corporate-Action-Engine · Iran Core.

---

## Funds (FIF)

Must support:

- NAV ≠ transactionPrice
- ETF market valuation vs NAV
- distribution vs reinvestment vs realized vs unrealized
- one reinvest operation with **two legs**
- explicit fee treatment
- date / price cutoffs
- external reported profit **≠** calculated
- brokerage cash through **shared** cash model

Canonical: FI locks · Field-Level-SoT EXTERNAL_REPORTED.

---

## Metals

Must support:

- `quantityMg` as quantity SoT
- purity-aware pricing
- gross vs fine basis
- coin as distinct instrument semantics
- delivery lifecycle
- separate delivery fee
- metals → physical carrying cost transfer
- making / labor / tax breakdown

Canonical: ME locks · Instrument-Identity.

---

## Physical Assets

Must support:

- carrying-cost SoT in `pa_transactions`
- write-off based on carrying cost and residual proceeds
- maintenance once (policy)
- capex vs expense
- sale fee / tax events
- theft / recovery lineage
- revaluation separate from realized
- metals delivery lineage
- historical FX

Canonical: PA locks.

---

## Cheques

Must support:

- issue / due / clear / bounce date separation
- one reversal for clear → bounce
- receivable / payable state preservation
- bounce fee separate
- Sayadi / number validation
- pending cheque metric **separate** from core net worth
- v1 partial-clear **rejection**

Canonical: CH locks.

---

## Budget / Goals / Bills / Notifications

Must support:

- budget `strictMode` **advisory**, not financial blocker
- budget ↔ cheque one policy
- goal currency + contribution lineage
- earmark vs segregated cash distinction
- recurring occurrence idempotency
- day-31 schedule clamp
- catch-up policy
- notification dedupe independent of read state
- **notifications cannot mutate finance**

Canonical: BG/FG/BR/Notif locks · Feature-Independence.

---

## Reports / Portfolio / Dashboard

Must support:

- shared metric definitions
- shared `ValuationContext`
- explicit `cashScope` / `liabilityScope`
- historical deterministic reconstruction
- wealth vs P&L separation
- stale / watermark status
- export preflight
- decimal string API

Canonical: Report locks · Source-of-Truth-Matrix · CANONICAL-FINANCIAL-REQUIREMENTS §4.9–4.10.

---

## Tax

Must support:

- one canonical tax event entity
- one `payTax` operation
- explicit tax refund operation
- liability source separate from payment source
- versioned tax rules
- `feeTax` ≠ tax liability
- legacy investment tax fields **read-only**

Canonical: TX locks.

---

## Coding order reminder

Implement only after CODING-GATE A–D. Feature lists above do **not** override Core cash/journal/operation rules.
