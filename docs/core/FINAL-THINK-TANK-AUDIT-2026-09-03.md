# Personal-FI — Final Think-Tank Repository Audit
## Final Documentation / Architecture / Data Integrity / Modularity Review — 2026-09-03

**Repository:** `hamedalinejad/Personal-FI`

**Audited branch:** `main`

**Original audited HEAD (2026-09-03 baseline):** `cbfd5c49e68031b9e0c80287b409416bd771f56f`  
**Verification refresh note:** contracts re-verified against later HEADs; live status → `docs/core/OPEN-ISSUES-REGISTER.md` + `GO-NO-GO.md`. This file is **historical authority for findings**, not live HEAD metadata.

**Audit nature:** documentation-first architecture audit + executable Core/fixtures audit + cross-document consistency audit.

**Important limitation:** the repository is still docs-first. The business Feature implementations are not yet present as production code. Therefore:

- code bugs below are only bugs that can be confirmed in the executable Core/fixture layer;
- Feature-level risks are primarily **specification defects, missing contracts, schema-freeze gaps, or acceptance gaps**, not claims about runtime code that does not yet exist;
- a feature cannot be declared runtime-correct until its implementation exists and its golden/standalone/integrity tests pass.

---

# 1. Executive decision

## Final verdict

**Status: BLOCKED FOR FEATURE CODING UNTIL THE REMAINING P0 SPECIFICATION CONTRADICTIONS ARE CLOSED AND A REAL SCHEMA FREEZE IS COMPLETED.**

The architecture direction is strong. The repository already has the right strategic ideas for a serious offline personal-finance/investment system:

- decimal-string financial persistence;
- immutable posted financial facts;
- reversal/correction rather than destructive financial UPDATE;
- one accounting cash source of truth;
- canonical instrument identity;
- explicit cost-basis and valuation engines;
- feature-to-feature isolation through Public API / Port / Adapter;
- offline transaction recording and local valuation;
- standalone feature editions such as Loan-only, Fund-only, Crypto-only, Stocks-only and Metals-only;
- provenance, import lineage, snapshots and rebuild/reconciliation concepts;
- future offline licensing outside the financial ledger.

The current danger is **not lack of capability ideas**. The main danger is that several rules have been written more than once and a few versions still conflict. That can cause two competent developers to produce two different implementations from the same repository.

The repository's newer consolidation policy correctly establishes that ticket numbers such as `P0-FIX-*`, `P0-FINAL-*`, and `AUD-*` are traceability labels, not independent authority. The canonical concept document plus its explicit lock section is the implementation authority. [See: `docs/core/DOC-CONSOLIDATION-POLICY.md`.]

---

# 2. Think-tank composition

This is a **synthesized expert-panel methodology**, not a claim that external people literally reviewed the repository.

## 2.1 System / Data Architect

Focus:

- bounded contexts;
- source of truth;
- schema normalization vs useful denormalization;
- dependency graph;
- rebuildability;
- historical correctness;
- no duplicated identities;
- no duplicated financial truths.

Primary question:

> Can every value be traced to one canonical owner and rebuilt deterministically?

## 2.2 Accounting / Bookkeeping Specialist

Focus:

- double-entry journal;
- cash settlement;
- receivables/payables;
- realized vs unrealized P&L;
- fee classification;
- loan principal vs interest vs service fee;
- corrections and reversals;
- period return bridges.

Primary question:

> Does every economic event have exactly one accounting interpretation and can it reconcile without double counting?

## 2.3 Iran Investment / Market Specialist

Focus:

- Iranian stock-market semantics;
- IRR / Toman display vs storage;
- commissions and taxes;
- T+2 settlement;
- corporate actions;
- rights and dividend cases;
- Iranian fund/NAV behavior;
- local calendar and business dates;
- local money/rounding rules.

Primary question:

> Can the system represent real Iranian transactions without baking Iran-specific assumptions into global accounting abstractions?

## 2.4 API / Modularity Architect

Focus:

- command/query separation;
- transport agnosticism;
- feature Public API;
- capability layer;
- ports/adapters;
- standalone editions;
- dependency inversion;
- API versioning and idempotency.

Primary question:

> Can one feature be built, tested, sold, enabled, disabled, upgraded and used without dragging unrelated feature UI or repositories into the runtime?

## 2.5 UX / Product Architect

Focus:

- minimal page count;
- shallow information architecture;
- one shell with tabs/sheets rather than dozens of routes;
- feature discoverability;
- simple data entry;
- complex calculations hidden behind simple forms.

Primary question:

> Can the product become more capable without becoming more cluttered?

## 2.6 QA / Integrity Auditor

Focus:

- invariants;
- golden fixtures;
- failure cases;
- mutation protection;
- duplicate operations;
- stale prices;
- partial writes;
- backup/restore;
- deterministic rebuilds.

Primary question:

> What is the smallest adversarial scenario that can produce a wrong financial result?

## 2.7 Licensing / Product Strategy

Focus:

- offline entitlements;
- edition flags;
- independent feature packs;
- data access vs feature access;
- future multi-user/workspace support;
- keeping license concerns out of the ledger.

Primary question:

> Can the same core support different editions without contaminating accounting logic with commercial rules?

## 2.8 Additional “missing perspective” added by the panel: Data Provenance / Migration Specialist

This perspective is essential because the product promise is not simply “calculate correctly today”; it is:

> retain enough raw context that tomorrow's calculations can still explain yesterday's numbers.

Focus:

- provenance;
- source documents;
- imports;
- migrations;
- historic valuation context;
- preservation of fields;
- backward compatibility.

---

# 3. Current repository shape

The current repository is documentation-heavy and contains a relatively small executable Core/fixture surface. It includes extensive feature documents for Accounts, Income, Expense, Cheques, Loans, Crypto, Iranian Stocks, Fixed-Income Funds, Metals, Physical Assets, Budgeting, Goals, Recurring Transactions, Notifications, Reports, Dashboard, Wealth Overview, Tax, Documents, Settings, Currency/CrossRate, Security/Privacy and Price Fetching.

The current source tree is still small relative to those specifications. The executable Core currently centers around:

- money canonicalization;
- Toman conversion;
- cost-basis helpers;
- valuation attribution;
- P&L report shape;
- fixture harness;
- critical fixtures/tests;
- architectural tests.

