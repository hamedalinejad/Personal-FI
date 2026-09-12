---
id: DOC-CMD-STATUS
title: Feature Command Status Registry
status: approved
version: 0.4
updated: 2026-09-12
---

# Official vocabulary only (STATUS-TAXONOMY)

| Feature | Command | Status | Notes |
|---------|---------|--------|-------|
| Loan | create / payment / reverse | IMPLEMENTED | Reference vertical |
| Crypto | buy | IMPLEMENTED | Model A cost pool; Fee Engine |
| Crypto | sell | IMPLEMENTED | WAC disposal + realized PnL |
| Funds | subscribe | IMPLEMENTED | NAV ≠ transactionPrice |
| Funds | redeem | IMPLEMENTED | WAC disposal |
| Stocks | buy | IMPLEMENTED | T+n trade → broker payable |
| Stocks | settle | IMPLEMENTED | Clears payable → cash |
| Metals | buy | IMPLEMENTED | Purity required; foreign fee safe |
| Metals | sell | IMPLEMENTED | WAC disposal |

Feature surfaces remain **PARTIAL** (no transfer/CA/delivery yet).  
None are **RELEASE-PROVEN**. Production **NO-GO**.
