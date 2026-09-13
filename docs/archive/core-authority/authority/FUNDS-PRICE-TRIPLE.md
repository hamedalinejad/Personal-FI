---
id: DOC-AUTH-FUNDS-PRICE
title: NAV vs transaction vs liquidation price
status: locked
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# P0-INV-004

| Price | Use |
|-------|-----|
| **NAV** | valuation / reporting |
| **transactionPrice** | subscribe/redeem execution |
| **liquidationPrice** | only when explicitly provided |

Never infer liquidation from NAV.
