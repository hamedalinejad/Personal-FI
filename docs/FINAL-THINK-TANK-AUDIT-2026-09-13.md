# Personal-FI — Final AI Think-Tank Audit & Implementation Specification

**Date:** 2026-09-13  
**Repository:** `hamedalinejad/Personal-FI`  
**Project phase:** Documentation/specification only; coding has not started as the production implementation phase.  
**Release verdict:** `NO-GO` until semantic freeze, golden fixtures, recovery, standalone editions and release evidence are proven.

> This document is the final consolidation audit. It is deliberately a single implementation-oriented document, not another permanent BUG/P0/FIX/MATRIX layer. The repository's locked documentation standard says history belongs in Git, contracts in Owner Docs, proof in tests/fixtures and live status in QUALITY/registry.

---

# 1. Executive decision

The recent documentation standardization is directionally correct and should **continue reducing files**, not recreating the old collection of P0/BUG/GAP/AUDIT/FIX documents.

The architecture already has the right target shape:

```text
PRODUCT
→ ARCHITECTURE
→ FINANCIAL-CORE
→ DATA-MODEL
→ API
→ REPORTING
→ OFFLINE-RELEASE
→ DEVELOPMENT
→ MODULE
→ SCHEMA
→ FIXTURE
→ TEST
```

The project is **not yet implementation-safe without developer interpretation**. The remaining work is mainly semantic reconciliation and machine-verifiable coverage.

The most important principle is:

```text
ONE CONCEPT
→ ONE OWNER
→ ONE SCHEMA LOCATION
→ ONE API PATH
→ ONE PROOF PATH
```

No new global audit documents should be created after this consolidation. A real bug becomes a code fix + test; a changed business rule updates its single owner + fixture/test; status changes update QUALITY/registry.

---

# 2. AI think-tank composition

## 2.1 System architect

Focus: dependency direction, modularity, feature isolation, standalone editions.

Verdict: the six-route UI and public-API boundary are appropriate. Features must never depend on another feature's internals. Core must not depend on features.

## 2.2 Double-entry accounting specialist

Focus: journal truth, cash settlement, fee treatment, reversal, statements, reconciliation.

Verdict: accounting must remain the center of the system. Holdings and feature balances are projections; `fin_journal_*` remains the accounting source of truth.

## 2.3 Financial-calculation specialist

Focus: Decimal arithmetic, rounding, rates, cost basis, FX, schedules.

Verdict: no IEEE floating-point arithmetic in financial domain logic. Every formula needs exact input units, precision, rounding point and residual policy.

## 2.4 Iran-finance specialist

Focus: IRR/Toman, Tehran market settlement, stock commission/tax, funds, gold/metals.

Verdict: Iran-specific policies must be versioned and isolated from generic accounting Core. Do not hard-code changing official market rules into the Core.

## 2.5 Investment specialist

Focus: crypto, stocks, funds, metals, cost basis, realized/unrealized P&L, valuation.

Verdict: trade price, NAV, liquidation price, settlement cash and valuation price must never be conflated.

## 2.6 Loan specialist

Focus: declining/flat/Qarz/bullet schedules, fees, residuals and payments.

Verdict: Loan is currently the strongest reference module, but formulas must be self-contained in the module contract rather than requiring source-code interpretation.

## 2.7 Data engineer

Focus: field preservation, identity, lineage, schema relationships, migration.

Verdict: no-field-loss must become machine-verifiable, not merely a prose principle.

## 2.8 Offline/recovery engineer

Focus: SQLite transactionality, browser persistence, backups, crash recovery, single writer.

Verdict: Node SQLite is the primary path, but browser persistence is not release-proven.

## 2.9 API/software architect

Focus: commands, queries, envelopes, idempotency and feature APIs.

Verdict: every command must be implementable from its contract without reading internals.

## 2.10 QA/release engineer

Focus: golden fixtures, invariants, recovery and release gates.

Verdict: `IMPLEMENTED` is not release proof. `GOLDEN-GREEN`, `RECOVERY-GREEN`, `STANDALONE-GREEN` and `RELEASE-PROVEN` must remain distinct.

## 2.11 UX/product architect

Focus: simplicity and low page count.

Verdict: feature != page. Keep a maximum of six top-level routes and use sheets/drawers for feature operations.

## 2.12 Licensing/product strategy

Focus: standalone editions and future subscription/licensing.

