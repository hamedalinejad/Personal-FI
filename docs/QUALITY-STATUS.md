# QUALITY-STATUS

**Live only.** No BUG/AUDIT Markdown files.

## Production gates
| Gate | Value |
|------|-------|
| FREEZE_PROVEN | **false** |
| RELEASE_PROVEN | **false** |
| PRODUCTION | **NO-GO** |
| UI | **WAIT** |
| Coding | **Core + Loan + feature public-apis** |

## Closed (do not reopen as docs)
Owner tree · six routes · journal SoT · Decimal · book base · fee enum · loan conservation · stocks dates/policy columns · crypto economic_kind · import/loan FKs · dual-mode publicRegistry · standalone packs · full-edition shared journal · command catalog 42 cards · field matrix ≥230 rows · recovery matrix named + core scenarios · Iran calendar **structure** v1 · browser **protocol** harness

## Explicitly open / deferred (blocks only claimed scope)
| Item | Blocks |
|------|--------|
| Browser real-tab E2E | Browser RELEASE only |
| Official Iran holiday **dates** filled | Equity holiday-aware settlement RELEASE |
| TWR/MWR formulas | Performance reports claiming TWR/MWR |
| Empty `fixtureRefs` goldens for accounts/cheque/tax/budget | Those commands' GOLDEN_GREEN |
| Full recovery crash-injection in-process | RECOVERY_GREEN organizational claim |
| Corporate actions / crypto deposit-swap | Until un-deferred with command+fixture |

## Dual mode (product)
| Mode | Accounts UI | Integration |
|------|-------------|-------------|
| loan-only / fund-only / metals-only / … | Not required | Single public-api |
| full | Optional surface | `src/api/publicRegistry` · shared journal |

## Evidence
```
npm test · npm run gates · src/api/publicRegistry.js
standalone-edition-packs · full-edition-integration
docs/core/registry/* · data/policy/iran/*
```
