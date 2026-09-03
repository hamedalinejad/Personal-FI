# FINAL AUDIT — Personal-FI — 2026-09-03

> **Audit scope:** documentation freeze + current executable Core code/fixtures. Repository is docs-first and the full business Feature implementations do not exist yet; therefore this report separates **confirmed implementation bugs** from **specification/architecture blockers**.
>
> **Audit baseline:** `main` at `4bc56defba43e95b1bf25c6dd6bcad4c0e99a2bd`.
>
> **Think-tank composition:** System/Data Architect · Accounting/Bookkeeping specialist · Iran investment/market specialist · API/modularity architect · UX/Product architect · QA/Integrity auditor · Licensing/Product strategy.

## 1. Executive decision

**Status: NOT READY FOR FEATURE CODING.**

The product direction is correct and unusually well protected around money precision, immutability, instrument identity, offline operation, feature isolation and historical valuation. The remaining danger is not lack of ideas; it is **multiple competing statements of the same rule** inside the documentation plus a small set of real validation defects in the executable Core helpers.

The correct product shape remains:

```text
~9 navigation pages
      ↓
Feature Shells / Tabs / Sheets
      ↓
Public Feature API (commands / queries)
      ↓
Core Financial Operation
      ↓
Domain subledger + Journal + Cash Settlement Port
      ↓
SQLite / local durable persistence
```

A feature may be licensed and enabled alone. Standalone means **UI independence**, not removal of the accounting truth layer. The existing Feature Independence Contract already makes this distinction explicit. fileciteturn7file0L2-L2

## 2. Confirmed implementation bugs fixed in this audit

### P0-CODE-001 — non-finite decimal values were accepted
**Location:** `src/core/money/canonicalDecimal.ts` — `canonicalDecimalString()`.

**Bug:** `Decimal` can represent `NaN`/`Infinity`; the previous code canonicalized the value without an explicit finiteness check. A financial boundary must never persist or hash non-finite values.

**Fix:** input must be a non-empty string, parsed after trim, and must be finite. `-0` still canonicalizes to `0`. Existing scientific-notation input may be normalized to plain decimal text, preserving the canonical storage rule.

### P0-CODE-002 — transfer cost accepted invalid quantities
**Location:** `src/core/costBasis/transferCost.ts`.

**Bug:** zero/negative/non-finite `gross`, negative `fee`, negative `net`, and negative `beforeCost` were not rejected. Also the previous residual logic only corrected the fee if the Decimal arithmetic happened not to reconcile.

**Fix:** explicit domain validation plus deterministic conservation. The destination cost is calculated once and `feeCarrying = sourceCostReleased - destinationCarrying`, guaranteeing one and only one release from the source pool.

The canonical contract requires exactly one release and forbids a second fee-burn release. This matches the existing P0 transfer lock. fileciteturn33file0L2-L2

### P0-CODE-003 — acquisition fee-from-received accepted impossible states
**Location:** `src/core/costBasis/acquisitionFeeFromReceived.ts`.

**Bug:** negative fee and `fee >= gross` could pass through to derived calculations; negative/zero consideration could also produce meaningless acquisition cost.

**Fix:** `gross > 0`, `0 <= fee < gross`, finite inputs and `consideration > 0` are enforced before calculation.

### P0-CODE-004 — economic swap helper lacked financial-input validation
**Location:** `src/core/costBasis/applyEconomicSwap.ts`.

**Bug:** negative source carrying cost, negative fees, negative capitalization and zero consideration were accepted.

**Fix:** all monetary operands are finite; source carrying cost is non-negative, fees/capitalized destination fees are non-negative, and an economic swap requires positive consideration.

The destination cost remains based on economic consideration, not source carrying cost, matching the canonical C2C rule. fileciteturn35file0L2-L2

### P0-CODE-005 — crypto/FX golden helper lacked input guards
**Location:** `src/core/costBasis/valuationAttribution.ts`.

**Bug:** zero/negative/non-finite quantity, prices or FX rates were not rejected.