That means the correct development sequence is **not** “start implementing all screens”. The correct sequence is:

```text
Canonical rules
  → schema freeze
  → fixture/golden gate
  → Core financial engines
  → one feature at a time
  → feature API
  → UI shell
  → cross-feature integration
```

---

# 4. Confirmed executable code bugs — already fixed in the audit cycle

These are bugs in the executable Core/fixture layer that were identified and fixed in the 2026-09-03 audit sequence.

## P0-CODE-001 — non-finite decimal input acceptance

**File:** `src/core/money/canonicalDecimal.ts`

**Function:** `canonicalDecimalString()`

### Bug mechanism

The previous implementation allowed Decimal values that could represent non-finite values such as `NaN` and `Infinity` to cross the financial canonicalization boundary.

For a financial system this is a hard boundary violation because a non-finite value can:

- poison calculations;
- make hashes non-deterministic or meaningless;
- break persistence assumptions;
- make comparison/reporting invalid.

### Correct fix

- require string input;
- trim before parse;
- reject empty input;
- parse using Decimal;
- require finite value;
- canonicalize `-0` to `0`;
- normalize scientific notation to canonical plain decimal text if accepted.

### Acceptance

`NaN`, `Infinity`, `-Infinity`, empty string and malformed numeric strings must fail before persistence or hashing.

---

## P0-CODE-002 — transfer cost accepted invalid financial inputs

**File:** `src/core/costBasis/transferCost.ts`

### Bug mechanism

The previous helper did not fully reject:

- zero or negative gross quantity;
- negative fee quantity;
- negative net quantity;
- non-finite values;
- negative carrying cost.

There was also a residual correction pattern that could make the allocation depend on arithmetic coincidence instead of an explicit conservation formula.

### Correct fix

Validate all domain inputs explicitly and compute the destination cost once. Use the conservation equation:

```text
feeCarrying = sourceCostReleased - destinationCarrying
```

This ensures the source cost pool is released exactly once.

### Acceptance

- no second hidden release;
- impossible quantities rejected;
- source carrying cost cannot become negative;
- destination cost is deterministic;
- one operation => one source release.

---

## P0-CODE-003 — acquisition-fee-from-received accepted impossible states

**File:** `src/core/costBasis/acquisitionFeeFromReceived.ts`

### Bug mechanism

The helper previously allowed conditions such as:

- negative fee;
- fee >= gross;
- non-positive consideration;
- invalid/non-finite input values.

That could produce meaningless or inverted acquisition-cost calculations.

### Correct fix

Require:

```text
gross > 0
0 <= fee < gross
consideration > 0
all numeric inputs finite
```

### Acceptance

Any invalid combination is rejected before cost mutation.

---

## P0-CODE-004 — economic swap helper lacked full financial-input validation

**File:** `src/core/costBasis/applyEconomicSwap.ts`

### Bug mechanism

The previous helper accepted invalid states such as:

- negative source carrying cost;
- negative fee;
- negative capitalization amount;
- zero consideration.

### Correct fix

Require finite monetary values, non-negative source carrying cost, non-negative fee/capitalization, and strictly positive economic consideration.

### Critical invariant

The destination historical cost comes from the explicit economic swap/consideration model; it must not accidentally use current market value as historical cost.

---

## P0-CODE-005 — valuation/FX attribution helper lacked input guards

**File:** `src/core/costBasis/valuationAttribution.ts`

### Bug mechanism

Quantity, price and FX inputs could previously be zero, negative or non-finite.

### Correct fix

All required quantity/price/rate inputs must be finite and strictly positive.

---

## P1-CODE-006 — fixture harness compared identifiers as if they were decimals

**File:** `src/core/fixtures/harness.ts`

**Function:** `assertExpected()`

### Bug mechanism

Every string was passed through decimal normalization before comparison.

That makes values such as:

```text
"001"
"1"
```

potentially compare equal even when they are distinct identifiers.

### Correct fix

Fixture leaves must compare structurally and exactly. Numeric normalization belongs to the financial engine or an explicitly typed financial field, not to a generic fixture assertion.

---

## P1-CODE-007 — fixture harness allowed JSON number primitives

**File:** `src/core/fixtures/harness.ts`

### Bug mechanism

The loader accepted JSON `number` values even though the project's financial contract requires persisted/API/fixture numeric values to be decimal strings.

### Correct fix

Recursively reject JSON numeric primitives at fixture load time where the contract requires financial numbers as strings.

---

## P1-CODE-008 — negative/failure coverage was incomplete

**File:** `src/core/costBasis/acquisitionFeeFromReceived.test.ts`

### Correct fix

Explicit negative/failure tests were added for:

- invalid acquisition fee;
- invalid transfer quantities;
- negative values;
- invalid economic swap inputs.

---

# 5. Specification / documentation bugs — P0

These are the most important remaining blockers because they can cause two different implementations from the same source of truth.

## P0-DOC-001 — CashSettlementPort can be interpreted as creating a second cash truth

**Locations:**

- `docs/core/Cash-Settlement-Adapter.md`
- `docs/core/Source-of-Truth-Matrix.md`
- `docs/core/CANONICAL-FINANCIAL-REQUIREMENTS.md`

### Problem

Some wording around the Local Settlement Account permits an interpretation in which a feature can own its own local cash ledger/balance.

That contradicts the canonical cash rule:

```text
fin_accounts + fin_journal_lines = cash balance truth
```

### Required final rule

```text
LocalSettlementAdapter
    → Core fin_accounts cash account
    → Core fin_journal_lines
```

A local account is acceptable. A second feature-owned cash ledger is not.

### Exact implementation/documentation action

Replace any wording equivalent to:

```text
local feature ledger OR Core settlement account
```

with:

```text
local settlement account = Core fin_accounts account
```

and explicitly state that no feature-owned cash balance may be a source of truth.

---

## P0-DOC-002 — `acc_transactions` is still described too much like a cash ledger

**Location:** `docs/core/db/01-schema-tables.md`

### Problem

Canonical documents correctly define Journal/`fin_accounts` as the cash source of truth, but schema prose still uses “cash ledger” language around `acc_transactions`.

### Required final rule

`acc_transactions` is:

