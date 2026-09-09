# Developer Handoff — Personal-FI

**Audience:** engineering team / coding AI  
**Purpose:** one page to start building correctly without inventing financial semantics.

---

## 0. Status (read this twice)

| | |
|-|-|
| You **may** code | Core hardening + **Loan** vertical |
| You **must not** ship | Production release (NO-GO) |
| You **must not** start | Crypto / Stocks / Funds / Metals / Cheque packages until Loan is **RELEASE-PROVEN** |
| Proof of done | Tests + recovery + golden + `npm run gates` green — **not** “file exists” |

---

## 1. Read order (mandatory before first commit)

| # | File | Why |
|---|------|-----|
| 1 | This file | Scope & sequence |
| 2 | `docs/core/CODING-GATE.md` | Absolute do/don’t |
| 3 | `docs/core/GO-NO-GO.md` | Gate board |
| 4 | `docs/core/DOC-AUTHORITY-CHAIN.md` | Who wins on conflict |
| 5 | `docs/core/ARCHITECTURE-LOCKED.md` | Pipeline & SoT |
| 6 | `docs/core/Canonical-Financial-Operation.md` | Mutation contract |
| 7 | `docs/core/Canonical-Cash-Model.md` | Cash truth |
| 8 | `docs/core/Financial-Invariants.md` | Money laws |
| 9 | `docs/core/LOAN-V1-RESOLUTIONS.md` | Formula, role, rate unit |
| 10 | `docs/core/LOAN-V1-SCHEMA-DISPOSITION.md` | Columns allowed in v1 |
| 11 | `docs/core/IMPLEMENTATION-READY-LOAN-SLICE.md` | Loan commands & acceptance |
| 12 | `docs/core/db/schema.sql` | Persistence shape |
| 13 | `docs/00-Product/Pages-IA.md` | UX ≤6 destinations |

**On conflict:** concept home > architecture > feature ready-spec > schema > source > tests > historical audits.

---

## 2. Non-negotiable laws

1. **Money / qty / rate / price** = decimal **strings**. Reject `Number` at public boundaries. No `CAST(... AS REAL)` for finance.
2. **One cash SoT:** `fin_accounts` + `fin_journal_lines`. Feature balances are projections only.
3. **One journal.** No feature-owned parallel ledger of cash.
4. **Atomic mutation:** validate → plan → **one SQLite transaction** (domain + journal + cash) → durable commit.
5. **Idempotency:** `operationId` (client UUID) + `commandHash`. Same pair = replay. Same id different hash = `IDEMPOTENCY_CONFLICT`.
6. **Posted rows are immutable.** Correction = reversal + new operation.
7. **Instrument identity** = `ref_instruments.id`, never symbol alone.
8. **No silent defaults** for `operationId`, `businessDate`, currency, FX, price, financial role.
9. **Historical reports** need explicit `ValuationContext` (never “latest” by accident).
10. **Loan v1 declining** = **equal-principal** (`1.0.0-period_based-equal-principal`). Annuity = future version only.
11. **API rate** = percentage points (`12` = 12%). Engine converts once to fractional `0.12`.
12. **UX:** max 6 nav destinations. Feature ≠ page. No top-level `/accounting`.

---

## 3. What is already implemented (Loan + Core)

Evidence lives under `src/`. Do not re-derive contracts from partial code when docs conflict.

| Area | State |
|------|--------|
| `canonicalDecimal` string boundary | Implemented |
| Atomic op + SQLite path + `withinTransaction` | Implemented |
| Journal lines with amountInBase / FX / lineKind | Implemented |
| Loan create / pay / reverse (strict required fields) | Implemented |
| Canonical schedule snapshot envelope | Implemented |
| Overpayment rejected | Implemented |
| Double-reverse rejected | Implemented |
| Rate % → fractional | Implemented |
| Backup/restore file test | Implemented |
| Standalone loan-only smoke | Implemented |
| package-lock → public npmjs for decimal.js | Fixed |

**Still open (engineering, not “mystery docs”):**

| Item | Track |
|------|--------|
| Loan DEFERRED schema columns | `LOAN-V1-SCHEMA-DISPOSITION.md` + migrations |
| PWA sql.js + IDB adapter | Persistence Port (Node SQLite is test/dev adapter) |
| Full multi-hop FX / price policy product depth | After Loan proof |
| Public CI green evidence | `npm ci` on GitHub Actions |
| Feature packages beyond Loan | After Loan RELEASE-PROVEN |