**Fix:** all five inputs are required to be finite and positive.

### P1-CODE-006 — fixture assertion silently treated identifiers as decimals
**Location:** `src/core/fixtures/harness.ts` — `assertExpected()`.

**Bug:** every string was passed through decimal normalization before comparison. Therefore an identifier such as `"001"` and `"1"` could be considered equal even when they are not the same ID.

**Fix:** fixture leaves are compared exactly. Decimal normalization is a responsibility of the financial engine/fixture author, not a generic structural assertion.

### P1-CODE-007 — fixture harness allowed JSON numeric values
**Location:** `src/core/fixtures/harness.ts` — `loadFixture()`.

**Bug:** the loader did not reject JSON `number` values even though the project contract requires persisted/API/fixture financial numbers to be decimal strings.

**Fix:** recursive rejection of JSON numbers was added at fixture load time.

### P1-CODE-008 — missing negative/failure coverage in the executable smoke suite
**Location:** `src/core/costBasis/acquisitionFeeFromReceived.test.ts`.

**Fix:** invalid acquisition fee, invalid transfer quantities, negative values, and invalid economic swaps are now explicit tests.

## 3. Documentation / architecture blockers found

These are **real defects in the specification**. They are more dangerous than cosmetic duplication because two developers can implement two different systems from the same repository.

### P0-DOC-001 — CashSettlementPort allows a second cash truth
**Locations:**
- `docs/core/Cash-Settlement-Adapter.md` → "Local Settlement Account"
- `docs/core/Source-of-Truth-Matrix.md`
- `docs/core/Canonical-Financial-Requirements.md`

**Conflict:** the adapter document permits a "local feature ledger or Core settlement account", while the canonical cash contract says the only cash balance truth is `fin_accounts + fin_journal_lines`.

**Required fix:** `LocalSettlementAdapter` may point to a **Core `fin_accounts` cash account**, but must never introduce a feature-owned cash-balance SoT. A local edition is a local **accounting account**, not a second ledger.

### P0-DOC-002 — `acc_transactions` is still described as a cash ledger in schema prose
**Location:** `docs/core/db/01-schema-tables.md` — account transaction description.

**Conflict:** canonical SoT documents correctly state that journal/`fin_accounts` own cash truth, but the schema document still uses “cash ledger” language for `acc_transactions`.

**Required fix:** describe `acc_transactions` as **bank/account event log + linked projection/integration event**, never as an independent balance source. Reports must never sum it together with journal cash for the same operation.

This canonical distinction is already stated in the Source-of-Truth Matrix. fileciteturn56file0L2-L2

### P0-DOC-003 — Crypto has an old assetKey/symbol-centric rebuild implementation embedded in the feature document
**Location:** `docs/features/05-Investment/01-Crypto/Investment-Crypto.md` → `rebuildHolding()` implementation example and later “Canonical Crypto” block.

**Conflict:** early portions correctly mandate `instrumentId = ref_instruments.id`; later prose/code rebuilds by `assetKey`/`symbol` and even shows direct SQL filtering by those fields.

**Required fix:** one identity only:

```text
rebuild / API / grouping = holdingId OR instrumentId + location
symbol = label only
assetKey = provider/convenience index only
```

`Instrument-Identity.md` is explicit that `ref_instruments.id` is the only canonical identity. fileciteturn57file0L2-L2

### P0-DOC-004 — Crypto `quantity` semantics are duplicated and contradictory
**Location:** `Investment-Crypto.md` — transaction schema and multiple “canonical” fee sections.

**Conflict:** one section says holding uses `netQuantity`; another says BUY 1 BTC with a BTC fee still stores/holds `quantity = 1`; later canonical text again says `Holding.quantity` is based on `netQuantity`.

**Required fix:** retain the raw fields:

```text
grossQuantity
feeQuantity
netQuantity
feePresence
```

and define one immutable rule per `feePresence`. For `fee_in_quote`, holding delta may equal gross/net. For `fee_from_base_asset` or `fee_from_received`, holding delta is net. Never use one generic BUY example to override the fee mode.