Verdict: a Loan-only, Fund-only, Metals-only, Crypto-only or Stocks-only edition must operate without requiring the main Accounting UI. Licensing disables capabilities; it must never delete historical data.

---

# 3. Required product shape

## 3.1 Top-level routes

Keep:

```text
/
/money
/transactions
/investments
/loans
/more
```

Do not create separate top-level pages for every feature.

## 3.2 Feature boundary

Every feature exposes a public API and owns its feature ledger/domain tables.

It may call Core ports:

```text
CashSettlementPort
PersistencePort
PriceProvider
FXProvider
```

It may not directly call another feature's internals, SQL internals or broker APIs.

## 3.3 Standalone editions

Required editions include at least:

```text
Loan-only
Crypto-only
Stocks-only
Funds-only
Metals-only
Full
```

Standalone mode still uses the Financial Core and Journal. It may create local settlement accounts internally, but it must not force the user through the full Accounts UI.

Downgrade/license restriction:

```text
hide/disable capability
≠ delete data
```

History, exports and deterministic rebuild remain available.

---

# 4. P0 defects — must close before semantic freeze

## P0-01 — Duplicate economic identity/hash implementation

**Exact location:** `src/core/domain/operation/operationEngine.js`

### Current defect
`buildEconomicIdentity(norm)` and `computeCommandHash(norm)` already exist, but `runAtomicFinancialOperation()` independently rebuilds the same `payloadForHash` object and calls `stableHash()` again.

### Why it is dangerous
Two copies of the same financial identity can diverge. A future field could be added to one path and not the other, causing false idempotency conflicts or allowing economic differences to share a hash.

### Required fix
Use one implementation only:

```js
const commandHash = computeCommandHash(norm);
```

Delete the duplicate `payloadForHash` construction.

### Required proof
Add a test that proves the hash used by the operation runner is exactly `computeCommandHash(normalizedCommand)`.

---

## P0-02 — Durability vocabulary mismatch

**Exact location:** `src/core/domain/operation/operationEngine.js` and `docs/core/db/schema.sql`.

### Current defect
The operation runner treats these states as replayable:

```text
sql_committed
swapped
persisted
durable
```

while the documented/schema vocabulary is centered on:

```text
pending
sql_committed
persisted
persist_failed
```

### Risk
A programmer cannot know whether `swapped` and `durable` are valid current states, compatibility states or obsolete states.

### Required fix
Choose one canonical state machine. If `swapped` and `durable` are legacy compatibility values, remove them from the normative contract and explicitly migrate/translate them at the persistence boundary. Do not leave them as undocumented runtime states.

### Proof
A state-machine test must reject every undocumented durability state.

---

## P0-03 — Requirements matrix points to deleted documents

**Exact location:** `docs/core/registry/requirements-matrix.json`.

The current registry still contains references such as:

```text
docs/core/Field-Level-SoT.md
docs/core/command-coverage/COMMAND-FIELD-MATRIX.md
docs/core/Instrument-Identity.md
docs/core/Money-Decimal-Policy.md
docs/core/Fee-Treatment-Matrix.md
docs/core/authority/STOCKS-TN-SETTLEMENT.md
docs/core/Corporate-Action-Engine.md
docs/core/Import-Infrastructure.md
docs/core/License-Gate.md
docs/core/authority/API-CONTRACT.md
docs/core/CODING-GATE.md
```

These conflict with the locked current tree.

### Required fix
Repoint each live requirement to its current Owner document, source contract, schema or machine proof.

If a path is historical, mark it explicitly historical; do not leave it as an active `define` path.

---

## P0-04 — Requirements checker accepts broken references

**Exact location:** `scripts/requirements-matrix-check.js`.

### Current defect
Missing `define` paths are warnings rather than hard failures.

### Required fix
Implement:

```text
missing live reference → FAIL
missing HISTORICAL/DEFERRED reference → allowed
```

Add tests for both cases.

---

## P0-05 — Contradictory schema freeze status

**Exact location:** `docs/core/registry/status.registry.json`.

Current data contains:

```text
schema_status.FREEZE_PROVEN = false
```

but also:

```text
documentation.schema_freeze_proven = true
```

### Required fix
There must be one canonical state only. The schema status currently should remain:

```json
{
  "SPEC_LOCKED": true,
  "FREEZE_PROVEN": false,
  "RELEASE_PROVEN": false
}
```

until the actual semantic freeze evidence exists.

---

