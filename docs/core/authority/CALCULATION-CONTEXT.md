---
id: DOC-AUTH-CALC-CTX
title: Locked calculation context on posted operations
status: approved
version: 1.0
---

Posted operations that calculate should lock relevant engines in `fin_operations.engine_versions`:

```json
{
  "accounting": "x.y",
  "costBasis": "x.y",
  "rounding": "x.y",
  "fx": "x.y",
  "loanSchedule": "x.y",
  "valuation": "x.y",
  "calendar": "x.y",
  "tax": "x.y"
}
```

Only relevant keys required; historical reproducibility depends on stored context.