### P0-DOC-005 — Crypto fee-from-received / burn economics has two incompatible cost policies
**Locations:**
- `docs/core/P0-COST-BASIS-PNL-001-005-LOCK.md`
- `docs/core/P0-FINAL-001-004-LOCKS.md`
- `Investment-Crypto.md`

**Conflict:** one rule treats the received-asset fee as acquisition-cost treatment over net quantity; another generic burn rule releases carrying cost and recognizes expense; the same repository then repeats both as “canonical”.

**Required fix:** `economicFeeRole` must decide the accounting treatment before cost mutation. In particular:

```text
acquisition_fee_from_received
≠ post_acquisition_network_burn
≠ standalone_asset_burn
```

Only the selected role may mutate cost/expense once. One fee event = one economic allocation.

### P0-DOC-006 — C2C destination cost formula is contradicted by an older implementation example
**Location:** `Investment-Crypto.md` → `createCryptoToCryptoTrade()` / C2C implementation example.

**Conflict:** the example calculates destination cost as `fromTotalBase + feeBase`, even where `fromTotalBase` is market value; the canonical C2C rule says destination cost must come from the explicit economic consideration / released cost policy, not an arbitrary market mark.

**Required fix:** the C2C operation has one `operationId`, two linked legs, and a deterministic destination-cost formula from the canonical P0 C2C document. No later rebuild may recompute historical cost from today’s price.

### P0-DOC-007 — `totalFeesPaidBase` changes from derived metric to pseudo-SoT
**Location:** `Investment-Crypto.md` → holding fields and later `totalFeesPaidBase` sections.

**Conflict:** the field is described as a mutable lifetime accumulator in some sections and as a derived value from active operations in another.

**Required fix:** canonical kind = `DERIVED`/optional `SNAPSHOT`; rebuild from active non-reversed fee events. Preserve gross historical fee information in raw transaction rows for audit; do not make the holding accumulator its own truth.

The Field-Level ownership matrix already defines holding fee totals as derived/rebuildable. fileciteturn55file0L2-L2

### P0-DOC-008 — Period Return has a superseded mixed bridge left in a “FINAL” lock file
**Location:** `docs/core/P0-FINAL-021-026-LOCKS.md` → P0-FINAL-024.

**Conflict:** it contains an additive equation mixing purchases/sales with realized/unrealized/fees, while `P0-FINAL-006-015-LOCKS.md` explicitly voids that mixed bridge and defines separate wealth and investment-return bridges.

**Required fix:** delete the old equation from the lock body, leaving only the current bridge:

```text
Wealth = opening wealth + external flows + investment return
Investment return = realized + unrealized + recognized income - recognized investment expenses
```

Asset-price/FX attribution remains child detail, never another additive peer.

### P0-DOC-009 — Local standalone promise and accountId requirements conflict in Funds
**Location:** `docs/features/05-Investment/02-Fixed-Income-Funds/Fixed-Income-Funds.md`.

**Conflict:** one section says issuance/redemption buy/sell requires `accountId`; other sections explicitly allow standalone operation without Accounts and nullable `accountId` through `CashSettlementPort`.

**Required fix:**

```text
Integrated bank settlement → accountId required
Standalone/local/external settlement → accountId nullable
```

The feature must never require the Accounts UI or its private tables for domain correctness.

### P0-DOC-010 — Funds lacks an explicit canonical instrument identity boundary
**Location:** `Fixed-Income-Funds.md` → `inv_fif_funds` / holdings / transactions.

**Risk:** fund identity is sometimes represented by `fundId`, while the global instrument contract requires financial assets to resolve to `ref_instruments.id`.

**Required fix:** keep `fundId` as the feature entity identifier if useful, but add/define a canonical `instrumentId` FK for the investment instrument (or explicitly document `fundId = ref_instruments.id` and prohibit a second identity). Do not allow cost basis/price history to key on an unregistered fund-only identifier.