- bank/account operational event log;
- integration linkage;
- optional source/projection layer.

It is **not** an independent balance source.

### Forbidden calculation

```text
SUM(acc_transactions) + SUM(journal)
```

for the same economic cash flow.

---

## P0-DOC-003 — Crypto identity has an old `assetKey`/`symbol` rebuild path

**Location:** `docs/features/05-Investment/05-01-Investment-Crypto/Investment-Crypto.md`

### Problem

The document still contains an implementation example that rebuilds/locates holdings using `assetKey` or `symbol`, while the canonical instrument contract defines `ref_instruments.id` as the only canonical instrument identity.

### Required final model

```text
instrumentId = canonical identity
holdingId = canonical holding identity
symbol = display label
assetKey = convenience/provider index
```

For crypto, the natural operational key may additionally include location/exchange/network where needed.

### Forbidden

```sql
WHERE symbol = ?
WHERE assetKey = ?
```

as a canonical historical holding reconstruction rule.

---

## P0-DOC-004 — Crypto quantity semantics are contradictory

**Location:** `Investment-Crypto.md`

### Problem

The same document contains incompatible statements about whether holding quantity equals gross or net quantity when a fee is paid in the base/received asset.

### Required canonical raw fields

```text
grossQuantity
feeQuantity
netQuantity
feePresence
```

### Required semantic table

| `feePresence` | Holding quantity effect |
|---|---|
| `none` | gross = net |
| `fee_in_quote` | gross = net for base-asset holding |
| `fee_from_base_asset` | net = gross - fee |
| `fee_from_received` | net = gross - fee |
| `fee_external` | gross = net; fee separate |

The exact vocabulary can be normalized, but the economic semantics must exist in one and only one canonical matrix.

---

## P0-DOC-005 — Crypto fee-from-received and burn economics use two conflicting cost policies

**Locations:**

- `docs/core/P0-COST-BASIS-PNL-001-005-LOCK.md`
- `docs/core/P0-FINAL-001-004-LOCKS.md`
- `Investment-Crypto.md`

### Problem

Some sections treat the fee as acquisition-cost treatment while other sections treat it as a generic post-acquisition burn expense.

### Required final discriminator

Introduce a canonical economic fee role before cost mutation:

```text
acquisition_fee_from_received
post_acquisition_network_burn
sale_fee_from_proceeds
standalone_asset_burn
```

### Invariant

One fee event may create only one economic allocation. It may not both capitalize and expense the same economic quantity.

---

## P0-DOC-006 — Crypto C2C destination cost contradicts the canonical economic consideration model

**Location:** `Investment-Crypto.md`

### Problem

An older example effectively does:

```text
destination historical cost = source market-marked value + fee
```

which is unsafe when the source value is a current valuation rather than transaction consideration.

### Required final rule

One C2C operation has:

```text
one operationId
linked source leg
linked destination leg
explicit economic consideration
explicit fee treatment
one deterministic destination-cost calculation
```

Historical cost must never be recomputed from today's price.

---

## P0-DOC-007 — `totalFeesPaidBase` oscillates between accumulator and derived metric

**Locations:** Crypto feature sections; related holding definitions.

### Problem

The same concept is sometimes written like mutable state and sometimes like a rebuildable derived value.

### Required final rule

```text
totalFeesPaidBase = derived/rebuildable aggregate of active fee events
```

If stored as a performance optimization snapshot, it is a snapshot only and must be rebuildable.

Raw fee fields remain preserved for history/audit.

---

## P0-DOC-008 — Period Return has a superseded mixed bridge inside a “FINAL” lock file

**Location:** `docs/core/P0-FINAL-021-026-LOCKS.md`

### Problem

An older additive bridge mixes purchases/sales with return components, while the later canonical bridge explicitly rejects that mixed equation.

### Required final model

```text
Wealth
= Opening Wealth
+ External Flows
+ Investment Return
+ Cash FX Translation
+ Liability FX Translation
+ Other Policy Effects
```

and:

```text
Investment Return
= Realized P&L
+ Unrealized P&L
+ Recognized Investment Income
- Recognized Investment Expense
```

Price and FX attribution are child detail, not parallel additive peers.

### Required action

Delete the superseded equation from the lock body or mark it `LEGACY / SUPERSEDED` so a developer cannot mistake it for the canonical equation.

---

## P0-DOC-009 — Fund standalone operation conflicts with mandatory `accountId` prose

**Location:** `docs/features/05-Investment/05-03-Fixed-Income-Funds/Fixed-Income-Funds.md`

### Required final rule

```text
Integrated bank settlement → accountId required at command validation
Standalone/local/external settlement → accountId nullable
```

The feature must remain domain-correct without Accounts UI.

---

## P0-DOC-010 — Fund identity boundary is not explicit enough

**Location:** `Fixed-Income-Funds.md`

### Problem

The feature uses `fundId`, but the global financial instrument contract requires canonical instrument identity.

### Required final model

Preferred:

```text
Fund entity
   ↓
instrumentId
   ↓
ref_instruments.id
```

Alternative is only acceptable if explicitly locked:

```text
fundId === ref_instruments.id
```

No two competing financial identities.

---

## P0-DOC-011 — Iranian Stocks hard-code Tether where the abstraction requires multi-currency semantics

**Location:** `docs/features/05-Investment/05-02-Investment-Stocks-Iran/Investment-Stocks-Iran.md`

### Problem

The opening/business rules hard-code a Rial/Tether assumption while later sections define a proper transaction-currency → user-base-currency exchange-rate model.

### Required final rule

```text
transaction currency = normally IRR for Iran market
base currency = user's configured baseCurrency
exchangeRateToBase = transaction currency → base currency
```

USDT may exist as a real currency/instrument in a separate operation but is not an accounting prerequisite for every Iranian stock trade.

---

## P0-DOC-012 — Stocks brokerage cash path is inconsistently shared vs feature-owned

**Location:** `Investment-Stocks-Iran.md`

### Problem

`cashBalance` is documented as a snapshot in some places, but some prose implies direct mutation/ownership of the cash balance.

### Required final model

```text
Stock/Fund brokerage operation
    ↓
CashSettlementPort
    ↓
Brokerage Cash capability
    ↓
Core Journal
    ↓
optional Accounts event linkage
```

