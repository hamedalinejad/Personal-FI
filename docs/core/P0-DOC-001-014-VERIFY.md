# P0-DOC-001…014 — Verification Matrix

**Date:** 2026-09-04  
**HEAD:** after this commit  
**Method:** full-tree grep + targeted feature/core prose review

| ID | Topic | Residual risk found | Final rule enforced | Status |
|----|-------|---------------------|---------------------|--------|
| 001 | CashSettlementPort | Module-Architecture said “Local Settlement Account” without fin_accounts | Adapter → `fin_accounts` row + `fin_journal_lines` only | **VERIFIED CLOSED** |
| 002 | acc_transactions | Forbidden SUM dual-count present in schema | Event/projection only | **VERIFIED CLOSED** |
| 003 | Crypto identity | Forbidden WHERE only in commented blocks | instrumentId / holdingId | **VERIFIED CLOSED** |
| 004 | gross/net/fee | Single feePresence table marked sole | one matrix | **VERIFIED CLOSED** |
| 005 | economicFeeRole | Locked in Cost-Basis + Crypto | one role → one allocation | **VERIFIED CLOSED** |
| 006 | C2C cost | Market toTotalBase only as FORBIDDEN example | consideration model | **VERIFIED CLOSED** |
| 007 | totalFeesPaidBase | Derived/rebuildable in locks | non-authoritative if snapshot | **VERIFIED CLOSED** |
| 008 | Period Return | Mixed equation LEGACY/SUPERSEDED in lock file | Wealth + InvestmentReturn bridges only | **VERIFIED CLOSED** |
| 009 | Fund accountId | Integrated required / standalone nullable | command vs schema | **VERIFIED CLOSED** |
| 010 | fundId identity | Dual names | **Decision:** fundId = entity PK; instrumentId = ref_instruments (separate in v1) | **VERIFIED CLOSED** |
| 011 | Stocks Tether | Explicit not required | IRR + exchangeRateToBase | **VERIFIED CLOSED** |
| 012 | Brokerage cash | Early bullets softened to Port/projection | cashBalance projection | **VERIFIED CLOSED** |
| 013 | accountId nullable | Schema note + P0-FIX-013 | nullable schema; required only integrated command | **VERIFIED CLOSED** |
| 014 | CA ownership | Engine sole owner of formulas | CA Engine / Iran adapter / Feature split | **VERIFIED CLOSED** |

## Developer rule

Ticket status **CLOSED — VERIFY** means:

1. Canonical concept home has the rule.
2. Feature prose does not contradict it in implementable examples.
3. Residual mentions are forbidden/LEGACY comments only.

If a new Feature doc reintroduces a second cash SoT or symbol identity, treat as **regression P0**.