### P0-DOC-011 — Stocks document hardcodes Iranian trade currency/Tether context at the wrong abstraction layer
**Location:** `Investment-Stocks-Iran.md` → opening description/business rules.

**Conflict:** the document begins with “all amounts are Rial” and requires a Tether rate for every trade, while later sections correctly state `exchangeRateToBase` means transaction currency → the user’s base currency and the Core is multi-currency.

**Required fix:** Iran market defaults should be expressed by the Iran market adapter/policy:

```text
transaction currency = normally IRR
base currency = user profile
exchangeRateToBase = transaction currency → user base
```

Tether is not an obligatory accounting currency for every stock transaction.

### P0-DOC-012 — Stocks brokerage cash path is both shared and feature-owned in prose
**Location:** `Investment-Stocks-Iran.md` → `cashBalance` and brokerage transaction sections.

**Conflict:** `cashBalance` is correctly declared as a snapshot, but some implementation descriptions still directly mutate it and describe it as a balance ledger.

**Required fix:** all ETF/FIF/stock brokerage cash must route through the same brokerage cash capability/port. `cashBalance` remains rebuildable projection only.

### P0-DOC-013 — Stocks brokerage accountId nullability is not aligned with standalone contract
**Location:** `Investment-Stocks-Iran.md` → `inv_stocks_iran_brokerage_transactions.accountId`.

**Fix:** make `accountId` nullable whenever the operation can be settled through non-Accounts/local/external settlement; a bank-integrated flow may require it at command validation. Do not make a bank FK a universal schema prerequisite of the feature.

### P0-DOC-014 — Corporate-action and settlement policy are scattered instead of owned by a single engine/policy
**Location:** Stocks feature + `Corporate-Action-Engine` + Iran market sections.

**Risk:** T+2, lot size, tick size, rights, symbol/ISIN changes and settlement rules can drift.

**Required fix:** feature doc provides required fields and behavior; the central engines own formulas and the Iran adapter owns market-calendar policy. One canonical implementation point per rule.

### P1-DOC-015 — `Data-Model-Relationship-Matrix.md` is too abstract for schema-freeze
**Location:** `docs/core/Data-Model-Relationship-Matrix.md`.

**Problem:** it identifies major clusters but does not enumerate the complete FK/cardinality/nullable/unique relationships needed for an actual schema freeze, while `db/01-schema-tables.md` is much more detailed.

**Fix:** make the relationship matrix the compact machine-review map and add a complete relationship table for every cross-table FK, including CA, loan schedule, fee, documents, price observations, tax and provenance links. ER diagrams should be generated from that matrix.

The existing matrix explicitly says diagrams must be generated from the matrix rather than manually maintained. fileciteturn56file0L2-L2

### P1-DOC-016 — Field preservation is not yet provably complete across every Feature field
**Location:** `Data-Dictionary.md` + `Field-Level-Data-Ownership-Matrix.md` versus large per-feature docs.

**Risk:** the global contract says “no field lost”, but the feature documents contain many feature-specific fields and the global dictionary is not yet an auditable 1-row-per-persisted-field inventory.

**Fix:** before schema freeze, every persisted field must appear in the dictionary with Kind, Owner, Currency semantics, Precision, SoT, Immutable/Editable, FK, index/unique and migration rule. The repository already states this gate, but the completeness proof must be delivered, not assumed. fileciteturn5file0L2-L2

### P1-DOC-017 — P0 lock count is now too large for humans to reliably resolve precedence
**Location:** many `P0-FINAL-*` and `P0-COST-BASIS-*` files under `docs/core/`.

**Problem:** numbering ranges overlap semantically (`P0-FINAL-005-010` vs `P0-FINAL-006-015`) and some later documents supersede earlier equations. This is the exact opposite of the desired “simple for the next developer” property.

**Fix:** consolidate implementation authority into a small number of canonical homes, keep numbered lock files only as migration/history indexes, and remove duplicated equations from feature docs.

Do **not** delete the locks blindly before all inbound references are redirected.

