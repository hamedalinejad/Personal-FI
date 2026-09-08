# Open Issues Register — LIVE

**Only open work for coding readiness.** Closed items → git history / `BUG-CODE-REGRESSION-INVARIANTS.md` / `P0-DOC-CLOSED-PREVENTION.md`.

## Blockers before Feature production (P0)

| ID | Work | Acceptance |
|----|------|------------|
| OPEN-001 | Schema freeze proven | strong drift + freeze evidence; not only table names |
| OPEN-003 / Gate H | Field no-loss | inventory + API/fixture disposition complete |
| OPEN-004 / Gate C | Golden family CI | core/crypto/loan/… jobs green |
| R-002…008 path | Production atomic path | SQLite domain txn + recovery matrix |
| Vertical slice #1 | **Loan-only** E2E | create→schedule→pay→journal→settle→persist→report→backup |

## P1 (after slice #1)

| ID | Work |
|----|------|
| P1-MOD-001/002 | `src/features/*` packages + ESLint boundaries |
| P1-MOD-003 | Standalone editions RELEASE-PROVEN |
| R-020…033 | Iran runtime evidence (Toman, fees, calendar, templates) |
| R-038…044 | Accounting reports from journal |
| R-047…051 | Locale, backup, import, encryption |
| Gate F/G | Offline crash/recovery + rebuild determinism |

## Explicit non-goals v1

NFT · DeFi · webhooks · cloud sync · multi-entity

## Closed (do not re-open as OPEN)

- P0-DOC-001…014 → `P0-DOC-CLOSED-PREVENTION.md`
- P0-CODE-001…012 → `BUG-CODE-REGRESSION-INVARIANTS.md` + `src/core`
- P0-SCHEMA-001…002 vocabulary → schema + Canonical-Financial-Operation
- Historical audits → thin pointers only

## Coding entry rule

**GO for Core hardening / Loan vertical slice scaffolding.**  
**NO-GO for parallel Feature UI production** until OPEN-001 + OPEN-004 family for that feature + vertical path proven.
