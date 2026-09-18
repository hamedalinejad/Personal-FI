# QUALITY-STATUS

**Live only.** History = Git / `docs/archive/AUDIT-HISTORY.md`. Never add BUG/P0/AUDIT Markdown authority files.

## Gates
| Gate | Value |
|------|-------|
| SEMANTIC_CODING_READY | **true** |
| FREEZE_PROVEN | **false** |
| RELEASE_PROVEN | **false** |
| PRODUCTION | **NO-GO** |
| UI | **WAIT** |

## Blockers (must green before FREEZE_PROVEN)
| Item | Status |
|------|--------|
| Browser sql.js + IndexedDB E2E | OPEN |
| TWR/MWR/FX attribution formulas | DEFERRED |
| Full golden families for every claimed command | PARTIAL |
| Official holiday bulletin completeness | seed only |
| License runtime enforcement | SPEC_LOCKED machine only |

## Authority separation (C0)
| Question | Authority |
|----------|-----------|
| Per-command status | command-catalog.json |
| Feature/edition/release | status.registry.json |
| Requirement trace | requirements-matrix.json (contract/implementation/proof) |
| Live dashboard | QUALITY-STATUS.md |
| Release evidence | generated RELEASE-EVIDENCE.json |

## Closed (do not reopen)
C0 command/status separation · field-preservation exact rows · release-evidence current paths · Fee taxonomy · loan exact conservation · stocks policy dates · crypto economic_kind · holdings uniqueness · book base · FX fail-closed · field-preservation gate · RELEASE-EVIDENCE live owners · loan role canonical · tax source vs payment ops · command effectClass · stocks account scope

## Standalone
Loan | Crypto | Stocks | Funds | Metals → public-api only · requiresAccountsUi=false · shared Core journal

## Evidence
`npm test` · `npm run gates` · `docs/core/registry/*` · `docs/core/RELEASE-EVIDENCE.json`
