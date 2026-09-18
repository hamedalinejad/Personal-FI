# QUALITY-STATUS

**Live dashboard only.** History = Git. No BUG/P0 Markdown authority.

## Vocabulary (LOCKED)
| Axis | Values |
|------|--------|
| Contract | LOCKED · DEFERRED · REJECTED |
| Implementation | NOT_IMPLEMENTED · PARTIAL · IMPLEMENTED |
| Proof | UNPROVEN · PARTIAL · GREEN |
| Release | FREEZE_PROVEN · RELEASE_PROVEN · NO-GO |

`SEMANTIC_CODING_READY` = contracts usable for scaffold (derived; not a second status system).  
`integrity:audit` without dataDir = **SKIPPED** (not GREEN release proof).

## Gates
| Gate | Value |
|------|-------|
| SEMANTIC_CODING_READY | **true** |
| FREEZE_PROVEN | **false** |
| RELEASE_PROVEN | **false** |
| PRODUCTION | **NO-GO** |
| UI | **WAIT** |

## Semantic freeze blockers
Unambiguous contracts · complete command cards · exact field mapping · schema consistency · single authority · deferred scope explicit · trustworthy gates  

**Not** freeze blockers: browser E2E, TWR/MWR, full holiday bulletin, license runtime, full golden families.

## Release blockers
| Item | Proof |
|------|-------|
| Goldens | PARTIAL |
| Recovery matrix | PARTIAL |
| Standalone packs | PARTIAL |
| Browser sql.js+IDB | OPEN if shipping |
| License runtime | SPEC_LOCKED machine |
| Official holiday package | seed only |
| integrity:audit on fixture DB | require GREEN not SKIPPED |

## Authority
| Question | Owner |
|----------|-------|
| Per-command status | command-catalog.json |
| Feature/edition/release | status.registry.json |
| Requirement trace | requirements-matrix.json |
| Live dashboard | this file |
| Evidence | generated RELEASE-EVIDENCE.json |

## Standalone
Loan · Crypto · Stocks · Funds · Metals → one public-api · shared Core · requiresAccountsUi=false

## Closure V3 (2026-09-18)
- field-preservation: schema column gate (PERSISTED → real table.column)
- amountInBase via resolveBaseAmountSync (funds/stocks/metals/crypto.transfer)
- metals: cost_currency must match transaction currency
- command catalog aligned: crypto.buy/sell/transfer, loan.create
- inventory: removed stale venue_kind

## Evidence
`npm test` (328) · schema drift GREEN · field-inventory 875 strict · command-catalog 42 · matrix 412  
`npm run gates` · registries · fixtures