## P0-06 — Authority-owner registry is stale

**Exact location:** `docs/core/registry/status.registry.json`.

`authority_owners` still points to deleted old paths for API, Accounting, Loan, Reports, Offline and FieldKind.

### Required fix
Replace them with the current owners:

```text
API → docs/API.md
Accounting → docs/FINANCIAL-CORE.md
Loan → docs/modules/loan.md
Reports → docs/REPORTING.md
Offline → docs/OFFLINE-RELEASE.md
FieldKind → docs/DATA-MODEL.md
```

---

## P0-07 — Release evidence contains dead documentation references

**Exact location:** `docs/core/RELEASE-EVIDENCE.json`.

Current `docs` references include old status/audit/authority documents that were removed from the standardized tree.

### Required fix
Release evidence must reference only live current artifacts:

```text
docs/QUALITY-STATUS.md
docs/DOCUMENTATION-STANDARD.md
docs/PRODUCT.md
docs/ARCHITECTURE.md
docs/FINANCIAL-CORE.md
docs/DATA-MODEL.md
docs/API.md
docs/REPORTING.md
docs/OFFLINE-RELEASE.md
docs/DEVELOPMENT.md
docs/modules/*.md
machine registry
schema
fixtures
tests
```

---

## P0-08 — Cache/source-of-truth ambiguity

**Exact location:** `docs/core/db/schema.sql`, particularly:

```text
fin_operations.durability_state
fin_operations.source
fin_journal_entries.post_state
acc_accounts.current_balance
```

### Required fix
For every such field document machine-level semantics:

```text
kind
owner
writer
rebuild source
whether direct writes are forbidden
```

The accounting source of truth remains journal + financial accounts. Cached balance must never become a second ledger.

---

## P0-09 — Field preservation is not fully executable

**Exact location:** `docs/DATA-MODEL.md`, `docs/core/field-inventory.checklist.tsv`, registry and command implementations.

### Required fix
For every field and command establish:

```text
field
→ owner
→ request source
→ normalization
→ schema column
→ journal/domain effect
→ query
→ report
→ export
→ reversal
→ migration
```

A machine checker must fail if a documented field has no destination or an undocumented schema field is introduced without classification.

---

# 5. P1 defects and required improvements

## P1-01 — Old ticket identifiers remain in source comments

**Location:** `src/core/domain/operation/operationEngine.js`.

Examples include `B-038`, `P0-OP-003` and `OFFLINE-002`.

### Fix
Replace ticket IDs with semantic comments. Historical ticket identity belongs in Git, not production source comments.

---

## P1-02 — Documentation validator does not fully enforce the target tree

**Location:** `scripts/docs-validator.js`.

### Fix
Validate all eleven module documents plus required machine artifacts, rather than only a subset.

Do not make the validator enormous; use focused validators for registry, field inventory, schema, boundaries and release evidence.

---

## P1-03 — Documentation consistency script still understands obsolete document locations

**Location:** `scripts/docs-consistency.js`.

### Fix
Remove logic whose only purpose is checking old documents. Replace it with checks against the current Owner tree and machine registry.

---

# 6. Missing requirements — complete implementation contract

## R-01 — Universal command contract

Every command must define:

```text
command ID
purpose
request fields
required/optional
field types
units
currency semantics
decimal precision
normalization
defaults
identity
validation
journal mapping
fees
FX
cost basis
DB writes
transaction boundary
idempotency
reversal
result
errors
queries affected
reports affected
standalone behavior
fixture
invariants
recovery behavior
```

No programmer should need to infer any of these from implementation source.

---

## R-02 — Complete money/unit table

Define globally:

```text
money
quantity
price
rate
percentage
weight
purity
fine weight
units
```

For every type specify:

```text
API representation
DB representation
arithmetic type
precision
rounding
zero/negative rules
currency/unit
```

---

## R-03 — Complete FX contract

Required:

- direct rate
- inverse rate
- cross rate
- multi-hop rate
- source priority
- `asOf`
- stale policy
- manual override
- stored historical rate
- missing-rate fail-closed
- deterministic rebuild

Canonical definition:

```text
exchangeRateToBase = base currency units per 1 transaction currency unit
amountInBase = amount × exchangeRateToBase
```

Historical rebuild must use stored rates, not today's market rate.

---

## R-04 — Crypto economic event model

Implemented baseline:

```text
crypto.buy
crypto.sell
crypto.transfer
```

