# DOCUMENTATION-STANDARD

**Status:** LOCKED  
**Role:** Structure authority only (not a second product/financial spec)

## Goal
```
ONE PRODUCT · ONE ARCHITECTURE · ONE FINANCIAL · ONE DATA
ONE API · ONE REPORTING · ONE OFFLINE/RELEASE · ONE ENGINEERING PROCESS
+ ONE DOCUMENT PER MODULE
+ MACHINE-READABLE PROOF
+ CODE + TESTS
```

History lives in **Git**. Contracts live in **Owner docs**. Proof lives in **tests/fixtures**. Live status lives in **QUALITY-STATUS / registry JSON**.

## Target tree (authoritative)

```
docs/
├── README.md
├── DOCUMENTATION-STANDARD.md
├── PRODUCT.md
├── ARCHITECTURE.md
├── FINANCIAL-CORE.md
├── DATA-MODEL.md
├── API.md
├── REPORTING.md
├── OFFLINE-RELEASE.md
├── DEVELOPMENT.md
├── QUALITY-STATUS.md
│
├── modules/
│   ├── accounts.md
│   ├── income-expense.md
│   ├── cheque.md
│   ├── loan.md
│   ├── crypto.md
│   ├── stocks.md
│   ├── funds.md
│   ├── metals.md
│   ├── physical-assets.md
│   ├── budget-goals-bills.md
│   └── tax.md
│
├── archive/
│   └── AUDIT-HISTORY.md
│
└── core/                          # MACHINE ONLY
    ├── RELEASE-EVIDENCE.json
    ├── field-inventory.checklist.tsv
    ├── registry.index.json        # optional index
    ├── db/
    │   ├── schema.sql
    │   └── schema.manifest.json
    ├── json-schemas/
    │   ├── api-envelope.schema.json
    │   ├── operation-result.schema.json
    │   └── schedule-snapshot.schema.json
    └── registry/
        ├── fixture-manifest.json
        ├── requirements-matrix.json
        └── status.registry.json
```

## File types

| Type | Action |
|------|--------|
| Human normative docs | One owner only; merge/reduce |
| Historical docs | Git + thin `archive/AUDIT-HISTORY.md` |
| Machine proof | Keep |
| Source/tests | Merge only with dependency analysis |

## Forbidden
- New BUG / GAP / REQ / AUDIT / VERDICT / MATRIX as specification
- Second owner for the same concept
- Human prose under `docs/core/` except a one-line pointer if needed
- Expanding docs instead of code/tests for implementation work

## Owner map

| Concept | Owner |
|---------|--------|
| Product, editions, IA | PRODUCT.md |
| Layers, ports, boundaries | ARCHITECTURE.md |
| Money, journal, fee, FX, cost, cash truth, reversal | FINANCIAL-CORE.md |
| Fields, identity, no-field-loss | DATA-MODEL.md |
| Envelope, errors, idempotency | API.md |
| Reports / valuation presentation | REPORTING.md |
| Offline, recovery, release evidence | OFFLINE-RELEASE.md |
| Process, gates, module template | DEVELOPMENT.md |
| Feature rules | modules/`<feature>`.md |
| Live gate table | QUALITY-STATUS.md |

## Change protocol
- Code bug → fix + test (+ QUALITY if status changes)
- Business rule → **one** owner doc → fixture/test → code
- Architecture → ARCHITECTURE + affected owners → tests
- History → Git only

## Coding handoff
```
PRODUCT → ARCHITECTURE → FINANCIAL-CORE → DATA-MODEL → API
→ REPORTING → OFFLINE-RELEASE → DEVELOPMENT → modules/<feature>
→ schema.sql → fixtures → tests
```

## Done when
1. Tree matches this document  
2. No dual authority  
3. Machine files remain  
4. `npm run docs:validate` passes  
5. `npm test` passes  
6. Release remains **NO_GO** until RELEASE_PROVEN

## Owner responsibilities (exact)

### PRODUCT.md
scope · users · editions · licensing philosophy · navigation · product non-goals

### ARCHITECTURE.md
layer boundaries · dependency direction · ports · write/read pipeline · feature isolation · standalone architecture

### FINANCIAL-CORE.md
money · Decimal policy · quantity · FX · operation · journal · cash truth · fee semantics · cost basis · reversal · financial invariants

### DATA-MODEL.md
identity · field kinds · ownership · source of truth · RAW/DERIVED/SNAPSHOT/… · no-field-loss · schema policy · provenance

### API.md
envelope · errors · commands · queries · pagination · idempotency semantics · capabilities

### REPORTING.md
statement concepts · valuation concepts · investment performance · asOf semantics · historical reconstruction

### OFFLINE-RELEASE.md
persistence durability · backup/recovery · browser adapter · offline truth · release gates · recovery proof

### DEVELOPMENT.md
coding workflow · test workflow · definition of done · status vocabulary · commit policy · documentation lifecycle · forbidden documentation behavior

### QUALITY-STATUS.md
Live status only — not a second requirements system. Rows at most: ID · area · status · owner · test · commit. History in Git/archive.

### modules/*.md
Feature-only behavior using the 34-section template in DEVELOPMENT.md.



## Authority rules
- ONE CONCEPT → ONE OWNER
- OWNER docs are normative
- Machine proof is not human authority
- Historical docs are not normative
- Generated docs cannot define business semantics
- Bug IDs cannot become permanent requirements
- Audit result → code change, test, owner-doc only if contract changed, quality status


## Final change cycle (locked)
```
FEATURE → OWNER DOCUMENT → CODE → TEST → FIXTURE/PROOF → QUALITY STATUS → COMMIT
```
Forbidden: AUDIT → BUG DOC → FIX DOC → NEW MATRIX → NEW FINAL AUDIT.

## Vertical reference
`modules/loan.md` is the practical 34-section template reference for other modules.

## Forbidden restoration
Never restore as normative files:
```
BUG-*.md · P0-*.md · GAP-*.md · AUDIT-*.md · VERDICT-*.md · MATRIX-*.md · FIX-*.md
```
History lives in Git. Capability proof lives in tests/fixtures. Live status in QUALITY-STATUS + registry.

## Safe deletion checklist
1 inventory · 2 classify · 3 code refs · 4 package scripts · 5 registry · 6 Git history · 7 replacement owner · 8 delete/rename · 9 docs validate · 10 schema/field gates · 11 tests

Delete only if: no live reference + knowledge absorbed + no unique proof + no migration/packaging dependency.

## Machine command coverage
Use `docs/core/registry/command-catalog.json` only — never a Markdown coverage matrix under docs/core/.

## Sequence before features
```
STANDARDIZE → CANONICALIZE → PROVE → FREEZE → CODE
```
UI coding is last. Do not restore BUG/P0/AUDIT normative docs.

## Snapshot
Protected baseline tag: `personal-fi-pre-semantic-freeze-2026-09-14`.
Minimal active tree = owner docs + modules + archive/AUDIT-HISTORY + docs/core machine files only.
No new audit/P0/BUG/MATRIX Markdown authority files.

## Active human docs only
```
docs/*.md (owners listed in README)
docs/modules/*.md
docs/archive/AUDIT-HISTORY.md
docs/core/**   (machine only)
```
Merge new rules into the owner file. Do not add parallel markdown authorities.
