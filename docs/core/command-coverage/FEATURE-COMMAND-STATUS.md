---
id: DOC-CMD-STATUS
title: Feature Command Status Registry
status: approved
version: 0.3
updated: 2026-09-12
---

# Feature command status (official vocabulary only)

See `authority/STATUS-VOCABULARY-MAPPING.md`.

| Feature | Command | Status | Notes |
|---------|---------|--------|-------|
| Loan | create / payment / reverse | IMPLEMENTED | Reference vertical; not RELEASE-PROVEN |
| Crypto | buy | IMPLEMENTED | Fee Engine; Model A cost pool |
| Funds | subscribe | IMPLEMENTED | No fee path yet; NAV≠transactionPrice |
| Stocks | buy | IMPLEMENTED | Fee Engine; T+n trade leg |
| Stocks | settle | IMPLEMENTED | Clears broker payable; position unchanged |
| Metals | buy | IMPLEMENTED | Fee Engine |
| Crypto | sell/transfer/swap | SPEC_LOCKED | |
| Funds | redeem/distribution | SPEC_LOCKED | |
| Stocks | sell/CA/dividend | SPEC_LOCKED | |
| Metals | sell/delivery | SPEC_LOCKED | |

Feature-level surface remains **PARTIAL** until remaining commands exist.

Release proof: none of the above are `RELEASE-PROVEN`.

| Stocks | settle | IMPLEMENTED | Journal: Dr payable / Cr cash |
