# DEVELOPMENT (sole workflow owner)

**Status:** CURRENT

## 1. Defect workflow
```
ONE DEFECT → ONE CODE FIX → ONE TEST → QUALITY-STATUS
```
Do **not** create new `BUG-*` / `GAP-*` authority markdown files.

## 2. Documentation workflow
EXTRACT → MERGE into owner → REPOINT → VALIDATE → ARCHIVE/DELETE

## 3. Coding gates
`npm test` · `npm run gates` (boundaries, inventory STRICT, fixture empty, money-number lint, schema sync).

## 4. Do not guess
Missing contract → leave OPEN/PARTIAL; do not invent column names, fee treatment, T+n calendar, or purity defaults.

## 5. Entry path
PRODUCT → ARCHITECTURE → FINANCIAL-CORE → DATA-MODEL → API → module → tests.

## 6. Absorbs
DOCUMENTATION-STANDARD process text · DEVELOPER-HANDOFF · READY-FOR-CODING (pointers only at those paths).


## Consolidation progress
Generation A owners are CURRENT. Generation B under docs/core prose is ARCHIVE or MERGE pointer. Schema/registry remain MACHINE under docs/core/db and docs/core/registry.

## AI coding rules
1. Read PRODUCT → ARCHITECTURE → FINANCIAL-CORE → module → schema.sql
2. Do not treat archive/ or SUPERSEDED files as requirements
3. One defect → one fix → one test → QUALITY-STATUS
4. Never create new BUG-*.md authority files

## PR checklist
- [ ] Touches only one defect theme
- [ ] Test added/updated
- [ ] No new authority markdown under docs/core
- [ ] Module/owner updated if behavior changed
- [ ] QUALITY-STATUS if gate status changes

## Test expectations
Domain finance tests use Decimal/toDecimal — never Number()/parseFloat on money.

## Schema changes
Update schema.sql + manifest + field inventory STRICT in same PR as code using new columns.