`cashBalance` is projection/snapshot only.

---

## P0-DOC-013 — Stocks brokerage `accountId` is not consistently aligned with standalone semantics

**Location:** `Investment-Stocks-Iran.md`

### Required final rule

Schema-level `accountId` should be nullable where standalone/local/external settlement is valid.

Command-time validation can require it for an integrated bank/account route.

A bank FK must not become an accidental universal prerequisite of the Stock domain.

---

## P0-DOC-014 — Corporate-action and settlement ownership is scattered

**Locations:**

- Stocks Iran feature
- `docs/core/Corporate-Action-Engine.md`
- Iran market rules

### Required ownership split

**Corporate-Action-Engine owns:** formulas/economic transformations.

**Iran Market Adapter owns:**

- session/calendar;
- settlement convention;
- T+2;
- lot/tick policy;
- market-specific date rules.

**Stocks feature owns:** feature-level fields, commands, queries and presentation behavior.

### Invariant

One formula = one owner.

---

# 6. P1 specification / architecture gaps

## P1-DOC-015 — relationship matrix is not detailed enough for final schema freeze

**Location:** `docs/core/Data-Model-Relationship-Matrix.md`

### Required expansion

For every cross-table relationship include:

```text
source table
source column
reference table
reference column
cardinality
nullable
on-delete behavior
unique constraint
index requirement
semantic owner
```

Must explicitly cover:

- corporate actions;
- loan schedule and payments;
- fees;
- documents;
- price observations;
- tax links;
- provenance/import lineage;
- polymorphic links;
- feature-to-core links.

ER diagrams should be generated from this matrix rather than manually maintained.

---

## P1-DOC-016 — complete field-preservation proof is still missing

**Locations:**

- `docs/core/Data-Dictionary.md`
- `docs/core/Field-Level-SoT.md`
- `docs/core/Field-Level-Data-Ownership-Matrix.md`
- all feature main documents.

### Required acceptance

One auditable row per persisted financial field containing at least:

```text
Kind
Owner
Currency semantics
Precision
Source of Truth
Immutable/Editable
FK
Index/Unique
Migration
UsedBy
```

### Hard gate

```text
undocumented persisted financial fields = 0
```

The current dictionary already states this as the project rule; the remaining task is to prove completeness across every feature.

---

## P1-DOC-017 — too many P0 lock files are increasing precedence risk

**Location:** `docs/core/` P0 lock collection.

### Problem

There are multiple overlapping ranges such as:

- `P0-FINAL-005-010-LOCKS.md`
- `P0-FINAL-006-015-LOCKS.md`
- `P0-FINAL-011-014-LOCKS.md`
- `P0-FINAL-015-020-LOCKS.md`
- `P0-FINAL-021-026-LOCKS.md`
- `P0-FINAL-027-035-LOCKS.md`
- `P0-FINAL-036-040-LOCKS.md`
- `P0-FINAL-041-051-LOCKS.md`

The new consolidation policy improves this, but the archive is still large enough that a new developer can accidentally search for “P0” and read the wrong copy first.

### Required final architecture

Keep only a few **concept homes** as implementation authority:

- Financial Invariants
- Canonical Cash
- Money / Rounding
- Instrument Identity
- Cost Basis / Fee Treatment
- Valuation / FX
- Loan / Schedule Engine
- Stocks Iran / Corporate Actions
- Funds Policy
- Feature API / Independence
- Persistence / Schema
- Fixtures / Acceptance

Keep historical P0 files only when they contain useful traceability/history and clearly cannot be mistaken as a competing authority.

---

# 7. Current canonical architecture that should be preserved

The target architecture is effectively:

```text
~9 navigation areas / pages
        ↓
Feature Shells / Tabs / Sheets
        ↓
Feature Public API
        ↓
Core Financial Operation
        ↓
Domain Ledger + Journal + Cash Settlement Port
        ↓
SQLite / local durable persistence
```

This is the right answer to the “I do not want many pages” requirement.

The system should expose fewer navigation surfaces while retaining rich domain capabilities behind tabs, drawers, subviews, contextual forms and reports.

The complexity should live in the **domain engines**, not in the navigation.

---

# 8. Minimal-page product architecture

Recommended navigation target:

1. Dashboard
2. Money / Accounts
3. Transactions
4. Loans & Debts
5. Investments
6. Planning / Goals / Budget
7. Reports / Wealth
8. Documents / Imports
9. Settings / Tools

Under Investments use tabs/sheets for:

- Crypto
- Iranian Stocks
- Funds
- Metals
- other future investment instruments

Under Transactions use contextual types rather than separate pages for every transaction category.

Under Loans provide:

- Loan list
- Schedule
- Payments
- Fees/Penalties
- Statement
- Reports

This preserves feature independence without route explosion.

---

# 9. Missing requirements — accounting foundation

These are requirements that must be explicit before implementation, even when the repository already contains partial building blocks.

## 9.1 Accounting journal requirements

Must define completely:

- journal entry header;
- journal lines;
- debit/credit sign rules;
- line kind;
- account class;
- balancing rule;
- currency on line;
- transaction currency vs base currency;
- FX rate used;
- operationId;
- source/provenance;
- post state;
- reversal relationship;
- correction relationship;
- fiscal period lock behavior;
- period close/reopen rules;
- opening balances;
- audit identity.

## 9.2 Account requirements

Each account should have explicit:

- account kind;
- currency;
- active/inactive;
- parent account;
- display name;
- code;
- account role;
- reconciliation status;
- external account references where applicable.

## 9.3 Reconciliation requirements

Define separately:

- bank reconciliation;
- brokerage reconciliation;
- cash reconciliation;
- holdings reconciliation;
- imported statement reconciliation;
- price/valuation reconciliation.

Reconciliation must report mismatches rather than silently changing financial truth.

## 9.4 Correction requirements

Define exact commands for:

- reversal;
- corrected replacement;
- void before posting;
- failed operation;
- duplicate operation;
- stale data conflict;
- locked fiscal period.

---

# 10. Missing requirements — personal accounting usability

The accounting layer must remain easy to use despite being the most powerful subsystem.

Required capabilities:

