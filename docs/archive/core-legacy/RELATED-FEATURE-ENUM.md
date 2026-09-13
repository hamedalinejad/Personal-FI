> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

---
id: DOC-RELATED-FEATURE-ENUM
title: Single source relatedFeature enum
status: locked
version: 1.0
---

# P0-CASH-003

Authoritative values (SQL CHECK + TS must match):

```text
accounts
income
expense
cheque
loan
investment.crypto
investment.stocks
investment.funds
investment.metals
physical_assets
budget
goals
bills
tax
```

Feature docs must not invent local lists.
