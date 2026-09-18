# DEVELOPMENT (sole process owner)

**Status:** CURRENT

## Phase vocabulary
| Term | Meaning |
|------|---------|
| Reference scaffold | Executable Core/features under spec — incomplete |
| SEMANTIC_CODING_READY | Contracts usable for scaffold work |
| FREEZE_PROVEN | Semantic freeze gates green |
| RELEASE_PROVEN | Golden + recovery + standalone (+ browser if shipping) |
| PRODUCTION | Customer release — **NO-GO** until RELEASE_PROVEN |

## Coding sequence (LOCKED — single plan)
```
0  Documentation closure (this pass)
1  Numeric core (Decimal, units, FX)
2  Accounting kernel (journal, operation, fee)
3  Persistence / recovery
4  Loan reference vertical
5  Investments (crypto, stocks, funds, metals)
6  Remaining modules (I/E, cheque, tax, assets, budget)
7  Browser offline (sql.js + IndexedDB) if shipping
8  Standalone edition proof
9  Licensing enforcement
10 Semantic freeze (FREEZE_PROVEN=true)
11 UI (six routes only)
```
**Scaffold maintenance** on 1–4 allowed now. **Production feature coding** waits for step 10. UI = step 11 only.

## Status vocabulary (only these)
```
SPEC_LOCKED | IMPLEMENTED | PARTIAL | BLOCKED | DEFERRED | CLOSED_HISTORICAL
GOLDEN_GREEN | RECOVERY_GREEN | STANDALONE_GREEN | RELEASE_PROVEN
NO_GO | CONDITIONALLY_GO | GO
```
Do not treat IMPLEMENTED as RELEASE_PROVEN.

## Forbidden documentation
```
BUG-*.md  P0-*.md  FIX-*.md  AUDIT-*.md  MATRIX-*.md  FINAL-*.md
COMMAND-MATRIX.md  FEATURE-MATRIX.md  MASTER-*.md
```
History = Git. Live status = QUALITY-STATUS + registries.

## Handoff order (implementer)
```
DOCUMENTATION-STANDARD → PRODUCT → ARCHITECTURE → FINANCIAL-CORE → DATA-MODEL
→ API → REPORTING → OFFLINE-RELEASE → DEVELOPMENT → modules/<feature>
→ command-catalog.json → field-preservation-matrix.json → schema.sql → fixture → test
```
**Do not invent economics.** Missing contract → OPEN / DEFERRED, not guesswork.

## Command cards
Machine SoT: `docs/core/registry/command-catalog.json`  
Each mutation: requestFields · effectClass · journal · validation · errors · dbWrites · fixtures · recovery.

## Module template
Compact 9-part template in DOCUMENTATION-STANDARD.md (not 34 sections).  
Global money/FX/API/idempotency → **one-line pointer** to owner docs.

## Commit policy
```
feat|fix|docs|test|chore(scope): summary
```
No “final audit” commits that only add Markdown authority files.

## Scripts
`npm test` · `npm run gates` · `schema:smoke` (optional) · `field:preservation` · `inventory:check` · `freeze:check`  
`status:check` validates registry — no Markdown status generator.

## Freeze gate
`FREEZE_PROVEN=true` only when QUALITY blockers are green **and** `npm run gates` passes on a clean tree for claimed contracts.
