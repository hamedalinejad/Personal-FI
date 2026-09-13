---
id: DOC-AUTH-METALS-PURITY
title: Metals purity snapshot
status: locked
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# P0-INV-005

- `purityRatio` on acquisition = **RAW**
- `fineWeightMg` = **DERIVED** (`quantityMg × purityRatio`)
- Delivery preserves source quantity/purity; recipient inventory transforms under explicit policy
- Do not silently default purity to 1
