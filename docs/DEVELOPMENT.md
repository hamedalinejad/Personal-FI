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
