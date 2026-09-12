---
id: DOC-AUTH-REPORT-ORDER
title: Report dependency graph and as-of reconstruction order
status: approved
version: 1.0
---

# REPORT-001 — dependency graph

```text
Reports
  → Core journal / query APIs
  → Feature query APIs
  → Valuation API
```

**Forbidden:** `Reports → feature snapshot cash balance` as cash SoT.

# REPORT-002 — table prefix

Canonical SQL: `rpt_*` only (`rpt_presets`, `rpt_snapshots`, `rpt_net_worth_snapshots`).  
Prose `rep_*` is obsolete.

# REPORT-003 — historical as-of order (frozen)

```text
1. ledger cutoff
2. corporate actions cutoff
3. cost basis rebuild
4. settlement cutoff
5. price selection
6. FX selection
7. valuation
8. report
```

No report may reorder these steps.