The specification must explicitly define or defer:

```text
deposit
withdrawal
swap
airdrop
opening balance
external transfer
fee-only event
```

Every crypto transaction needs an explicit `economic_kind` where semantics differ.

---

## R-05 — Crypto fee semantics

Explicitly support/define:

```text
cash fee
asset fee
fee deducted from received quantity
fee paid in base asset
fee paid in quote asset
network fee
exchange fee
externally funded fee
```

Each combination must show expected holdings, journal and cost-basis effects.

---

## R-06 — Iran stocks settlement contract

Must fully define:

```text
tradeDate
settlementDate
T+n
business calendar
holiday handling
buy
sell
commission
tax
other fees
cash payable/receivable
settlement command
```

The holiday calendar must be versioned and replaceable.

---

## R-07 — Corporate actions

Either implement or explicitly defer:

```text
dividend
bonus share
split
reverse split
rights
capital increase
merger
spinoff
symbol change
```

No undocumented corporate-action mutation may alter holdings.

---

## R-08 — Funds

Must fully define:

```text
subscription
redemption
cash distribution
reinvestment
unit issuance
NAV
transaction price
liquidation price
ex-date
record-date
payment-date
```

NAV must never be used automatically as transaction price or liquidation price.

---

## R-09 — Metals

Must define:

```text
gross weight
purity
fine weight
unit
serial number
certificate
storage/location
delivery
purchase fee
delivery fee
quote basis
valuation price
```

Purity and fine weight must distinguish RAW vs DERIVED values.

---

## R-10 — Loan mathematics

The loan module must contain exact formulas for:

### Flat rate

Define principal `P`, annual rate `r`, number of periods `n`, periodic rate convention and rounding point. The exact interest formula must be normative rather than delegated to an unspecified engine.

### Declining balance

Define periodic rate conversion, installment formula, interest calculation order, rounding and final residual adjustment.

### Qarz-al-Hasaneh

Define its exact zero/low-profit schedule rules, fees, payment behavior and any non-interest charges.

### Bullet

Define periodic interest, principal due date, partial payment and residual rules.

### All loan methods

Define:

```text
payment waterfall
penalty → fee → interest → principal
overpayment
underpayment
early settlement
last-row residual
schedule regeneration
schedule snapshot
engine version
```

No programmer should have to inspect `scheduleEngine.js` to discover the financial formula.

---

## R-11 — Loan fee taxonomy

Every fee must declare:

```text
kind
amount
currency
timing
payer
cash/asset funding
expense vs capitalized vs reduction
journal mapping
schedule effect
reversal
```

---

## R-12 — Investment performance

Define exact formulas and cash-flow conventions for:

```text
realized P&L
unrealized P&L
TWR
MWR/IRR
fees
FX gain/loss
as-of valuation
cash flows
```

---

## R-13 — Deterministic rebuild API

Must expose a clear operation/query contract:

```text
rebuild(asOf, engineVersions, sourceLedger)
```

Same ledger + same context must produce the same result.

---

## R-14 — Import lineage

Required chain:

```text
import_batch
→ raw_record
→ dedupe_key
→ normalized record
→ operation
→ journal
→ provenance
```

Unknown provider fields must survive import/export unless the user explicitly chooses a destructive transformation.

---

## R-15 — Backup format

Define machine format containing:

```text
format version
schema version
database payload
metadata
checksums
creation timestamp
application/engine versions
restore validation
atomic replace behavior
corruption behavior
```

---

## R-16 — Browser offline

Before browser release proof:

```text
sql.js
→ IndexedDB durable storage
→ reopen
→ reload
→ recovery
→ migration
→ single-writer/tab policy
→ durable ACK
```

A durable-memory protocol is not sufficient evidence for shipping browser production.

---

## R-17 — Licensing

Define:

```text
edition
entitlement
capability gate
offline entitlement storage
expiry behavior
upgrade
Downgrade
history preservation
export
rebuild
standalone boot
```

License logic must sit at public API/capability boundaries, never as a data-deletion mechanism.

---

## R-18 — Per-command API schemas

Every public command requires machine-readable request/response schemas. A generic envelope alone is insufficient.

---

# 7. Accounting invariants — mandatory

## Money

```text
No float money arithmetic.
```

## Journal balance

For every posted operation:

```text
Σ debit(amountInBase) = Σ credit(amountInBase)
```

exactly, not approximately.

## Currency

