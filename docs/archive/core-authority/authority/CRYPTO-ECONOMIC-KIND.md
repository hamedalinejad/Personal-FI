---
id: DOC-AUTH-CRYPTO-ECON
title: Crypto economic_kind lock
status: locked
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# P0-INV-002

| economic_kind | Meaning |
|---------------|---------|
| acquisition | buy / deposit valued |
| disposal | sell / withdrawal valued |
| transfer_internal | same economic owner; no taxable disposal |
| swap_economic | C2C economic swap; disposal + acquisition legs |
| fee | fee leg |

C2C **taxable/economic swap** ≠ internal transfer. Fixtures must separate them.