### P1-DOC-018 — P0/P1 checklist says 12 golden vectors, but only the critical executable set is present
**Location:** `docs/core/CODING-GATE.md` → Gate C, plus `fixtures/`.

**Problem:** Gate C promises 12 golden vectors, while the executable critical fixture set currently contains the four critical JSON cases seen in the repository. That makes the status wording too optimistic.

**Fix:** either supply the remaining numeric fixtures or change Gate C to “4 critical + N pending” until the full pack exists. Do not call the gate green while the matrix is incomplete.

## 4. Required canonical data model

### Accounting truth

```text
fin_operations
  ├─ fin_journal_entries
  │    └─ fin_journal_lines
  └─ immutable operation/audit/provenance metadata
```

`fin_accounts` represents cash/ledger accounts; their balances are derived from journal lines.

### Domain ledgers

```text
Crypto   → inv_crypto_transactions
Stocks   → inv_stocks_iran_transactions
Funds    → inv_fif_transactions
Metals   → inv_metals_transactions
Loans    → ln_transactions + loan fee/schedule domain
```

Holdings/schedules/balances are derived or snapshots; raw domain events stay preserved.

### Cash integration

```text
Feature
  → CashSettlementPort
      → AccountsCashAdapter        (integrated)
      → LocalSettlementAdapter     (standalone)
          ↓
      Core financial account + journal
```

No feature-owned cash balance is a second truth.

## 5. Required identity rules

```text
ref_instruments.id = canonical asset identity
symbol = mutable label
assetKey = provider/convenience index
ISIN = market attribute
providerSymbol = provider mapping
```

Holding identity additionally includes its location/custody context. Crypto network identity must not be inferred from symbol text.

## 6. Required money/precision rules

```text
Persist/API/fixtures: decimal strings
Calculation: Decimal.js (or equivalent decimal engine)
Currency scale != asset quantity scale
No SQL SUM/AVG for financial TEXT
Round only at the defined boundary/policy
```

The repository already has this principle in `Precision-Policy.md` and the financial invariants; the remaining work is making every feature doc use the same vocabulary. fileciteturn55file0L2-L2

## 7. Required Iran-specific financial coverage

### Stocks

Must retain, as separate concepts:
- trade/business date
- settlement date
- settled/available/pending cash
- brokerage fees and exchange/market fees
- transaction tax separate from tax-domain liabilities
- gross/withholding/net dividends
- rights and capital actions
- bonus/split/reverse split
- stable instrument identity across symbol changes
- lot size / price tick
- provider mapping

### Fixed-income funds

Must retain:
- ETF vs issuance/redemption route
- subscription vs redemption price
- NAV
- distribution vs accumulation
- gross dividend / withholding / net dividend
- reinvest as income leg + acquisition leg under one operation
- redemption/exit fees separate from NAV return
- historical NAV source/as-of/staleness
- external reported result separate from calculated result

### Loans

Must retain:
- borrowed vs lent
- principal vs fee
- declining / flat / bullet / Qarz rules
- day-count convention
- grace mode/date semantics
- variable rates by effective interval
- schedule vs accrual vs settled distinction
- multi-currency settlement FX
- explicit payment allocation to principal/interest/fee
- reversal symmetry

### Crypto

Must retain:
- instrument identity
- exchange/wallet/network/address separation
- internal/external transfer distinction
- bridge vs transfer vs economic swap
- gross/fee/net quantities
- fee funding asset/location
- C2C linked legs
- cost-basis policy
- historical price/FX paths
- IRR vs quote-currency P&L
- on-chain provenance (txHash/network/block/confirmations)

## 8. Offline requirements

The app must remain usable with no network for:

```text
create/read/update metadata
financial commands
reversal/correction
ledger/rebuild/reconcile
P&L/cost basis/loan schedule
reports
backup/restore/import/export
migration/integrity checks
```

Only enhancement services may require network:

```text
price refresh
FX refresh
version check
license refresh
```

Historical rebuild must consume stored observations only. The API contract already requires this. fileciteturn8file0L2-L2

## 9. UX / page strategy