Every line has a currency. Non-base lines require the applicable exchange rate and base amount.

## Reversal

Posted data is never edited in place. A reversal is a new operation linked to the original.

## Dates

Do not collapse:

```text
businessDate
tradeDate
settlementDate
eventAt
marketDate
priceAsOf
fxAsOf
```

Stocks position on trade date and cash on settlement date must remain distinct.

---

# 8. Data model rules

## 8.1 Identity

Canonical identities:

```text
operationId
instrumentId
accountId
holdingId
partyId
featureId
```

Provider symbol is not identity.

## 8.2 Holding scope

```text
Crypto = instrument + venue/network
Stocks = instrument + brokerage/account
Funds = instrument + account
Metals = instrument + platform/account
```

## 8.3 Posted ledger deletion

No `deletedAt` strategy may hide posted accounting history.

## 8.4 Raw preservation

Imports preserve raw provider records and unknown fields.

---

# 9. Database relationship contract

The conceptual relationship must remain:

```text
Operation
   │
   ├── Journal Entries
   │      └── Journal Lines
   │             └── Accounts
   │
   └── Feature transaction rows
           └── Holdings / schedules / domain projections
```

Cash truth:

```text
fin_journal_lines + fin_accounts
```

Feature balances are rebuildable projections.

A feature transaction row must link back to its `operationId`.

---

# 10. API contract

Canonical envelope:

```json
{
  "success": true,
  "data": {},
  "errors": [],
  "meta": {
    "request_id": "...",
    "operation_id": "...",
    "api_version": "1",
    "schema_version": "1"
  },
  "engine_versions": {}
}
```

Errors must use stable machine-readable error codes.

Idempotency:

```text
operationId + canonical economic hash
```

Same operation ID + same economics = replay.  
Same operation ID + different economics = conflict.

Queries must not post journal entries.

---

# 11. Offline transaction pipeline

The canonical write path should be:

```text
UI
→ Feature Public API
→ validation
→ normalize
→ calculation context
→ fee engine
→ domain policy
→ cost basis/schedule
→ balanced journal
→ invariants
→ one SQLite transaction
→ durable ACK
→ API envelope
→ projections
```

For Node SQLite, the transaction boundary should be owned by the operation engine/persistence layer, not by UI code.

Single-writer enforcement is mandatory.

---

# 12. Release/recovery matrix

Before `RELEASE_PROVEN`, prove:

| Scenario | Expected result |
|---|---|
| Crash before commit | no posted operation |
| Crash after SQL commit | operation recoverable |
| Repeat same operation | idempotent replay |
| Same ID, changed economics | conflict |
| Offline reopen | data intact |
| Backup | complete package |
| Restore | exact recoverable state |
| Corrupt backup | safe rejection |
| Browser reload | durable state retained |
| Multi-tab write | single-writer protection |
| Rebuild | deterministic result |
| Reversal | inverse accounting with linkage |

---

# 13. Golden fixture strategy

Canonical machine fixtures remain in `fixtures/` and are indexed by `docs/core/registry/fixture-manifest.json`.

Critical families must cover at least:

```text
opening balance
reversal
Toman input
crypto buy/sell
crypto transfer fee
crypto swap
fund NAV vs transaction price
fund distribution/reinvestment
loan flat
loan bullet
loan Qarz
stock T+2
stock fees
corporate action
standalone loan
standalone crypto
standalone stocks
standalone funds
standalone metals
```

Every fixture should contain enough information to prove:

```text
input
normalized input
journal
expected balances/holdings
cost basis
P&L
report impact
invariants
reversal if applicable
```

Markdown duplicate fixtures should not become a second source of truth.

---

# 14. Files that should remain active

## Human normative layer

```text
docs/README.md
docs/DOCUMENTATION-STANDARD.md
docs/PRODUCT.md
docs/ARCHITECTURE.md
docs/FINANCIAL-CORE.md
docs/DATA-MODEL.md
docs/API.md
docs/REPORTING.md
docs/OFFLINE-RELEASE.md
docs/DEVELOPMENT.md
docs/QUALITY-STATUS.md
```

## Feature layer

```text
docs/modules/accounts.md
docs/modules/income-expense.md
docs/modules/cheque.md
docs/modules/loan.md
docs/modules/crypto.md
docs/modules/stocks.md
docs/modules/funds.md
docs/modules/metals.md
docs/modules/physical-assets.md
docs/modules/budget-goals-bills.md
docs/modules/tax.md
```

