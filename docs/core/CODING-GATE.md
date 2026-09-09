# Coding Gate

**Team entry:** `docs/DEVELOPER-HANDOFF.md`.


**Live.** Rules for any coding AI or human implementer.  
**Handoff:** `EXECUTION-HANDOFF.md` · **Readiness:** `GO-NO-GO.md`

---

## 1. Absolute rules (no exceptions)

```
DO NOT redesign architecture.
DO NOT invent new accounting truth.
DO NOT add a second cash ledger.
DO NOT add a second journal.
DO NOT identify historical assets by symbol alone.
DO NOT mutate posted financial rows in place.
DO NOT use JavaScript Number for money/qty/rate/price arithmetic.
DO NOT silently default missing business dates.
DO NOT silently default financial base currency.
DO NOT silently replace missing price/FX with zero.
DO NOT use latest price for a historical valuation without explicit policy.
DO NOT expand top-level navigation beyond the locked IA.
DO NOT implement Crypto/Stocks/Funds/Metals before the Loan vertical is RELEASE-PROVEN.
DO NOT mark a requirement RELEASE-PROVEN merely because source files exist.
```

---

## 2. Requirement chain (must be complete for RELEASE-PROVEN)

```
Requirement
→ Owner
→ SoT
→ Schema field/table
→ API request
→ domain calculation
→ transaction plan
→ persistence
→ query
→ fixture
→ test
→ recovery/rebuild behavior
```

If any link is missing → status stays **SPECIFIED** or **PARTIAL**.  
Files alone ≠ RELEASE-PROVEN.

---

## 3. Canonical authority order (financial semantics)

| Priority | Source | Role |
|----------|--------|------|
| 1 | Canonical concept/lock document | Meaning |
| 2 | Feature implementation-ready doc | Scope for that slice |
| 3 | `docs/core/db/schema.sql` | Persistence shape |
| 4 | Current source implementation | Runtime |
| 5 | Golden fixtures/tests | Evidence |
| 6 | Historical audit notes | History only — **not** executable authority |

### UX authority
```
docs/00-Product/Pages-IA.md
```

### Pipeline / accounting constitution
```
docs/core/ARCHITECTURE-LOCKED.md
```

### Live readiness
```
docs/core/GO-NO-GO.md
docs/core/OPEN-ISSUES-REGISTER.md
docs/core/REQUIREMENTS-IMPLEMENTATION-ROADMAP.md
docs/core/EXECUTION-HANDOFF.md
```

---

## 4. Allowed work now

1. Core hardening (invariants, SQLite, recovery, decimal, accounting ops)  
2. Complete **Loan-only** vertical until RELEASE-PROVEN  
3. Golden + recovery for core + loan families  

## 5. Forbidden until Loan RELEASE-PROVEN

- Parallel Crypto / Stocks / Funds / Metals production packages  
- New top-level nav destinations  
- Second cash or journal SoT  
- Claiming production readiness  

---

## 6. Preflight

```bash
npm test
npm run gates
```

See `IMPLEMENTATION-READY-INDEX.md` · `IMPLEMENTATION-READY-LOAN-SLICE.md`


## Loan v1 schema

Only columns in `LOAN-V1-SCHEMA-DISPOSITION.md` REQUIRED set. Deferred fields → reject until migration.
