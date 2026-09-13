# DEVELOPMENT (sole workflow / governance owner)

**Status:** LOCKED process

## Coding handoff chain
```
PRODUCT → ARCHITECTURE → FINANCIAL-CORE → DATA-MODEL → API
→ REPORTING → OFFLINE-RELEASE → DEVELOPMENT → modules/<feature>
→ schema → fixtures → tests
```
If a Coding AI must ask “which document is newer / which enum wins / is balance authoritative?”, that concept is **not standardized** — fix the owner doc, do not invent.

## Status layers (never collapse into one enum)
| Layer | Values |
|-------|--------|
| Documentation | DRAFT · REVIEW · LOCKED · ARCHIVED · GENERATED |
| Implementation | SPEC_ONLY · SCAFFOLD · IMPLEMENTED · INTEGRATED |
| Proof | UNPROVEN · GOLDEN_GREEN · RECOVERY_GREEN · STANDALONE_GREEN · RELEASE_PROVEN |
| Release | NO_GO · CONDITIONALLY_GO · GO |

Live summary: QUALITY-STATUS.md + `docs/core/registry/` JSON.

## Change rules
| Change | Path |
|--------|------|
| Bug | fix code → regression test → QUALITY-STATUS |
| Business rule | update owner → fixture/test → code |
| Architecture | ARCHITECTURE → affected owners → tests |
| History | git / archive only |

## Forbidden
New public BUG/GAP/REQ/AUDIT authority docs · duplicate Core rules in every module · ghost cash · ticket IDs as domain terms · silent field loss · snapshots as cash SoT · prose stronger than fixtures.

## Defect workflow
ONE DEFECT → ONE CODE FIX → ONE TEST → status update.

## Gates
`npm test` · `npm run gates` · boundary lint · inventory STRICT · fixture empty check · money-number lint · schema sync.

## Do not guess
Missing contract → leave OPEN; do not invent columns, fee treatment, T+n calendar, or purity defaults.

## Schema PRs
schema.sql + manifest + field inventory with consumers.

## Money in tests
Decimal / toDecimal only — never Number/parseFloat on money.