## Machine proof

```text
docs/core/RELEASE-EVIDENCE.json
docs/core/field-inventory.checklist.tsv
docs/core/registry.index.json
docs/core/db/schema.sql
docs/core/db/schema.manifest.json
docs/core/json-schemas/*
docs/core/registry/*
fixtures/*
tests/*
```

## History

```text
docs/archive/AUDIT-HISTORY.md
```

Git remains the complete detailed historical record.

---

# 15. Files/content that are candidates for deletion from ACTIVE docs

The following categories should no longer exist as active normative documents:

```text
P0-*.md
BUG-*.md
GAP-*.md
FIX-*.md
AUDIT-*.md
VERDICT-*.md
REQ-*.md as separate requirement specs
MATRIX-*.md as duplicate specification
READY-FOR-CODING.md
DEVELOPER-HANDOFF.md when it duplicates the owner chain
Technical-Architecture.md when it duplicates ARCHITECTURE.md
API-Reference.md when it duplicates API.md
Project-Blueprint.md when it duplicates PRODUCT/ARCHITECTURE
Product-Map-*.md when it duplicates PRODUCT.md
MODULE-TEMPLATE.md when DEVELOPMENT.md owns the template
old Data-Dictionary / Field-Level-SoT documents
old command-coverage prose matrices
old accounting authority duplicates
old offline authority duplicates
old loan authority duplicates
old report authority duplicates
old schema-freeze prose duplicates
old migration/backup prose duplicates
old Markdown fixture duplicates
```

### Important deletion rule

Do **not** delete a file merely because its filename looks obsolete.

Before deletion prove:

```text
1. Semantic content absorbed?
2. Every field preserved?
3. Proof/test preserved?
```

If any answer is `NO`, deletion is forbidden until the content is absorbed into the correct Owner or machine proof.

---

# 16. Recent standardization result — what was correct

The recent standardization direction correctly establishes:

- one Owner document per concept
- one 34-section module template
- machine-only `docs/core`
- Git as history
- fixtures/tests as proof
- QUALITY/registry as live status
- six-route navigation
- standalone feature architecture
- no new BUG/GAP/AUDIT documentation
- production `NO_GO` until release proof

This should be preserved.

---

# 17. What must NOT be restored blindly

Do not restore every deleted legacy document simply because it contained useful information.

That would recreate the exact documentation fragmentation the project is trying to eliminate.

Instead:

```text
legacy document
→ extract semantic requirement
→ identify Owner
→ migrate requirement
→ add fixture/test if behavior
→ update machine registry
→ delete duplicate document
```

The requirement survives; the obsolete filename does not.

---

# 18. Exact implementation sequence after documentation freeze

## Phase A — semantic foundation

```text
Decimal/money
→ units
→ currency
→ FX
→ identity
```

## Phase B — accounting engine

```text
accounts
→ operation
→ journal
→ invariant gate
→ reversal
→ reconciliation
```

## Phase C — persistence

```text
SQLite
→ transaction boundary
→ durability
→ recovery
→ backup/restore
```

## Phase D — feature engines

```text
Loan
→ Crypto
→ Stocks
→ Funds
→ Metals
```

Then:

```text
physical assets
→ planning
→ tax
→ reporting
```

## Phase E — offline/browser

Implement browser adapter only after the persistence contract is stable.

## Phase F — standalone/licensing

Add entitlement gates around public APIs/capabilities.

## Phase G — UI

Build the six-route shell and sheets/drawers over stable APIs.

---

# 19. Definition of documentation complete

The documentation phase is complete only when a programmer/AI can take any command and answer all of these without guessing:

```text
What is the command ID?
What fields does it accept?
Which are required?
What are their types?
What units do they use?
What currency do they use?
How are decimals normalized?
What is the identity?
What validation occurs?
What calculation formula applies?
What fee rules apply?
What FX rule applies?
What cost-basis rule applies?
What journal lines are created?
Which DB tables/columns change?
What transaction boundary applies?
What is the idempotency key/hash?
How is it reversed?
What does the query return?
What reports change?
What happens in standalone mode?
What error codes can occur?
What fixture proves it?
What invariant proves it?
What happens after crash/retry?
```

If one answer requires inspecting source code or guessing, the contract is incomplete.

---

# 20. Final status matrix

