# QUALITY-STATUS

**Live only.** History = Git / `docs/archive/AUDIT-HISTORY.md`.

## Gates
| Gate | Value |
|------|-------|
| SEMANTIC_CODING_READY | **true** |
| FREEZE_PROVEN | **false** |
| RELEASE_PROVEN | **false** |
| PRODUCTION | **NO-GO** |
| UI | **WAIT** |

## Semantic freeze blockers (must be green for FREEZE_PROVEN)
Contracts unambiguous · command registry complete · exact field mapping · schema consistent · owners consistent · deferred scope explicit · gate scripts trustworthy

Does **not** require: browser E2E, TWR/MWR, full holiday bulletin, license runtime, full golden families (those are **release**).

## Release blockers (must be green for RELEASE_PROVEN)
| Item | Status |
|------|--------|
| Golden families for claimed commands | PARTIAL |
| Recovery matrix executable | PARTIAL |
| Standalone edition packs | PARTIAL |
| Browser sql.js + IndexedDB E2E | OPEN (if shipping browser) |
| License runtime enforcement | SPEC_LOCKED machine only |
| TWR/MWR/FX attribution | DEFERRED |
| Official holiday bulletin completeness | seed only |

## Authority separation
| Question | Authority |
|----------|-----------|
| Per-command status | command-catalog.json |
| Feature/edition/release | status.registry.json |
| Requirement trace | requirements-matrix.json |
| Live dashboard | this file |
| Release evidence | generated RELEASE-EVIDENCE.json |

## Closed (do not reopen)
C0 authority split · field-preservation exact rows · release-evidence current paths · book-base FX path · metals holdingId/purity · fund redeem currency match · loan reversal currency · reduce_proceeds reporting rule · catalog no wildcards · journal REQUIRED\|FORBIDDEN

## Standalone
Loan | Crypto | Stocks | Funds | Metals → public-api only · shared Core journal

## Evidence
`npm test` · `npm run gates` · `docs/core/registry/*`
