# Go / No-Go

**Live authority** for coding readiness.

**CODING-READY for Loan+Core** (see `docs/READY-FOR-CODING.md`). **Production still NO-GO.**
**Human entry:** `docs/READY-FOR-CODING.md`.
**Execution handoff:** `EXECUTION-HANDOFF.md` (§45–57).  
**Executive snapshot:** `FINAL-AUDIT-STATUS-2026-09-08.md`  
**Constitution:** `ARCHITECTURE-LOCKED.md`  
**Tracking:** `OPEN-ISSUES-REGISTER.md` · `REQUIREMENTS-IMPLEMENTATION-ROADMAP.md`

---

## Think-tank lock (2026-09-09)

**Do not** add parallel Feature surface until this sequence is green:

```text
HEAD → CI GREEN → one SQLite schema → one atomic persist path
  → correct idempotency → strict Decimal → journal SoT
  → schema/migration manifest → Loan-only vertical
  → golden + recovery proof → repeat Feature pattern
```

**Risk class now:** contracts exist, but runtime can diverge from them.  
That is more dangerous than missing docs — fix foundation before expanding Features.

---

## Coding AI rules (absolute)

See full list: `CODING-GATE.md`.

- No second cash/journal · no Number money · no silent date/currency/price defaults  
- No Feature expansion before Loan **RELEASE-PROVEN**  
- Files ≠ RELEASE-PROVEN without fixture + recovery evidence  



## Final Gate Table (live)

| Gate | Status | Evidence / residual |
|------|--------|---------------------|
| Authority | **PARTIAL** | concept homes OK; residual doc consolidation |
| Schema freeze | **PARTIAL** | coding baseline: drift+inventory+manifest PASS; release freeze needs full semantic equality + families |
| CI | **LOCAL GREEN** | `npm test` 53 pass; drift/inventory/docs-check PASS on HEAD. Confirm GitHub Actions run green on push |
| Decimal | **PARTIAL** | public boundary rejects non-string; global audit residual |
| Accounting | **PARTIAL** | journal balance + post path; void/reverse/correct/fiscal not full |
| Persistence | **PARTIAL** | canonical schema.sql bootstrap; SQLite default; JSON test-only |
| Idempotency | **PARTIAL** | operationId + commandHash in engine; not yet DB UNIQUE txn lock only |
| Migration | **PARTIAL** | schema_migrations + checksum in SQLite txn; not full product migration set |
| Cost basis | **PARTIAL** | WA + transfer/C2C helpers; full fee/journal attribution residual |
| FX | **PARTIAL** | direct/pivot/inverse + contextHash; full curve residual |
| Price | **PARTIAL** | async-safe + observation validation; full provider residual |
| Loan | **PARTIAL** | schedule period_based + feature scaffold create/pay |
| Feature packages | **PARTIAL** | `src/features/loan` only |
| Standalone | **NO** | contract yes; release-proven no |
| Golden CI | **NO** | families not release-gated |
| Offline recovery | **NO** | matrix incomplete |
| Rebuild determinism | **NO** | engineVersions partial; full context residual |
| No-field-loss | **PARTIAL** | column inventory; API/fixture disposition residual |
| **Production release** | **NO-GO** | |

---

## Allowed work now

1. Keep CI green (tests + drift + inventory + lint-boundaries + docs-check-refs)  
2. Harden Core (accounting ops, decimal audit, migration set)  
3. Complete **Loan-only** vertical to RELEASE-PROVEN (not parallel Features)  
4. Golden + recovery for loan family  

## Forbidden until Loan vertical proven

- Parallel Crypto/Stocks/Funds/Metals production writers  
- New documentation-only expansion without runtime proof  
- Claiming production readiness  

## Vertical order (locked)

```text
Core → Loan-only → Crypto → Funds → Stocks Iran → Metals → Accounts full UI
```

## UX authority

`docs/00-Product/Pages-IA.md` — primary nav ≤6.

## One-liner

> Prove one atomic financial path end-to-end for Loan-only; then copy the pattern. Do not expand specification surface faster than verified execution.


### Domain contracts §31–44

Locked: `docs/core/DOMAIN-CONTRACTS-31-44.md`. Implement only after Loan vertical proven.
