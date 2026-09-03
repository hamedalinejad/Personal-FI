# Documentation Authority Chain (P1-008)

```text
1. LOCKS (P0-FINAL-*, P1-*, feature *-LOCKS.md)
2. Canonical Core contracts (CFO, Cash Model, Cost Basis, types, db)
3. Main Feature doc
4. Product / UX prose
```

Contradiction → fix or mark **LEGACY — superseded**.  
Mechanical check required before freeze: LOCKS vs Feature docs.

## P1-009 — Per-feature freeze requirements

Each **in-scope** feature before its coding starts:

- every persisted field classified (kind, owner, editable, SoT, rebuild, migration)
- reversal plan by operation kind
- standalone behavior
- ValuationContext where applicable

Consolidation/delete policy: `DOC-CONSOLIDATION-POLICY.md`.