| Area | Verdict |
|---|---|
| Documentation architecture | GOOD |
| One-owner model | GOOD |
| Module standardization | GOOD |
| Minimal navigation | GOOD |
| Feature isolation | GOOD direction |
| Accounting architecture | GOOD direction |
| Decimal policy | STRONG |
| Data preservation | PARTIAL |
| Economic idempotency | BUG — fix required |
| Durability vocabulary | BUG — reconcile |
| Registry integrity | BUG — fix required |
| Requirements checker | BUG — hard-fail required |
| FX | PARTIAL |
| Crypto | PARTIAL |
| Iran stocks | PARTIAL |
| Funds | PARTIAL |
| Metals | PARTIAL |
| Loan | STRONGEST module; formulas need expansion |
| Corporate actions | SPEC / deferred |
| Reporting | PARTIAL |
| Import lineage | PARTIAL |
| Backup/restore | PARTIAL |
| Browser offline | PARTIAL |
| Licensing | SPEC / not runtime-proven |
| Standalone editions | PARTIAL |
| Schema freeze | NOT PROVEN |
| Production | NO-GO |

---

# 21. Final P0 closure checklist

```text
[ ] Remove duplicate economic hash construction
[ ] Canonicalize durability-state vocabulary
[ ] Clean all dead requirements-matrix references
[ ] Make requirements checker fail on missing live paths
[ ] Remove contradictory FREEZE_PROVEN field
[ ] Repair authority_owners registry
[ ] Repair RELEASE-EVIDENCE references
[ ] Explicitly classify cached/source fields
[ ] Complete field preservation machine proof
[ ] Complete FX contract
[ ] Complete Loan formulas
[ ] Complete Crypto event/fee semantics
[ ] Complete Iran stock settlement/fee/calendar contract
[ ] Complete Fund distribution/reinvest semantics
[ ] Complete Metals physical/financial fields
[ ] Complete performance reporting definitions
[ ] Complete deterministic rebuild contract
[ ] Complete import lineage proof
[ ] Complete backup format
[ ] Complete browser recovery proof before browser release
[ ] Complete standalone golden packs
```

---

# 22. Final cleanup rule

After this document is accepted, **do not create another global final audit document**.

The repository should converge to:

```text
Owner docs = specification
Modules = feature specification
Schema = persistence contract
JSON schemas = machine contract
Fixtures = expected behavior
Tests = proof
QUALITY = live state
Git = history
```

No permanent:

```text
P0 → BUG → FIX → AUDIT → FINAL → FINAL-2 → MATRIX
```

cycle.

---

# 23. Final architectural statement

Personal-FI should be treated as an **offline-first personal accounting and investment engine with modular feature applications**, not as a collection of disconnected investment pages.

Accounting is the foundation.

The desired relationship is:

```text
                 ┌───────────────┐
                 │   UI / Apps   │
                 └───────┬───────┘
                         │ API
                 ┌───────▼───────┐
                 │ Feature APIs   │
                 └───────┬───────┘
                         │
              ┌──────────▼──────────┐
              │ Financial Core      │
              │ Money / FX / Fees  │
              │ Cost / Schedule   │
              └──────────┬──────────┘
                         │
                  ┌──────▼──────┐
                  │ Journal/GL  │
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │ Persistence │
                  └─────────────┘
```

A Loan-only user, Fund-only user or Metals-only user can enter through the relevant feature API and receive complete feature functionality and reporting without being forced into the full UI. Nevertheless, all financial effects use the same accounting truth and invariant system.

That is the simplest architecture that still supports accurate accounting, Iranian financial realities, offline operation, modular implementation and future licensing.

---

# 24. Handoff sentence

> **A future programmer or AI should need only the current Owner Docs + the selected module + schema + machine schemas + fixtures/tests to implement the system correctly; Git history is history, not a missing specification.**

---

## Audit evidence used

The current documentation standard explicitly defines the authoritative tree, one-owner rule, machine-only core, history/proof separation and coding handoff. fileciteturn44file0

The current requirements registry still contains legacy paths and records the major incomplete areas identified above. fileciteturn45file0

The operation engine currently contains the duplicate economic-hash construction and legacy ticket/status vocabulary identified above. fileciteturn46file0

The status registry currently shows `FREEZE_PROVEN=false` while separately declaring `documentation.schema_freeze_proven=true`, and its authority-owner paths are stale. fileciteturn47file0

The release evidence currently remains `NO-GO` and contains references to legacy documentation paths that must be reconciled. fileciteturn48file0
