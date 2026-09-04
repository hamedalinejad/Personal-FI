# Think-tank: R-021…R-060 + file lifecycle

**Date:** 2026-09-04  
**Panel:** accounting (Iran GAAP-ish personal books), financial analysis, systems engineering, product, security, QA.

**Scope lock:** Only R-001…R-060 and the explicit file-lifecycle table in this doc / user message. No opportunistic bug hunts in unrelated GitHub history.

---

## 1. Verdict on R-001…R-020 (P0/P1 blockers)

| Band | Reality on main | Panel decision |
|------|-----------------|----------------|
| R-001 schema | **Partial→advanced** (`schema.sql` expanded) | Continue until drift test 0 vs 01-schema-tables |
| R-002…R-008 Core engines | Spec + **src stubs** + decimal tests | **Block Feature UI** until engines + GOLDEN green |
| R-009…R-015 P1 platform | Spec / partial | After Core path green |
| R-016…R-020 P2 | Deferred | Do not expand scope before Gate C |

**NO-GO for Feature command writers** until R-002…R-008 implement and fixture families for scoped release are green.

---

## 2. R-021…R-060 — prioritization (panel)

### Must integrate into existing engines (not new main pages)

| IDs | Theme | Decision |
|-----|--------|----------|
| R-021 | Bank deposit interest (Iran day/month) | P1 — Accounts + Income event; day-count policy versioned |
| R-022 | Brokerage fee schedule (SEO rules) | P1 — Stocks fee table / CanonicalFeeEvent |
| R-024 | ETF vs fixed-income fund | P1 — already FI/ETF split in funds locks; implement valuationMode |
| R-027 | Opening entry | P1 — already P0-FINAL-014; ensure all asset classes |
| R-029 | AR/AP beyond cheque | P1 — extend parties + liability/receivable ops; cheque remains subset |
| R-031…R-033 | Iran loans (housing, late fee, Jalali holidays) | P1 — Loan engine templates + calendar adapter |
| R-038…R-044 | Classic accounting reports | P1 reports — **after** journal SoT solid; pure projections |
| R-047…R-050 | Settings Jalali, i18n, backup, import | P1 shell — parallel track, non-blocking Core money |
| R-051 | DB encryption | P1 security for real users offline |

### P2 — after v1 money path

R-023 Codal · R-025 participation bonds · R-026 housing/car physical pricing · R-028 closing entries · R-030 depreciation · R-034/035 staking/airdrop (partially locked) · R-045/046 export · R-052/053 biometric/auto-lock · R-054/055 dashboard · R-059 sub-accounts · R-060 FX translation reports

### P3 — explicit non-goals for v1

R-036 NFT · R-037 DeFi/LP · R-056 webhooks · R-057 multi-device cloud sync · R-058 multi-entity

**Accounting lead:** R-038–R-044 are *reports*, not second ledgers.  
**Iran markets lead:** R-022/R-024/R-031–033 before Codal (R-023).  
**Engineering lead:** No new Feature packages until R-002–R-008 run.

---

## 3. File lifecycle decisions

| # | Path | Decision | Why |
|---|------|----------|-----|
| 1 | AUDIT-HISTORY-NOTE.md | **KEEP thin HISTORICAL** | Already marked; 1 screen ok |
| 2 | FINAL-THINK-TANK-AUDIT-2026-09-03.md | **KEEP HISTORICAL** until grep shows 0 unique rules not in concept homes | Still large; do not delete blindly |
| 3 | ARCHIVE-NOTE-BATCH-LOCKS | **N/A** (absent) | — |
| 4 | Documentation-Roadmap | **KEEP or pointer** to REQUIREMENTS roadmap | |
| 5–6 | Naming-Glossary / Rounding-Policy root | **KEEP as pointers only** | Already policy |
| 7 | Calculation-Engines.md | **KEEP body** (engine map) | B-010 |
| 8–10 | OPEN / GO-NO-GO / REQUIREMENTS roadmap | **KEEP until all CLOSED** | User-ordered |
| 11–12 | GOLDEN / HARNESS | **KEEP** fill expected values | |
| 13 | FEATURE template | **Moved** `.github/` | |
| 14–15 | features README / feature-id-map | **KEEP** | IA |
| 16 | DOCUMENTATION-STYLE-P2 | **Pointer** to consolidation | Done |
| 17–18 | ARCHITECTURAL-PROHIBITIONS / Implementation-Pitfalls | **KEEP** if unique rules; else pointer | Review before delete |

**15 LOCKS files:** keep as 7-line pointers (panel majority).

**src/:** restored as bootstrap — correct; not “delete again”.

---

## 4. Implementation order (reinforced)

```text
R-001 drift-complete
→ R-003 persist + R-002 atomic op
→ R-004 invariants + R-008 identity + R-007 cash
→ R-005 cost basis + R-015 crypto GOLDEN
→ R-006 loan + R-031…033 Iran loan
→ R-010/011 price/FX
→ R-012/013/022/024 stocks+funds
→ R-027 opening all classes
→ R-038…044 report projections
→ R-047…051 shell/security
→ P2/P3 backlog
```
