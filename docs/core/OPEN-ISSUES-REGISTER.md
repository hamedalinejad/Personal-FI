# OPEN Issues Register (live)

**Updated after:** OPEN-001…012 remediation pass  
**Authority:** this file + `GO-NO-GO.md` (not stale audit HEAD strings)

| ID | Topic | Status after pass | Residual |
|----|-------|-------------------|----------|
| OPEN-001 | Schema Freeze real coverage | **IN PROGRESS** — checklist + priority tables | need schema.sql + full column rows |
| OPEN-002 | Relationship matrix | **IMPROVED** — expanded FK table | fill remaining CA/fee/import edges at freeze |
| OPEN-003 | Field preservation proof | **IN PROGRESS** — TSV inventory started | expand to 0 undocumented |
| OPEN-004 | Golden fixture gate | **PARTIAL** — gap matrix documented | full engine pipeline |
| OPEN-005 | CI coverage | **CLOSED** — `npm run test:unit` in CI | — |
| OPEN-006 | Lint real | **DEFERRED** — explicit until Feature packages | ESLint when src/features exists |
| OPEN-007 | Authority refs | **CLOSED** — README/CODING-GATE → Think-Tank + GO-NO-GO | — |
| OPEN-008 | Audit HEAD metadata | **CLOSED** — marked historical + live pointers | — |
| OPEN-009 | Operation status vocab | **CLOSED** — posted + durabilityState only | grep residual “status=committed” |
| OPEN-010 | Date contract | **CLOSED** — Technical-Architecture aligned | — |
| OPEN-011 | Fund identity schema | **CLOSED** in matrix + freeze coverage | enforce in schema.sql |
| OPEN-012 | Crypto holding identity | **CLOSED** — residual assetKey rebuild prose fixed | — |

## Coding policy

Allowed now: Core money/costBasis/fixture harness tests.  
Blocked: Feature command writers until OPEN-001/003/004 reach Gate D/C green.

## DOC-CLN (architecture lock pass)

| ID | Status |
|----|--------|
| DOC-CLN-001 README broken ARCHIVE ref | **CLOSED** (prior) |
| DOC-CLN-002 CODING-GATE blocking source | **CLOSED** (prior + GO-NO-GO) |
| DOC-CLN-003 Audit HEAD metadata | **CLOSED** (historical marker) |
| DOC-CLN-004 status=committed vs posted | **CLOSED** (CFO) |
| DOC-CLN-005 UTC vs DATE-only | **CLOSED** (Technical-Architecture) |
| DOC-CLN-006 CI test:unit | **CLOSED**; ESLint deferred OPEN-006 |
| DOC-CLN-007 Relationship matrix 100% | **OPEN** (expanded, not complete) |
| DOC-CLN-008 Dictionary completeness | **OPEN** (= OPEN-003) |

Constitution document: `ARCHITECTURE-LOCKED.md` (sections pipeline, SoT, editions, UX-9, gates A–H, fixture list, execution order).