- quick cash income;
- quick cash expense;
- transfers;
- split transactions;
- recurring transactions;
- merchant/payee;
- category/subcategory;
- tags;
- notes;
- attachments;
- source/provenance;
- imported statement matching;
- internal transfer vs external flow classification;
- refunds;
- partial refunds;
- cash corrections;
- opening balance;
- historical balance view.

The user should not have to understand debit/credit to record ordinary events. The system should create journal lines automatically from a small, guided form.

---

# 11. Missing requirements — Iranian money and accounting

Required as a policy layer rather than scattered assumptions:

## 11.1 IRR and Toman

- IRR is canonical storage currency;
- Toman is presentation/input convenience;
- conversion rule must be exact and centralized;
- no separate Toman currency ledger;
- input normalization must preserve user intent;
- display rounding must never alter stored money.

## 11.2 Date semantics

Separate:

- system timestamp (UTC);
- businessDate;
- marketDate;
- settlementDate;
- dueDate;
- paymentDate;
- valuation as-of.

A Jalali UI must never redefine the meaning of the stored Gregorian business date.

## 11.3 Iran business calendar

The market adapter should own:

- weekdays;
- trading sessions;
- holidays;
- settlement shifts;
- market closures.

---

# 12. Missing requirements — crypto

The current design is directionally strong but must be frozen into one canonical matrix.

Required cases:

- buy;
- sell;
- quote fee;
- base fee;
- received-asset fee;
- external fee;
- network fee;
- asset burn;
- internal transfer;
- external transfer;
- gift;
- airdrop/reward if in scope;
- opening balance;
- C2C economic swap;
- C2C non-economic transfer if supported;
- multi-currency valuation;
- multi-hop FX;
- historical prices;
- stale price flags;
- exchange/network/location identity;
- lot/cost basis behavior;
- realized/unrealized P&L;
- fee accounting;
- reversal;
- correction;
- duplicate operation handling.

The critical requirement is that **same asset + same symbol on different venues/networks must not collapse into one identity unless explicitly intended**.

---

# 13. Missing requirements — Iranian stocks

The Stock module must explicitly cover:

- buy;
- sell;
- commissions;
- exchange fees;
- tax/transaction levy where applicable;
- T+2 settlement;
- pending receivable/payable settlement state;
- dividend;
- bonus/share split if in scope;
- capital increase;
- rights subscription;
- rights sale;
- rights-to-shares conversion;
- symbol change;
- ISIN identity;
- lot/tick rules;
- price observations;
- suspended trading / missing prices;
- opening positions;
- brokerage cash;
- corporate-action provenance;
- historical price as-of;
- reversal/correction;
- standalone operation without Accounts UI.

The Iran-specific rules should live in the Iran policy/adapter layer and not infect global valuation abstractions.

---

# 14. Missing requirements — fixed-income funds

Required explicit support:

- subscription;
- redemption;
- NAV vs transaction price;
- fees;
- distribution;
- reinvestment;
- units/shares;
- unit precision;
- historical NAV;
- valuation date/as-of;
- settlement date;
- fund instrument identity;
- bank settlement or local settlement;
- standalone operation;
- reverse/correct;
- reporting of income vs capital gain;
- source/provenance of NAV.

The key conceptual rule is:

```text
NAV ≠ transaction price
```

unless the fund policy explicitly says they coincide.

---

# 15. Missing requirements — loans, debts and receivables

The current loan document is already extensive, but the final implementation contract must make all following explicit and testable:

- borrowed vs lent;
- principal;
- interest;
- service fee;
- origination fee;
- periodic fee;
- penalty fee;
- prepayment fee;
- fixed amount fee;
- percentage fee;
- tiered fee;
- fee timing;
- flat rate;
- declining balance;
- bullet;
- Qarz Al-Hasaneh;
- variable rate;
- rate reset;
- day-count convention;
- custom intervals;
- irregular first period;
- grace period;
- payment holiday;
- installment rounding;
- final residual adjustment;
- partial payment;
- early repayment;
- early settlement;
- overpayment;
- missed payment;
- delinquency;
- penalty timing;
- collateral;
- guarantor/party links;
- multi-currency debt;
- historical payment FX;
- statement/report;
- reversal;
- standalone Loan-only mode.

A loan schedule must be versioned/snapshotted and rebuildable from source facts.

---

# 16. Missing requirements — metals

Required explicit semantics for:

- gold/silver or other supported metals;
- gross weight;
- purity;
- fine weight;
- unit of weight;
- buy/sell price;
- fabrication/premium;
- brokerage/dealer fee;
- delivery fee;
- physical delivery;
- account/location/custody;
- partial sales;
- historical cost;
- valuation price;
- FX if quoted in another currency;
- standalone mode.

Purity must not be merely a display field if it affects valuation or cost.

---

# 17. Missing requirements — physical assets

Should support clearly separated fields for:

- asset identity;
- purchase date;
- acquisition cost;
- estimated value;
- valuation date;
- depreciation policy if applicable;
- location;
- serial/model;
- document attachments;
- ownership;
- sale/disposal;
- gain/loss treatment where required.

---

# 18. Missing requirements — tax

The tax module must be policy-driven, not hard-coded around one country's assumptions.

Required separation:

```text
transaction fee tax
≠ tax event
≠ tax report
```

Need explicit:

- tax year;
- jurisdiction;
- tax rule version;
- taxable event;
- basis;
- realized gain source;
- deductible expenses;
- holding period if relevant;
- loss carry rules if relevant;
- evidence/document;
- manual adjustment with audit trail.

---

# 19. Missing requirements — valuation and FX

The current architecture already points toward historical valuation context. Final requirements must include:

- base currency;
- transaction currency;
- instrument currency;
- quote/base orientation;
- cross rate;
- inverse rate;
- multi-hop path;
- observation date/time;
- source priority;
- source identity;
- stale status;
- missing rate behavior;
- degraded valuation mode;
- manual override;
- historical lock of the rate used by the original operation;
- reproducibility from the same dataset and same context.

The selection rule must be deterministic.

---

# 20. Missing requirements — price data

Offline-first requires a clear price-data hierarchy:

```text
manual
→ imported CSV/JSON
→ local cached observation
→ optional online adapter
```

Every price observation needs enough provenance to answer:

- what instrument;
- which market/source;
- what price type;
- what currency;
- what timestamp/as-of;
- when fetched;
- whether stale;
- whether user override;
- source priority.

