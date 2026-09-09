# Execution Handoff (§45–57)

**Live.** This is the AI/implementer handoff.
**Coding rules:** `CODING-GATE.md` (absolute DO NOTs + authority order). Production remains **NO-GO** until gates prove.

## Priority (absolute)

```
Accounting truth > Historical reproducibility > Data preservation
> Atomicity > Idempotency > Determinism > Modularity
> Feature breadth > UI polish
```

## Golden rule

```
one operation → one transaction → one journal truth → one cash truth
→ one feature ledger truth → one durable commit → reproducible reports
```

## AI rules

```
NO INFERENCE
NO SILENT DEFAULT
NO SECOND SOURCE OF TRUTH
NO UNTESTED FINANCIAL LOGIC
NO "IMPLEMENTED" WITHOUT EVIDENCE
```

## 45 Reports (minimum)

Accounting: GL, Trial Balance, Account Activity, BS, IS, CF, Opening, Reconciliation.  
Investment: Holdings, Cost Basis, Realized/Unrealized P&L, Price/FX Effect, Fees, External Flows, Wealth Bridge.  
**External contribution ≠ P&L.**

## 46 UX

Authority: `docs/00-Product/Pages-IA.md`  
Nav ≤6: `/` `/money` `/transactions` `/investments` `/loans` `/more`  
Feature ≠ Page. Create/edit = sheets. No top-level Accounting page.

## 47 Golden fixture families

Must be **machine-asserted**. Families listed in OPEN-ISSUES / fixtures plan: Core, Money, Crypto, Stocks, Funds, Loans, Metals, Cheque, Recovery, Standalone.

## 48 Core exact vectors (tests in src/core/fixtures)

| Vector | Expected |
|--------|----------|
| Toman 1_000_000 | IRR 10_000_000 |
| Expense 100 | Dr expense / Cr cash |
| Transfer 250 | Dr dest / Cr source |
| O1+H1 → O1+H1 | replay; O1+H2 | conflict |
| C2C fee capitalised | dest cost = consideration + fee |
| Fund NAV≠tx | cost = units × txPrice |
| Metal | fine = gross × purity |

## 49 Doc issues

One live status only. Nav ≤6. Freeze wording aligned to GO-NO-GO.

## 50 File lifecycle

KEEP list = architecture + canonical contracts + schema + inventory + fixtures.  
Collapse candidates only after unique rule = 0 and inbound refs = 0.

## 51 Sequence

Phase 0 CI → 1 Persistence → 2 Decimal → 3 Schema/Migration → 4 Accounting → 5 Loan → 6 Crypto→Funds→Stocks→Metals→Accounts UI

## 52–53 Definition of Done

Core DoD and Feature DoD checklists in GO-NO-GO / this file. **RELEASE-PROVEN** only when all boxes green with evidence.

## 54 Acceptance command

```bash
npm ci
npm test
npm run lint
npm run docs:check-refs
npm run docs:validate
npm run schema:drift
npm run schema:inventory
npm run schema:manifest:check
npm run gates
```

## 55 Verdict (live)

| Area | Status |
|------|--------|
| Documentation | GOOD |
| Architecture intent | GOOD |
| Core / Persist / Idempotency / Accounting / Migration / Decimal / CB / FX / Price / Loan | PARTIAL |
| Other features | NOT INTEGRATED |
| Standalone / Golden CI / Recovery / Rebuild | NOT RELEASE-PROVEN |
| No-field-loss | PARTIAL |
| Production | **NO-GO** |

## 57 Reference map

```
ARCHITECTURE-LOCKED · GO-NO-GO · OPEN-ISSUES · ROADMAP
Feature-API · Independence · Canonical-Op · Cash · Settlement
Invariants · Cost-Basis · Fee · Instrument · Loan-Schedule
schema.sql · schema.manifest.json · field-inventory
IMPLEMENTATION-READY-* · Pages-IA · DOMAIN-CONTRACTS-31-44
```
