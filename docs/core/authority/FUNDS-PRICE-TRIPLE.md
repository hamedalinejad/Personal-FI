---
id: DOC-AUTH-FUNDS-PRICE
title: NAV vs transaction vs liquidation price
status: locked
version: 1.0
---

# P0-INV-004

| Price | Use |
|-------|-----|
| **NAV** | valuation / reporting |
| **transactionPrice** | subscribe/redeem execution |
| **liquidationPrice** | only when explicitly provided |

Never infer liquidation from NAV.