Never use “latest” without recording the as-of context in historical reports.

---

# 21. Missing requirements — imports and provenance

Every imported financial event should preserve:

- import batch;
- source type;
- source reference;
- source document;
- external transaction id when available;
- original raw amount;
- original raw date/time;
- normalization status;
- mapping decision;
- user override;
- reconciliation status.

Import must never destroy source identity.

---

# 22. Missing requirements — offline operation

The repository already explicitly requires offline usage, including local price/manual price support, no server dependency for primary transactions, backup/export, restore tests and local license validation.

The final implementation gate should additionally prove:

1. airplane mode allows all ordinary financial writes;
2. airplane mode allows rebuild and reports using local data;
3. missing online prices produce explicit stale/missing status rather than silently inventing values;
4. crash during persistence never leaves a half-posted operation;
5. recovery can reopen the database and preserve financial history;
6. backup can be restored on a clean machine;
7. attachments survive backup/restore;
8. license expiry cannot wipe or make history inaccessible;
9. export remains possible even when a feature is disabled by license.

---

# 23. Missing requirements — standalone feature editions

The standalone contract is one of the most commercially important parts of the architecture.

At minimum these modes must be acceptance-tested:

```text
Loan-only
Fund-only
Crypto-only
Stocks-only
Metals-only
```

And the future architecture should permit:

```text
Accounting-only
Accounts-only
Documents-only (if product strategy permits)
```

The rule is:

```text
Feature UI independence
≠
removal of Accounting Core truth
```

The feature may create journal entries and use local settlement while Accounts UI is absent.

---

# 24. Missing requirements — API

The current API contract is correctly transport-agnostic and uses TypeScript in-process interfaces in v1. That is a good choice for an offline desktop/product architecture.

Final API requirements should freeze:

- request shape;
- response envelope;
- apiVersion;
- schemaVersion;
- operationId;
- commandHash;
- engineVersions;
- correlationId;
- pagination;
- cursor semantics;
- sorting;
- filtering;
- asOf;
- deterministic error codes;
- retryability;
- user action requirement;
- idempotency conflict behavior.

### Required idempotency invariant

```text
same operationId + same commandHash
    → return prior result

same operationId + different commandHash
    → IDEMPOTENCY_CONFLICT
    → no financial write
```

---

# 25. Missing requirements — database integrity

Before schema freeze, every table needs:

- primary key;
- exact SQL type;
- nullable rule;
- default;
- foreign keys;
- on-delete semantics;
- unique constraints;
- partial unique constraints where needed;
- index requirements;
- CHECK constraints only for structural invariants;
- generated/derived status where applicable;
- field kind;
- owner;
- SoT;
- precision;
- migration strategy.

Important recurring fields:

```text
operationId
instrumentId
accountId
accountTransactionId
journalEntryId
sourceType
sourceReference
sourceDocumentId
importBatchId
businessDate
settlementDate
marketDate
dueDate
paymentDate
exchangeRateToBase
engineVersions
```

---

# 26. Missing requirements — no-field-loss gate

Before implementation:

```text
Feature field
→ Data Dictionary
→ Schema
→ API Request/Response
→ Migration
→ Fixture
→ Report/Query usage
```

Any field missing in one of these layers must be treated as a schema-design bug, not a future cleanup task.

---

# 27. Missing requirements — generated architecture artifacts

To reduce documentation drift, generate where possible:

- ER diagram from relationship matrix;
- table catalog;
- API surface index;
- feature dependency graph;
- field inventory report;
- fixture coverage report;
- canonical-rule index;
- orphan/duplicate field report.

Manual duplication is one of the main risks in the current repository.

---

# 28. Missing requirements — code-level enforcement after schema freeze

The current documentation already anticipates this; implementation should enforce it mechanically.

Required tooling gates:

## 28.1 Import isolation

Prevent Feature A from importing:

```text
Feature B internal repositories
Feature B internal DB modules
raw DB tables of another feature
```

Allow only:

```text
Feature B public-api
Core APIs
Ports/Adapters
```

## 28.2 Financial mutation gate

Block direct mutation of posted financial facts.

All mutations flow through:

```text
Feature Command
→ Operation Builder
→ Core
→ Journal/Cash
→ Projection
```

## 28.3 Decimal gate

Do not allow persisted financial numbers as JS/TS number primitives.

## 28.4 Fixture gate

A financial change without updated golden vectors fails CI.

---

# 29. Files that should NOT be deleted

The current consolidation policy explicitly treats the following as protected or core authority. Do not delete merely because the repository already contains many P0 files:

```text
docs/core/Data-Dictionary.md
docs/core/Field-Level-SoT.md
docs/core/Field-Level-Data-Ownership-Matrix.md
docs/core/Source-of-Truth-Matrix.md
docs/core/Domain-Dependency-Matrix.md
docs/core/Feature-API-Contract.md
docs/core/Feature-Independence-Contract.md
docs/core/Cash-Settlement-Adapter.md
docs/core/Canonical-Cash-Model.md
docs/core/Instrument-Identity.md
docs/core/CANONICAL-FINANCIAL-REQUIREMENTS.md
docs/core/CODING-GATE.md
docs/core/fixtures/**
docs/features/**
```

These documents are not “junk P0 files”; they are part of the canonical implementation contract.

---

# 30. Files that are already historically removed and must NOT be recreated

The current consolidation policy records these as already removed:

```text
docs/core/CROSS-CUTTING-CONTRACTS-BATCH*.md
docs/core/CROSS-FEATURE-P0-090-100
docs/core/CROSS-FEATURE-X-001-020
docs/core/Documentation-Audit-2026-09-01
docs/core/Support-Layers-Audit
docs/core/FEATURE-BUG-RESOLUTIONS.md
```

They are historical cleanup targets, not files to preserve.

---

# 31. Files that should be pointer-only, not full copies

The current repository already identifies these as pointer candidates:

```text
docs/core/Naming-Glossary.md
 → docs/core/NAMING-GLOSSARY.md

docs/core/Core-Engines.md
 → docs/core/Calculation-Engines.md

docs/core/Financial-Scenarios.md
 → docs/core/Financial-Scenario-Catalog.md + fixtures

docs/core/Rounding-Policy.md
 → docs/core/rounding/Rounding-Policy.md
```