The current IA direction is good: **9 top-level pages** with features inside Tabs/Sheets rather than a 20-page navigation. `Pages-IA.md` explicitly enforces this. fileciteturn58file0L1-L2

Recommended final shell:

```text
Dashboard
Accounts
Transactions
Investments
Loans
Assets
Planning
Reports
Settings
```

The accounting engine must remain available without creating a noisy `/accounting` navigation item.

## 10. What must NOT be added in v1

To preserve simplicity:

```text
microservices
full event-sourcing framework
mandatory HTTP server
CQRS framework
multi-user cloud sync
RBAC platform
AI decision layer
```

The current SPEC-FREEZE already agrees with this direction. fileciteturn46file0L2-L2

## 11. File cleanup decision

### Safe to remove now

`docs/core/ARCHIVE-NOTE-BATCH-LOCKS.md` is explicitly historical and says its rules live in canonical homes; it can be deleted **after removing the remaining inbound reference from the coding/authority docs**. fileciteturn67file0L2-L2

### Keep as pointer aliases

- `docs/core/Naming-Glossary.md`
- `docs/core/rounding/Rounding-Policy.md`

These are already intentionally pointer-only legacy paths and should not be treated as duplicate bodies. fileciteturn52file0L2-L2 fileciteturn53file0L2-L2

### Consolidation candidates — do NOT delete yet

The following P0 batches are candidates for consolidation into fewer canonical documents, but deletion is safe only after all inbound references are redirected and their unique rules are migrated:

- `docs/core/P0-FINAL-001-004-LOCKS.md`
- `docs/core/P0-COST-BASIS-PNL-001-005-LOCK.md`
- `docs/core/P0-FINAL-005-010-LOCKS.md`
- `docs/core/P0-FINAL-006-015-LOCKS.md`
- `docs/core/P0-FINAL-011-014-LOCKS.md`
- `docs/core/P0-FINAL-015-020-LOCKS.md`
- `docs/core/P0-FINAL-021-026-LOCKS.md`
- `docs/core/P0-FINAL-027-035-LOCKS.md`
- `docs/core/P0-FINAL-036-040-LOCKS.md`
- `docs/core/P0-FINAL-041-051-LOCKS.md`

**Preferred end-state:** one compact canonical lock index + concept documents. Numbered lock history can live under `docs/core/archive/` only if needed for archaeology.

### Other high-value duplicate candidates for the cleanup phase

Review these pairs before schema freeze:

- `Financial-Invariants.md` vs `Financial-Invariant-Catalog.md`
- `Financial-Scenarios.md` vs `Financial-Scenario-Catalog.md`
- `Naming-Glossary.md` vs `NAMING-GLOSSARY.md` (already pointer-safe)
- `Rounding-Policy.md` vs `rounding/Rounding-Policy.md` (already pointer-safe)

Do not delete either member of the first two pairs until their ownership/content overlap is verified.

## 12. Final coding gate

Before feature code starts, the repository should be able to answer **YES** to all of these:

- One cash SoT.
- One asset identity.
- One fee vocabulary and one fee allocation per event.
- One C2C semantic.
- One transfer/bridge cost release path.
- One Period Return bridge.
- One field-kind enum.
- One date/boundary policy.
- One API envelope/error model.
- One mutation path.
- Complete Data Dictionary coverage.
- Complete relationship/FK matrix.
- Complete schema + migration chain.
- Numeric golden fixtures green for every scoped financial engine.
- Standalone Loan/Crypto/Fund scenarios green.
- No network dependency for ledger correctness.
- Architecture checks ready before Feature implementation.

Until those are green, **coding should remain frozen**.

## 13. Audit conclusion

The project does **not** need more features right now. It needs consolidation and contract hygiene.

The strongest architecture already present is:

```text
simple UI
+ rich internal model
+ one accounting truth
+ specialized subledgers
+ strict Decimal semantics
+ offline-first persistence
+ independent feature APIs
+ optional integration adapters
```

The next objective is not to add another 20 documents. It is to make the existing rules impossible to misread.
