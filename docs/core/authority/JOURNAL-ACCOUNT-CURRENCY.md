---
id: DOC-AUTH-JRNL-CCY
title: Journal Line Currency ↔ Account Currency Lock
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# P0 Contract clarification

`currency` on a journal line **must** match the currency of the account it posts to.

If an account has a fixed currency:

- multi-currency economic events use the **matching-currency account** (e.g. cash USDT vs cash IRR), and/or
- explicit **FX legs** (`line_kind` fx / fx_gain / fx_loss) between accounts.

Forbidden:

```text
account currency = IRR
line.currency = USDT
```

on the same line without an FX structure.

`amountInBase` / `exchangeRateToBase` translate for **base-currency trial balance**; they do not license mismatched account/line currencies.