Closed vs deferred register: `docs/core/DEFERRED-AND-CLOSED.md`.

---

## 4. Implementation sequence

```text
Phase A  Core harden (if regression found) + keep gates green
Phase B  Finish Loan proof (A1–A12 + recovery + CI)
Phase C  Mark Loan RELEASE-PROVEN only with evidence
Phase D  Crypto → Funds → Stocks Iran → Metals → Cheque
Phase E  Full Accounts UI / Reports polish / PWA shell
```

Copy the **same pattern** as Loan for every next feature:

```text
public-api → commands/queries → domain → ledger → ports/adapters → fixtures/tests
```

Never: Feature A imports Feature B private SQL/domain.

---

## 5. Loan command contracts (v1)

### create

**Required:** `operationId`, `role=lent`, `principal`, `currency`, `annualRate`, `periods`, `method`, `startDate`, `businessDate`, `dayCount=period_based`.

Reject: missing fields, `borrowed`, multi-currency without full FX path (`LOAN_MULTI_CURRENCY_DEFERRED`).

**One transaction:** `ln_loans` + `ln_schedule_snapshots` + `fin_operations` + journal.

**Snapshot JSON** must include: `engineVersion`, `dayCount`, `rate`, `rateInput`, `currency`, `residual`, `generatedAt`, `installments[]`.

### recordPayment

**Required:** `operationId`, `loanId`, `amount`, `currency`, `businessDate`.

Waterfall: penalty → fee → interest → principal.  
Overpayment → `OVERPAYMENT_NOT_SUPPORTED`.  
Outstanding recompute **inside** the same SQLite transaction.  
Writes `ln_transactions` + balanced journal.

### reversePayment

**Required:** `operationId`, `originalOperationId`, `businessDate`, `currency`.  
New operation; `reverses_operation_id` + `reverses_transaction_id`.  
Second reverse → `ALREADY_REVERSED`.

Golden vectors: see `LOAN-V1-RESOLUTIONS.md` (zero-interest; 12% equal-principal schedule 12…1 interest).

---

## 6. Commands to run

```bash
npm ci
npm test
npm run gates
```

Gates include: tests, dependency graph, docs validate, boundary lint, schema drift, field inventory, schema manifest, registry index, bench smoke.

---

## 7. Definition of Done (Loan RELEASE-PROVEN)

All must be true:

- [ ] create rejects missing `operationId` / `businessDate` / `currency` / `role`
- [ ] declining = equal-principal; rate points normalized once
- [ ] snapshot shape matches contract
- [ ] create/pay/reverse atomic + `ln_transactions` for payments
- [ ] overpayment rejected; double reverse rejected
- [ ] idempotent replay + conflict
- [ ] backup/restore preserves loan + journal
- [ ] standalone loan-only path without Accounts UI
- [ ] golden vectors machine-asserted
- [ ] GitHub Actions green on public registry lockfile

Until then: **Production NO-GO**.

---

## 8. Map of important docs

| Need | Path |
|------|------|
| Live readiness | `core/GO-NO-GO.md`, `core/OPEN-ISSUES-REGISTER.md` |
| Coding rules | `core/CODING-GATE.md` |
| Closed bugs / deferred by design | `core/DEFERRED-AND-CLOSED.md` |
| Domain contracts (Crypto…Reports) | `core/DOMAIN-CONTRACTS-31-44.md` |
| Journal line fields | `core/JOURNAL-LINE-CONTRACT.md` |
| Durability vs business status | `core/PERSISTENCE-DURABILITY.md` |
| Feature API shape | `core/Feature-API-Contract.md` |
| Independence / editions | `core/Feature-Independence-Contract.md` |
| Iran money/dates | `core/IMPLEMENTATION-READY-IRAN.md` |
| Product UX | `00-Product/Pages-IA.md` |
| Feature deep specs | `features/**` (lose to concept homes on conflict) |

Historical `THINK-TANK-*` / dated audits = **history only**.

---

## 9. Forbidden (summary)

```text
Second cash ledger · Second journal · Silent operationId/date/currency/FX/price
Number money · REAL cast finance · Mutate posted rows · Symbol as identity
Snapshot as accounting SoT · Cross-feature private SQL · Formula change without version bump
“Implemented” without evidence · Parallel production features before Loan proof
```

---

## 10. Contact for semantics

If two docs disagree: follow **§1 hierarchy**. Do not invent a third rule.  
Escalate only with: requirement id · both sources · proposed resolution · test evidence plan.
