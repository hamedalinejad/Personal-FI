---
id: DOC-AUTH-SCAFFOLD-FINAL
title: Scaffold Final Status — Locked Package
status: approved
version: 1.0
updated: 2026-09-12
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# Scaffold package — finalized

This document freezes the **implementation scaffold** package for Personal-FI.

## What is FINAL (locked for this phase)

| Layer | Status |
|-------|--------|
| Authority docs (`docs/core/authority/**`) | approved / binding |
| Immutable accounting rules | approved |
| Data ownership & domain models | approved |
| API contract shape | approved |
| Status taxonomy | approved |
| Schema (`schema.sql`) | SPEC_LOCKED |
| Persistence port + migration ensure | IMPLEMENTED (Node) |
| Financial operation kernel | IMPLEMENTED |
| Fee Engine (Core) | IMPLEMENTED |
| GL / Trial Balance | PARTIAL (Core) |
| Loan create/payment/reverse | INTEGRATED (reference vertical) |
| Crypto buy | INTEGRATED |
| Funds subscribe | INTEGRATED |
| Stocks buy | INTEGRATED |
| Metals buy | INTEGRATED |
| Gate H fixtures (buy/subscribe) | PARTIAL green |
| Idempotent recovery fixtures | PARTIAL green |

## What is NOT final (explicitly out of this freeze)

- Production release
- Full golden family CI
- Full recovery matrix
- Browser sql.js adapter
- sell / transfer / CA / delivery / redeem commands
- Full BS/IS/CF and investment P&L reports
- Iran settlement policy engine executable
- Tax domain separation runtime

## Mandatory project wording

```text
Documentation-first
+ implementation scaffold / reference runtime
+ pre-production
Production: NO-GO
```

## Developer rule after this freeze

1. Do not invent parallel authority docs.
2. Extend features only via `Canonical Financial Operation` + Fee Engine + journal SoT.
3. New commands need: contract section → implementation → Gate H → golden → recovery.
4. No RELEASE-PROVEN claim without evidence listed in FINAL-VERDICT-AND-GATES.md §34.


## Schema dual status (P0-B03)

| Token | Meaning |
|-------|---------|
| SPEC_LOCKED | Semantic/schema **contract** frozen for coding |
| FREEZE_PROVEN | Evidence (manifest, checksum, inventory, drift=0) ready for **release** |

Current: SPEC_LOCKED=yes, FREEZE_PROVEN=no (see status.registry.json).
