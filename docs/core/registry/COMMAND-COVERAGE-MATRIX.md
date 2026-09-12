---
id: DOC-CMD-COVERAGE-FULL
title: Full financial command coverage matrix
status: approved
version: 1.0
updated: 2026-09-12
---

Lifecycle: `SPEC_LOCKED` | `IMPLEMENTED` | `PARTIAL` | `OPEN` | `N/A`

| Feature | Command | Spec | Impl | Golden | Recovery | Standalone | Notes |
|---------|---------|------|------|--------|----------|------------|-------|
| Loan | create | SPEC_LOCKED | IMPLEMENTED | PARTIAL | PARTIAL | PARTIAL | reference |
| Loan | payment | SPEC_LOCKED | IMPLEMENTED | PARTIAL | PARTIAL | PARTIAL | |
| Loan | reversePayment | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Loan | generateSchedule | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Loan | earlySettlement | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | matrix doc exists |
| Loan | restructure | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Loan | rateChange | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Loan | fee/penalty | SPEC_LOCKED | PARTIAL | OPEN | OPEN | OPEN | fee repo read |
| Crypto | buy | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Crypto | sell | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Crypto | transfer | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Crypto | swap | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Crypto | deposit/withdraw | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Crypto | airdrop/opening | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Stocks | buy | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | T+n |
| Stocks | sell | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Stocks | settle | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Stocks | dividend | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Stocks | CA (each) | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Funds | subscribe | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Funds | redeem | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Funds | distribution | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Funds | reinvest | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Metals | buy | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Metals | sell | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Metals | delivery | SPEC_LOCKED | IMPLEMENTED | PARTIAL | OPEN | PARTIAL | |
| Accounts | create/transfer/deposit/withdraw | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Income | create/reverse | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Expense | create/reverse | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Cheque | issue/deposit/clear/bounce | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Tax | create/assess/pay | SPEC_LOCKED | PARTIAL | OPEN | OPEN | OPEN | tax_events runtime |
| Budget/Goals/Bills | lifecycle | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |
| Physical Assets | purchase/sale | SPEC_LOCKED | OPEN | OPEN | OPEN | OPEN | |

**Production / RELEASE-PROVEN:** only when Golden+Recovery+Standalone are green for the claimed edition surface — currently **NO-GO**.
