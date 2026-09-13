# DEVELOPMENT (sole engineering workflow owner)

**Status:** CURRENT

## 1. Entry path for humans / Coding AI
PRODUCT → ARCHITECTURE → FINANCIAL-CORE → DATA-MODEL → API → REPORTING → OFFLINE-RELEASE → DEVELOPMENT → `modules/<feature>.md` → schema + fixtures + tests.

## 2. Change protocol
```
ONE DEFECT → ONE CODE FIX → ONE TEST → QUALITY-STATUS update
(+ OWNER DOC only if contract changes)
```
Forbidden: defect → new audit → new matrix → new competing contract.

## 3. Gates
`npm run gates` (tests, schema drift/inventory/manifest, lints, integrity:audit, release:evidence skeleton).

## 4. Status vocabulary
* Docs: DRAFT | REVIEW | LOCKED | ARCHIVED | GENERATED  
* Impl: SPEC_ONLY | SCAFFOLD | IMPLEMENTED | INTEGRATED  
* Proof: UNPROVEN | GOLDEN_GREEN | RECOVERY_GREEN | STANDALONE_GREEN | RELEASE_PROVEN  
* Release: NO_GO | CONDITIONALLY_GO | GO  

IMPLEMENTED ≠ RELEASE_PROVEN.

## 5. Coding order
Loan vertical proof first; then copy pattern to other features. No parallel production release claims.

## 6. Documentation
DOCUMENTATION-STANDARD.md is process authority. Do not create micro BUG-*-STATUS files.