### Recommendation

Do **not** delete these immediately if inbound references may exist. Keep a thin pointer file or redirect note until the reference graph confirms the path is not required for navigation/tooling.

---

# 32. P0/P1 ticket files — delete or retain?

The important distinction is:

```text
traceability history
vs
implementation authority
```

The consolidation policy explicitly says think-tank logs may remain as decision history but do not override canonical concept homes.

## 32.1 Recommended to RETAIN as history for now

```text
docs/core/AUDIT-HISTORY-NOTE.md
docs/core/AUDIT-HISTORY-NOTE.md
docs/core/AUDIT-HISTORY-NOTE.md
docs/core/AUDIT-HISTORY-NOTE.md
docs/core/AUDIT-HISTORY-NOTE.md
```

Reason:

- they are small;
- they preserve decision provenance;
- the policy explicitly permits them to remain as history.

They must not be treated as canonical sources by developers.

## 32.2 Candidate for deletion after reference check

These look like audit snapshots rather than long-term implementation authority:

```text
docs/core/fixtures/HARNESS.md / P0-COST-BASIS-PNL-001-005-LOCK.md
docs/core/P0-COST-BASIS-PNL-001-005-LOCK.md
docs/core/AUDIT-HISTORY-NOTE.md / CANONICAL-FINANCIAL-REQUIREMENTS.md
```

### Deletion condition

Delete only when:

```text
zero live references
+ no unique rule
+ all unique material migrated to canonical docs
+ Git history preserves the decision
```

The current GitHub code-search result did not find live text references to the P0 audit filenames queried, but the final deletion gate should still be performed as a local full-tree grep before deletion.

---

# 33. The large P0 lock collection — what to do

Do **not** bulk-delete these files merely because there are many of them.

Current P0 lock files include:

```text
docs/core/P0-COST-BASIS-PNL-001-005-LOCK.md
docs/core/P0-FINAL-001-004-LOCKS.md
docs/core/P0-FINAL-005-010-LOCKS.md
docs/core/P0-FINAL-006-015-LOCKS.md
docs/core/P0-FINAL-011-014-LOCKS.md
docs/core/P0-FINAL-015-020-LOCKS.md
docs/core/P0-FINAL-021-026-LOCKS.md
docs/core/P0-FINAL-027-035-LOCKS.md
docs/core/P0-FINAL-036-040-LOCKS.md
docs/core/P0-FINAL-041-051-LOCKS.md
```

### Recommended treatment

1. Choose a canonical concept home for every rule.
2. Move any unique rule to that home.
3. Turn superseded lock sections into explicit `LEGACY / SUPERSEDED` pointers or delete them after reference checks.
4. Keep one authoritative lock per concept.

The biggest goal is **not reducing file count at any cost**. The goal is eliminating ambiguity.

---

# 34. Documentation hierarchy that should become the final authority chain

Recommended hierarchy:

```text
PRODUCT
  Product Principle
  Pages / IA

SYSTEM
  Architecture
  Module Architecture
  Feature Independence
  Feature Package Architecture

FINANCIAL CORE
  Financial Invariants
  Canonical Financial Requirements
  Canonical Cash Model
  Instrument Identity
  Money / Rounding
  Cost Basis / Fee Treatment
  Valuation / FX

PERSISTENCE
  Schema
  Relationship Matrix
  Field Dictionary
  Migration
  Backup / Restore

FEATURES
  one main document per feature
  optional small feature-specific policy docs

ACCEPTANCE
  golden fixtures
  mandatory vectors
  standalone fixtures
  recovery fixtures
  CI gates

HISTORY
  think-tank logs
  closed audit snapshots
```

No developer should have to read ten P0 files to answer one accounting question.

---

# 35. Exact recommended order of remaining work

## Phase 1 — close documentation contradictions

Close P0-DOC-001 through P0-DOC-014.

Do not add new feature ideas during this phase.

## Phase 2 — schema freeze

Complete:

- relationship matrix;
- field inventory;
- nullable/FK/unique rules;
- date semantics;
- provenance fields;
- derived/snapshot classification;
- migration rules.

## Phase 3 — golden gate

Every core economic rule gets a fixture with:

- inputs;
- outputs;
- journal;
- cash;
- holdings;
- cost basis;
- P&L;
- valuation context;
- expected error for invalid cases.

## Phase 4 — Core engine implementation

Implement only the reusable calculations first:

- Money;
- Rounding;
- Journal/Accounting;
- Cash Settlement;
- Currency/FX;
- Cost Basis;
- Valuation;
- Loan Schedule;
- Corporate Actions.

## Phase 5 — first vertical feature

Recommended first production vertical:

```text
Accounts + basic transactions
```

Then:

```text
Loan
Crypto
Funds
Stocks Iran
Metals
```

This sequence gives the accounting truth layer a stable base before investment complexity expands.

---

# 36. Recommended first implementation acceptance suite

Before any visual page is considered “done”, the following should pass.

## Core

- decimal rejects NaN/Infinity;
- Toman/IRR conversion is exact;
- journal balances;
- operationId idempotency works;
- duplicate command conflict works;
- reversal restores prior economics;
- direct posted mutation is rejected.

## Cash

- journal is sole balance truth;
- local settlement works;
- Accounts-integrated settlement works;
- no double counting with `acc_transactions`.

## Crypto

- quote fee;
- base fee;
- received fee;
- network burn;
- internal transfer;
- external transfer;
- C2C;
- BTC/USDT/IRR historical P&L;
- reversal;
- stale price.

## Stocks Iran

- buy;
- sell;
- fee breakdown;
- T+2;
- corporate action;
- dividend;
- rights;
- symbol/ISIN change;
- standalone brokerage.

## Funds

- subscribe;
- redeem;
- NAV vs transaction price;
- dividend/reinvestment;
- standalone mode.

## Loans

- declining;
- flat;
- bullet;
- Qarz;
- variable rate;
- grace;
- partial payment;
- early settlement;
- penalty;
- multi-currency.

---

# 37. Final “do not allow” list

The following should be explicit architectural prohibitions:

