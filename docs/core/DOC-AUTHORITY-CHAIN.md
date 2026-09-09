# Documentation Authority Chain (RESOLVED)

**Live.** Supersedes older B-005 hierarchy that ranked P0-FINAL/LOCKS above concept homes.

## Hierarchy for financial semantics

```
1. Concept home explicitly marked canonical (table below)
2. ARCHITECTURE-LOCKED.md — pipeline / architecture
3. Feature implementation-ready contract — feature scope only
4. docs/core/db/schema.sql — persistence shape
5. Current runtime — evidence of implemented behavior
6. Fixtures/tests — proof
7. Historical audits / tickets / think-tank — history only
```

## Canonical concept homes

| Concept | Home |
|---------|------|
| Cash SoT | Canonical-Cash-Model.md |
| Cash ports | Cash-Settlement-Adapter.md |
| Cost basis | Cost-Basis-Engine.md |
| Fees | Fee-Treatment-Matrix.md |
| Instrument identity | Instrument-Identity.md |
| Invariants | Financial-Invariants.md |
| Feature independence | Feature-Independence-Contract.md |
| Operation | Canonical-Financial-Operation.md |
| Architecture | ARCHITECTURE-LOCKED.md |
| Readiness | GO-NO-GO.md |
| Live work | OPEN-ISSUES-REGISTER.md |
| Handoff | EXECUTION-HANDOFF.md |
| Coding rules | CODING-GATE.md |
| UX | docs/00-Product/Pages-IA.md |
| Schema | db/schema.sql |
| Loan schedule | Loan-Schedule-Engine.md |
| Domain contracts | DOMAIN-CONTRACTS-31-44.md |

P0-FINAL-*, *-LOCKS.md, audit narratives **do not** create independent authority.

| Persistence durability vs status | PERSISTENCE-DURABILITY.md |
