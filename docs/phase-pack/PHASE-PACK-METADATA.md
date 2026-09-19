# Phase pack metadata

**Synced:** 2026-09-19  
**Authority branch:** `main`  
**Pack index:** `docs/phase-pack/INDEX.md`  
**Live status detail:** `docs/QUALITY-STATUS.md`

| File | Phase | State | Local acceptance | CI (historical note) | Commit/HEAD on main |
|---|---|---|---|---|---|
| PHASE-0-SEMANTIC-CONTRACT.md | 0 | implemented / freeze-unproven | registry + constraint gates | inherited structural | `58e37c6` (closure); matrix lineage from `d554834` |
| PHASE-1-MONEY-ACCOUNTING-FOUNDATION.md | 1 | implemented / carry-over closed in P2 | money/FX/journal matrices | inherited | `3dca5ad` (closure); carry-over `34a1d9d` |
| PHASE-2-ACCOUNTING-KERNEL.md | 2 | implemented | kernel invariants + acceptance | Run 390 SUCCESS (historical) | `d66c873` |
| PHASE-3-PERSISTENCE-RECOVERY.md | 3 | implemented | integrity + backup/restore paths | Run 396 SUCCESS (historical) | `c0faa6d` |
| PHASE-4-LOAN-REFERENCE.md | 4 | implemented (open failure closed) | `as-of-close.test.js` 2/2 pass | Run 400 was FAILURE; fixed in `8aa1ae4` | `8aa1ae4` |
| PHASE-5-INVESTMENT-REPORTING.md | 5 | implemented on main | `investment.test.js` 5/5 pass | no dedicated workflow link required for local green | `12fb3b6` |
| PHASE-6-CORE-FINANCE-MODULES.md | 6 | implemented on main | `phase6-core-finance.test.js` 10/10 pass | none yet as dedicated run | `27b465c` |
| INDEX.md | pack | current status table | — | — | `15879df` |
| PHASE-PACK-METADATA.md | pack | this file | — | — | (this commit) |

## Status vocabulary (do not collapse)

| Label | Meaning |
|-------|---------|
| implemented | Code path exists on `main` for the claimed phase scope |
| local acceptance | `node --test` for that phase’s acceptance files passes |
| freeze-unproven | `FREEZE_PROVEN = false` |
| CI historical | A past GitHub Actions run number; not automatic proof of current HEAD |
| RELEASE-PROVEN | **false** for all phases |
| PRODUCTION | **NO-GO** |

## Minimum local proof commands

```bash
node --test src/features/loan/tests/as-of-close.test.js
node --test src/core/accounting/reports/investment.test.js
node --test src/features/accounts/tests/phase6-core-finance.test.js
```

Combined on current main: **17/17 pass**.

## Corrections vs prior metadata snapshot

| Prior claim | Correction |
|-------------|------------|
| Phase 4 = one open failure / Run 400 FAILURE | Fixed: signed reversal + paid_off lifecycle; local 2/2 green at `8aa1ae4` |
| Phase 5 = implementation on branch only / HEAD `518537b…` | Merged/implemented on main at `12fb3b6` |
| Phase 6 = blueprint only / n/a | Implemented on main at `27b465c` |

## Still open (not phase-complete blockers for 0–6 scope claims)

- `FREEZE_PROVEN = false`
- `RELEASE_PROVEN = false`
- Browser sql.js + IndexedDB RELEASE E2E
- Advanced loan / CA / TWR-MWR / deferred crypto commands
- Dedicated CI workflow annotation for Phase 5/6 heads (optional evidence, not code gap)

## Rule

Update this table only when a phase commit lands on `main` or a proof status changes. Do not invent RELEASE-PROVEN from local tests alone.