```text
❌ second cash source of truth
❌ feature-owned cash ledger
❌ symbol-as-instrument-identity
❌ assetKey-as-canonical-identity
❌ direct mutation of posted financial facts
❌ financial numbers stored as JS number primitives
❌ historical valuation from today's price
❌ mixed period-return bridges
❌ mandatory Accounts UI dependency for standalone features
❌ feature-to-feature raw SQL access
❌ duplicated corporate-action formulas
❌ duplicated fee logic across features
❌ silent snapshot repair during reconcile
❌ silent financial correction via UPDATE
❌ license state embedded in journal truth
❌ server dependency for normal offline financial operation
```

---

# 38. Final “must always preserve” list

```text
✓ raw source values
✓ gross / fee / net quantities
✓ original financial dates
✓ historical FX used by an operation
✓ historical valuation context
✓ provenance
✓ external identifiers
✓ source document links
✓ operationId
✓ commandHash
✓ reversal/correction relationships
✓ immutable journal facts
✓ instrument identity
✓ cost basis history
✓ fee treatment role
✓ corporate-action provenance
✓ loan schedule snapshot/version
✓ backup/restore evidence
✓ engine version used for historical outputs
```

---

# 39. Final deletion decision matrix

| File/group | Decision now | Reason |
|---|---|---|
| Canonical core docs | KEEP | authoritative contract |
| Feature main docs | KEEP | feature specification |
| Golden fixtures | KEEP | implementation acceptance |
| `*-THINK-TANK.md` | KEEP as history | traceability; not authority |
| `P0-FINAL-AUD-*` | CANDIDATE DELETE | audit snapshot; delete only after reference + uniqueness check |
| `P1-FINAL-AUD-*` | CANDIDATE DELETE | audit snapshot; same gate |
| `Naming-Glossary.md` | KEEP as pointer | path may be used by references |
| `Core-Engines.md` | KEEP as pointer | compatibility path |
| `Financial-Scenarios.md` | KEEP as pointer | compatibility path |
| `Rounding-Policy.md` | KEEP as pointer | compatibility path |
| historically removed cross-cutting packs | DO NOT RECREATE | already superseded |
| any file with unique financial rule | KEEP / MIGRATE | rule must move before deletion |
| any pure duplicate full-body copy | DELETE after reference check | canonical target survives |

---

# 40. Final developer-facing contract

When coding starts, a developer should be able to implement a feature from exactly this sequence:

```text
1. Feature main document
2. Feature-specific lock/policy only if truly unique
3. Feature Independence Contract
4. Feature API Contract
5. Data Dictionary entries
6. Relationship Matrix
7. Core engine contract
8. Golden fixtures
9. Schema freeze
10. Coding gate
```

Anything else should be historical context, not another competing specification.

---

# 41. Final assessment of project quality

## Strengths

- Strong awareness of accounting correctness.
- Good use of Source-of-Truth concepts.
- Good treatment of decimal precision.
- Strong immutability/correction philosophy.
- Good standalone-feature ambition.
- Correct instinct to make v1 API transport-agnostic.
- Correct offline-first product direction.
- Strong investment-specific awareness for Crypto, Iranian Stocks, Funds and Loans.
- Good fixture/golden-test direction.
- Good recognition that feature UI independence is different from removing accounting truth.
- Good future licensing separation.

## Main weakness

The repository is currently **over-specified in duplicate places**.

The system does not primarily suffer from “not enough documentation”. It suffers from:

```text
same rule
  ↓
written in several files
  ↓
one file updated
  ↓
another file remains contradictory
  ↓
developer ambiguity
```

Therefore the next maturity step is not creating more documents. It is **consolidating authority** and proving schema/field/relationship completeness.

---

# 42. Final go/no-go

## GO for continued documentation

Yes.

## GO for schema freeze

Not yet.

## GO for full feature implementation

Not yet.

## GO for limited Core implementation and fixture work

Yes, provided it follows the current canonical contracts and is used specifically to make those contracts executable.

## GO for production release

No — not before runtime Feature implementations, migration/recovery testing, full golden coverage and cross-feature integration tests exist.

---

# 43. Bottom line

Personal-FI is already conceptually much closer to a serious financial system than a typical “personal budget app”. The architecture should stay disciplined and simple at the UI level while allowing high correctness underneath.

The best final product is not the one with the largest number of tables, pages or P0 files.

It is the one where:

```text
one economic event
→ one command
→ one operationId
→ one canonical accounting interpretation
→ one source of truth
→ deterministic projections
→ reproducible historical reports
→ simple UI
→ optional integrations
→ fully offline operation
```

That is the design target that should govern every implementation decision from this point forward.

---

# 44. Audit provenance

This report was prepared against repository head `cbfd5c49e68031b9e0c80287b409416bd771f56f` on 2026-09-03 (baseline). Subsequent commits closed many P0-DOC items; treat OPEN register + GO-NO-GO as live status.

The prior `FINAL-AUDIT-2026-09.md` was itself created at an earlier baseline. The repository advanced nine commits after that baseline, including documentation consolidation and multiple P0/P1 fix/thinking-tank commits. Therefore this report intentionally treats the **current HEAD** and the newer consolidation policy as the authoritative state.

Primary repository evidence consulted includes:

- `docs/core/FINAL-AUDIT-2026-09.md`
- `docs/core/IMPLEMENTATION-FIX-PLAN.md`
- `docs/core/DOC-CONSOLIDATION-POLICY.md`
- `docs/core/Data-Dictionary.md`
- `docs/core/Feature-API-Contract.md`
- `docs/core/Feature-Independence-Contract.md`
- `docs/core/License-Offline.md`
- `docs/core/Offline-Requirements.md`
- `docs/features/04-Debt-Loan-Management/Debt-Loan-Management.md`
- `docs/features/05-Investment/05-01-Investment-Crypto/Investment-Crypto.md`
- `docs/features/05-Investment/05-02-Investment-Stocks-Iran/Investment-Stocks-Iran.md`
- `docs/features/05-Investment/05-03-Fixed-Income-Funds/Fixed-Income-Funds.md`
- current recursive repository tree and recent commit history.

---

# 45. One-line final answer for the next developer

> **Do not add another P0 file. First make the existing canonical contracts unambiguous, freeze the schema and field graph, prove them with golden fixtures, then implement one feature vertically through the same Core/API/Journal/Settlement pipeline.**
