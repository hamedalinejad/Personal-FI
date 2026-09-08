# Requirements Implementation Roadmap

**Live status authority:** this file’s **Current status** table + `GO-NO-GO.md` + `OPEN-ISSUES-REGISTER.md`.  
**File lifecycle:** `DOC-CONSOLIDATION-POLICY.md` only (do not invent parallel DELETE tables).

## Implementation state vocabulary

| State | Meaning |
|-------|---------|
| SPECIFIED | docs contract locked |
| IMPLEMENTED-IN-CORE | `src/core` + unit tests |
| INTEGRATED | feature package wired |
| RELEASE-PROVEN | golden + offline gates for scope |
| BLOCKED | waiting on another gate |
| DEFERRED | out of current version |

## Current status (R-001…R-020) — 2026-09-08

| ID | Need | State | Evidence / residual |
|----|------|-------|---------------------|
| R-001 | Schema freeze | **GO for coding** (SCHEMA-FREEZE-PROOF + drift/inventory CI) | release still needs family fixtures |
| R-002 | Atomic operation | IMPLEMENTED-IN-CORE | operationEngine.js + tests |
| R-003 | Durable persistence | IMPLEMENTED-IN-CORE | SQLite worker + json prototype |
| R-004 | Exact decimal / invariants | IMPLEMENTED-IN-CORE | canonicalDecimal + invariant gate |
| R-005 | Cost basis | IMPLEMENTED-IN-CORE | domain/costBasis; full families OPEN-004 |
| R-006 | Loan schedule | IMPLEMENTED-IN-CORE | scheduleEngine period_based; day-count residual |
| R-007 | Cash settlement | SPECIFIED + IMPLEMENTED-IN-CORE (contract/helpers) | Cash-Settlement-Adapter |
| R-008 | Instrument identity | IMPLEMENTED-IN-CORE (memory registry) | network-distinct tests |
| R-009 | Feature independence tooling | SPECIFIED | P1-MOD-001/002 — no src/features yet |
| R-010…R-015 | Price/FX/CA/FIF/migration/CI | SPECIFIED | P1 |
| R-016…R-019 | Portfolio/tax/reports/license | SPECIFIED / DEFERRED depth | P2 |
| R-020…R-051 | Iran + settings + security | SPECIFIED | P1 product path |
| R-036/037/056…058 | NFT/DeFi/webhooks/cloud/multi-entity | DEFERRED | P3 non-goals |

## Implementation sequence

1. R-001 coding freeze done → deepen Gate H + family fixtures  
2. R-015 family CI (crypto + loan)  
3. R-002…R-008 release-proven on helpers  
4. Vertical slice Loan-only (R-009 edition)  
5. Iran P1 + reports  
6. R-016…R-019  

## File lifecycle (canonical)

See **DOC-CONSOLIDATION-POLICY.md**.  
Protected: OPEN-ISSUES, GO-NO-GO, ARCHITECTURE-LOCKED, prevention registries, schema, fixtures, feature mains.  
Deleted (do not restore): feature `*-LOCKS.md`, pure pointer duplicates.  
P0 in a filename is **not** a delete signal.

## Modularity residual (P1-MOD)

| ID | Status |
|----|--------|
| P1-MOD-001 | `src/features/*` packages not on main |
| P1-MOD-002 | ESLint boundaries deferred until packages exist |
| P1-MOD-003 | Standalone editions SPECIFIED; not RELEASE-PROVEN |

## Historical changelog

Prior roadmap snapshots (2026-09-05…07) that listed Stub/DELETED tables or repeated R-002…R-008 blocks are **superseded** by this file. Do not merge them back as live status.

