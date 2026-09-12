---
id: DOC-AUTH-TAX-SOT
title: TaxRecord vs TaxEvent ownership
status: locked
version: 1.0
---

# P0-TAX-001 / 002

| Entity | Role |
|--------|------|
| **TaxRecord** (`tax_records`) | Obligation / filing container |
| **TaxEvent** (`tax_events`) | Assessment, adjustment, linked operation fact |

**paid** is **derived** only after successful `payTax` financial operation (journal + cash).  
`changeStatus(..., 'paid')` without payTax is **FORBIDDEN**.

Status machine: draft → assessed → (payTax) → paid; amend/void via new events/operations.
