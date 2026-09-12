---
id: DOC-CMD-STATUS
title: Feature Command Status Registry
status: reviewed
version: 0.2
updated: 2026-09-10
---

# Feature command status

| Feature | Command | Stage |
|---------|---------|-------|
| Loan | create / payment / reverse | INTEGRATED (reference) |
| Crypto | buy | INTEGRATED + Fee Engine (not RELEASE-PROVEN) |
| Funds | subscribe | INTEGRATED + Fee Engine (not RELEASE-PROVEN) |
| Stocks | buy | INTEGRATED + Fee Engine (not RELEASE-PROVEN) |
| Metals | buy | INTEGRATED + Fee Engine (not RELEASE-PROVEN) |
| Crypto | sell/transfer/swap | SPEC_LOCKED |
| Funds | redeem/distribution | SPEC_LOCKED |
| Stocks | sell/CA/dividend | SPEC_LOCKED |
| Metals | sell/delivery | SPEC_LOCKED |

Edition release proof (B-041) is separate and **not green**.

## Scaffold freeze (2026-09-12)

Integrated commands have Gate H + Fee Engine where applicable.
Next implementation priority: Loan RELEASE-PROVEN matrix, then Crypto sell under same contracts.
