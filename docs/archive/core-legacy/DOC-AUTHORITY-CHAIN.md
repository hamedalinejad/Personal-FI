> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

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
| Schema vocabulary P0 | P0-SCHEMA-VOCABULARY-LOCK.md |
| Team handoff | docs/DEVELOPER-HANDOFF.md |
| UX | docs/00-Product/Pages-IA.md |
| Schema | db/schema.sql |
| Loan schedule | Loan-Schedule-Engine.md |
| Domain contracts | DOMAIN-CONTRACTS-31-44.md |

P0-FINAL-*, *-LOCKS.md, audit narratives **do not** create independent authority.

| Persistence durability vs status | PERSISTENCE-DURABILITY.md |


## Binding authority additions (2026-09-10)

- docs/core/authority/IMMUTABLE-ACCOUNTING-RULES.md
- docs/core/authority/API-CONTRACT.md
- docs/core/authority/IMPLEMENTATION-ORDER.md
- docs/core/authority/STATUS-TAXONOMY.md
- docs/core/authority/FILE-LIFECYCLE.md
- docs/core/authority/GOLDEN-FIXTURE-MATRIX.md

- docs/core/authority/DATA-OWNERSHIP-AND-MODELS.md
- docs/core/authority/FINAL-VERDICT-AND-GATES.md
- docs/core/authority/DOCUMENTATION-READY.md
- docs/core/authority/SCAFFOLD-FINAL-STATUS.md
- docs/core/authority/STATUS-VOCABULARY-MAPPING.md
- docs/core/authority/JOURNAL-ACCOUNT-CURRENCY.md
- docs/core/authority/COST-POOL-MODEL.md
- docs/core/authority/LOCAL-IRAN-V1-CURRENCY-POLICY.md
- docs/core/authority/STOCKS-TN-SETTLEMENT.md
- docs/core/authority/RELATIONSHIP-PROOF-STATUS.md
- docs/core/authority/COST-CURRENCY-MATRIX.md
- docs/core/authority/THINK-TANK-FINAL-ANSWER.md
- docs/core/authority/FIELD-KIND-VOCABULARY.md
- docs/core/authority/CROSS-DOCUMENT-CONSISTENCY.md
- docs/core/authority/SECTION-STATUS-SNAPSHOT.md
- docs/core/registry/REQUIREMENTS-MATRIX.md
- docs/core/registry/requirements-matrix.json
- docs/core/authority/DATA-MODEL-RELATIONSHIP-CONTRACT.md
- docs/core/authority/FIELD-PRESERVATION-PROTOCOL.md
- docs/core/authority/ACCOUNTING-CALCULATION-MASTER-RULES.md
- docs/core/authority/DOCUMENTATION-STATUS-TAXONOMY.md
- docs/core/authority/CANONICAL-PIPELINE.md
- docs/core/authority/CALCULATION-CONTEXT.md
- docs/core/authority/DO-NOT-GUESS.md
- docs/core/authority/NAVIGATION-IA.md
- docs/core/authority/COMMAND-MATRIX-TEMPLATE.md
- docs/core/authority/DOCUMENTATION-REPAIR-PLAN.md
- docs/core/authority/RESULT-JSON-CONTRACT.md
