---
id: DOC-AUTH-IRAN-V1-CCY
title: Local-Iran V1 Currency Policy
status: approved
version: 1.0
updated: 2026-09-12
---

# Scope

Many Iran-local verticals (stocks, metals, funds default) operate with:

```text
transactionCurrency === baseCurrency === IRR
exchangeRateToBase = 1
```

This is an **explicit Local-Iran V1 policy**, not a silent default of the global multi-currency invariant.

When `transactionCurrency !== baseCurrency`, commands **must** require `exchangeRateToBase` (and related FX context) per Accounting-Calculation-Invariants.
