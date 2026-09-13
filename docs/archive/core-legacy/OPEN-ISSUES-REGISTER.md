# Open Issues — LIVE

## Closed 2026-09-12 (sections 12–14)

| ID | Fix |
|----|-----|
| P0-OFFLINE-001 | Browser harness adapter + atomic publish + backup/restore API |
| P0-OFFLINE-002 | Recovery suite: backup/restore, idempotency, loan roundtrip, import path |
| P1-OFFLINE-003 | tabWriter multi-owner WRITER_REQUIRED + withBrowserLock |
| P0-MOD-001 | Standalone tests: loan/crypto/funds/stocks/metals |
| P0-MOD-002 | dep:graph + lint-boundaries already CI gates |
| P1-MOD-003 | licenseGate — UI only, history retained |
| P0-SCHEMA-001 | schema-sync-pipeline.js + SCHEMA-SYNC-REPORT.md |
| P1-SCHEMA-003 | feature-field-diff.js → FEATURE-FIELD-DIFF.md |

## Still release-engineering (not doc blockers)

| Item | Note |
|------|------|
| Real browser sql.js in Chromium | Port contract stable; wire when UI shell exists |
| Full golden family CI per fixture file | fixture catalog large; expand machine asserts continuously |
| Production ship | GitHub Actions green on main |

## Production

**NO-GO** until Actions + recovery checklist on release tag.
