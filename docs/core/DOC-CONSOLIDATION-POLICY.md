# Documentation Consolidation Policy

## Authority model

```text
P0/P1 ticket numbers  ≠  independent authority
Canonical concept doc + explicit lock section  =  authority
```

Ticket IDs (P0-FIX-*, P0-FINAL-*, AUD-*) are **traceability labels** only.  
If ticket text and canonical doc conflict → **canonical wins**; ticket section must be fixed or marked LEGACY.

---

## Protected — do not delete until after Schema Freeze (and usually never)

```text
Data-Dictionary.md
Field-Level-SoT.md / Field-Level-Data-Ownership-Matrix.md
Source-of-Truth-Matrix.md
Domain-Dependency-Matrix.md
Feature-API-Contract.md
Feature-Independence-Contract.md
Cash-Settlement-Adapter.md
Canonical-Cash-Model.md
Instrument-Identity.md
CANONICAL-FINANCIAL-REQUIREMENTS.md
CODING-GATE.md
fixtures / GOLDEN-* / HARNESS.md
Feature main docs under docs/features/**
```

---

## Safe delete (only if zero live references)

Already removed historically (do not recreate):

- CROSS-CUTTING-CONTRACTS-BATCH*.md
- CROSS-FEATURE-P0-090-100 / X-001-020 locks
- Documentation-Audit-2026-09-01 / Support-Layers-Audit
- FEATURE-BUG-RESOLUTIONS.md

May delete when grep shows no inbound links and body has no unique rule:

- empty historical archive notes
- pure duplicate full-body copies of a pointer target
- superseded audit that only restates locks already in canonical docs

**Procedure:** (1) grep references (2) migrate any unique sentence to canonical (3) delete (4) commit.

---

## Pointer-only (keep path, no independent body)

| Path | Canonical body |
|------|----------------|
| `NAMING-GLOSSARY.md` | `NAMING-GLOSSARY.md` |
| `docs/core/rounding/Rounding-Policy.md` | prefer `docs/core/rounding/Rounding-Policy.md` as sole body; root file = thin pointer + Iran table only if not duplicated |
| `Calculation-Engines.md` | `Calculation-Engines.md` |
| `Financial-Scenario-Catalog.md` | Financial-Scenario-Catalog / fixtures |

---

## Merge map — P0 numbers → canonical concepts

| Concept home | Owns topics including |
|--------------|----------------------|
| **Financial-Invariants** + **CANONICAL-FINANCIAL-REQUIREMENTS** | immutability, SoT, decimal, rebuild, reconcile≠repair |
| **Canonical-Cash-Model** + **Cash-Settlement-Adapter** | cash SoT, ports, acc_transactions event-only |
| **Money / Rounding** (`rounding/Rounding-Policy.md`) | precision, decimal string, IRR/Toman display |
| **Instrument-Identity** | instrumentId, symbol label, assetKey index |
| **Cost-Basis-Engine** + **Fee-Treatment-Matrix** | C2C, transfer fee, fee roles, P&L axes |
| **Valuation & FX** (Currency feature + P0-FINAL FX locks) | ValuationContext, multi-hop path, observation order |
| **Loan** feature + **Loan-Schedule-Engine** | schedule, day count, residual |
| **Stocks Iran** + **Corporate-Action-Engine** + **Iran Core** | T+2, CA formulas ownership |
| **Funds Policy** (Fixed-Income-Funds.md) | NAV≠tx price, settlement routes, instrumentId |
| **Feature-API-Contract** + **Feature-Independence** | envelope, query contract, standalone |
| **Persistence/Schema** (db/*, SCHEMA-FREEZE, Migration) | types, FK, drift test |
| **Fixtures/Acceptance** (GOLDEN-GATE, HARNESS, CODING-GATE) | green families before feature code |

Think-tank logs (`*-THINK-TANK.md`) may remain as **decision history**; they do not override concept homes.

---

## Inbound “CROSS-CUTTING BATCH” section titles

Those headings are **historical labels** inside canonical files.  
Content stays; authority is the host file, not the deleted batch pack.  
Optional cleanup: rename heading to drop BATCH id without deleting rules.


## B-005 — Authority when docs conflict (LOCKED)

```text
1. Concept home LOCK section / P0-FINAL-* / Feature *-LOCKS.md
2. Canonical concept file body (merge map above)
3. Feature main *.md
4. Think-tank / audit narrative (history only)
```

Ticket numbers (B-00x, OPEN-00x, P0-xxx) are **tracking labels only** — they do not outrank LOCK text.  
Two developers must follow the same chain; if prose conflicts with LOCK, **LOCK wins** and prose is marked LEGACY or deleted (P1-FINAL-030).


## B-011 / B-012 path lock

| Concept | Canonical body | Pointer only |
|---------|----------------|--------------|
| Naming | `docs/core/NAMING-GLOSSARY.md` | `docs/core/Naming-Glossary.md` |
| Rounding | `docs/core/rounding/Rounding-Policy.md` | `docs/core/Rounding-Policy.md` |

## B-013 headers

Section titles that still mention batch ids are historical labels inside concept homes; authority is the host file (see above). Soft-renamed where automated.

## Documentation style (from DOCUMENTATION-STYLE-P2)

See historical notes in git history of `DOCUMENTATION-STYLE-P2.md` if needed. Prefer this policy file.


## File lifecycle (think-tank R-021…060)

See `THINK-TANK-R021-060-AND-FILE-LIFECYCLE.md`.

- Trackers OPEN / GO-NO-GO / REQUIREMENTS roadmap: **retain until all items closed**.
- FINAL-THINK-TANK-AUDIT: **historical retain** until unique rules fully migrated.
- Root Naming/Rounding: **pointer only**.
- Feature `*-LOCKS.md`: **thin pointers OK**.
- Do not delete GOLDEN skeletons until replaced with expected values.
- `src/` bootstrap is intentional; do not remove again without implementation branch policy.
