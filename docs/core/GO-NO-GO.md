# Go / No-Go

**Live authority** for coding readiness (single status table below).  
**Constitution:** `ARCHITECTURE-LOCKED.md`  
**Tracking:** `OPEN-ISSUES-REGISTER.md` · `REQUIREMENTS-IMPLEMENTATION-ROADMAP.md`  
**Historical audits:** `FINAL-THINK-TANK-AUDIT-2026-09-03.md` (NOT live)

---

## Live status — 2026-09-08

| Gate | Status | Notes |
|------|--------|-------|
| Continued documentation | **GO** | concept homes only |
| A — Authority | **MOSTLY GO** | residual consolidation tracked in OPEN |
| B — Schema freeze | **NO** | content **advanced**; freeze **not proven** (OPEN-001) |
| C — Numeric fixtures | **NO** | OPEN-004 family CI incomplete |
| D — Financial path code | **PARTIAL** | `src/core` engines v1 present; Feature packages not on main |
| E — Standalone | **NO** | contract yes; release-proven no (P1-MOD-003) |
| F — Offline recovery | **NO** | contract + partial crash tests; matrix incomplete |
| G — Rebuild determinism | **NO** | needs full engines + fixtures |
| H — No-field-loss proof | **PARTIAL** | inventory column coverage; API/fixture disposition residual |
| Core unit tests | **GO** | `npm test` on `src/core` |
| Feature production code | **NO** | until B+C green for scoped family + vertical slice |
| Production release | **NO** | |

**Phase:** docs-first on `main` **with** `src/core` engines v1 (helpers).  
`src/features/*` package graph **not** present yet (P1-MOD-001).

### Implementation state vocabulary (P1-DOC-005)

| State | Meaning |
|-------|---------|
| **SPECIFIED** | contract complete in docs |
| **IMPLEMENTED-IN-CORE** | `src/core` helper exists + unit tests |
| **INTEGRATED** | Feature package uses Core via Public API/ports |
| **RELEASE-PROVEN** | golden family + offline/crash gates green for that scope |

Do **not** use bare “Implemented v1” in live tables. Prefer the four states above.

### One-liner

> Freeze schema + field graph, green golden fixtures, implement one vertical Feature (Loan-only) through API → Operation → Journal → Cash → Persist → Report.

### Edition commercial lock

License/capability flags **must not** delete or rewrite accounting history.

### Requirements pointer

Canonical current R-status → `REQUIREMENTS-IMPLEMENTATION-ROADMAP.md` (one table only).

### Offline proof matrix (Gate F/G — not green)

| Scenario | Required | Status |
|----------|----------|--------|
| Airplane mode | txs offline | SPECIFIED |
| Price unavailable | last known + stale; never silent zero | SPECIFIED |
| Crash mid-write | DB not corrupt | PARTIAL (tests) |
| Backup/restore | domain+journal+docs | SPECIFIED |
| License expire | capability off; data remains | SPECIFIED |
| Import unknown | unknownFields kept | SPECIFIED |
| Rebuild | same context ⇒ same report | SPECIFIED |

### Feature coding entry gate

| Gate | Exit condition |
|------|----------------|
| A Authority | one concept home; zero contradictory live status |
| B Schema | drift=0 + freeze proven |
| C Numeric | scoped golden families green |
| D Financial path | API → Atomic Op → Journal/Cash → Persist → Report |
| E Standalone | Loan + one Investment without Accounts UI |
| F Offline | airplane + stale + crash + backup/restore |
| G Rebuild | same context ⇒ same report |
| H No-field-loss | Domain→Schema→API→Migration→Fixture |

**Vertical slice #1:** Loan-only end-to-end before parallel Feature writers.

---

## HISTORICAL (do not use as live status)

> Prior paragraphs that said “src absent / no src on main / Feature NO-GO because no src” referred to a **docs-only cleanup phase** and are **obsolete**.  
> `src/core` was restored; Feature production remains NO until gates above.

