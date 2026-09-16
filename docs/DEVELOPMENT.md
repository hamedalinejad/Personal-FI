# DEVELOPMENT

**Status:** CURRENT · process owner only

## Project phase vocabulary (LOCKED)
```
Specification-locked reference implementation scaffold
→ incomplete and not release-proven
→ not "no code yet"
```
Do not delete `src/**` fixtures or tests.

## Coding sequence (LOCKED — only plan)
```
0  Documentation normalization          ← largely done at HEAD
1  Numeric core (Decimal, FX)
2  Accounting kernel (ops, journal, invariants, reversal)
3  Persistence / recovery
4  Loan reference vertical
5  Investments (Crypto, Stocks, Funds, Metals)
6  Remaining modules
7  Browser offline (sql.js + IndexedDB)
8  Standalone proof packs
9  Licensing (capability only; never delete history)
10 Semantic freeze (FREEZE_PROVEN)
11 UI — six routes only
```
**Start coding at steps 1–4 now.** UI stays at step 11. FREEZE_PROVEN stays false until open items in QUALITY-STATUS are green.

## Status vocabulary (only these)
```
SPEC_LOCKED · IMPLEMENTED · PARTIAL · BLOCKED · DEFERRED · CLOSED_HISTORICAL
GOLDEN_GREEN · RECOVERY_GREEN · STANDALONE_GREEN · RELEASE_PROVEN
NO_GO · CONDITIONALLY_GO · GO
```
Do not invent synonyms (READY/DONE/GREEN as free text).

## Forbidden documentation
```
BUG-*.md · P0-*.md · GAP-*.md · AUDIT-*.md · FIX-*.md · MATRIX-*.md · VERDICT-*.md
```
Defect → test → code → owner update only if contract changed → QUALITY-STATUS → commit.

## Developer must not invent economics
Read in order:
```
DOCUMENTATION-STANDARD → PRODUCT → ARCHITECTURE → FINANCIAL-CORE → DATA-MODEL
→ API → REPORTING → OFFLINE-RELEASE → DEVELOPMENT → modules/<feature>
→ command-catalog.json → field-preservation-matrix.json → schema.sql → fixture → test
```
If a rule is missing: mark OPEN / DEFERRED; do not guess journal legs, FX, fees, or dates.

## Module template
One file per feature under `docs/modules/`. Same headings for all modules (Purpose, Scope, Commands, Journal, Fees, FX, Proof…). Global rules stay in FINANCIAL-CORE / DATA-MODEL — do not copy.

## Command cards
Machine source of truth: `docs/core/registry/command-catalog.json`.  
No one Markdown file per command.

## Commit policy
```
docs: …   fix(core): …   fix(schema): …   test: …   feat(loan): …
```
Small reversible commits. No UI commits before step 10.

## Scripts
```
npm test
npm run gates
```
Gates are release path. Optional smoke scripts are not authority.

## Freeze gate (summary)
FREEZE_PROVEN only when QUALITY-STATUS open rows are green and `npm run gates` passes without exception for claimed contracts.

## Coding start (locked)
`SEMANTIC_CODING_READY = true` while `FREEZE_PROVEN = false`.

Allowed now:
1. Accounting kernel hardening
2. Loan vertical
3. Investment public-api commands
4. Persistence/recovery hardening

Not allowed yet:
- UI routes
- Claiming production
- Inventing deferred command economics (corporate actions, crypto deposit/swap, TWR/MWR)
