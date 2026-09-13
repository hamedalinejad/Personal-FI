---
id: DOC-AUTH-ACCT-CALC
title: Accounting and Calculation Master Rules
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# Scope

Executable contract for future code. Implementation may optimize structure; **semantics must not change**.

| Rule | Mandatory semantics |
|------|---------------------|
| **Double entry** | For every posted accounting event, total debits equal total credits within the defined balancing currency/valuation scope. Multi-currency lines retain line currency plus deterministic base conversion evidence. |
| **Reversal** | Creates an explicit **counter-event** linked to the original operation. Does **not** mutate/delete the original posted event. |
| **Correction** | A **new** event with explicit reason/source linkage; historical posted values stay auditable. |
| **Period lock** | Locked fiscal periods reject edits that would change financial truth. Corrections/reversals are dated in an **open** period and point to the original. |
| **Opening balance** | Controlled event with its own source date/provenance; must reconcile to opening trial balance. |
| **Fees** | Every fee has calculation inputs **and** treatment classification. `feeAmount` is preserved even when later split into components. |
| **Valuation** | Market prices never rewrite transaction cost or historical FX. Valuation reads a timestamped/as-of price with source and stale status. |
| **No zero fallback** | Missing/stale prices are represented as missing/stale — **never** silently zero, never treated as a valid price. |
| **Currency** | IRR, exchange-rate and cross-rate use explicit source/target currencies and a documented conversion path. No implicit currency assumptions. |
| **Date semantics** | Business date, transaction/trade date, event time, settlement date, actual cash date, and market date are stored **separately** whenever they have different accounting meaning. |

# Enforcement hooks

- `assertJournalBalanced` (core invariants)
- Fee Engine + Fee Treatment Matrix
- STOCKS-TN-SETTLEMENT / settlementPolicy version persistence
- Money decimal-string policy (no IEEE float for money)

# Production

These rules are binding in PARTIAL and IMPLEMENTED scopes.  
**RELEASE-PROVEN** still requires the release matrix evidence pack.
