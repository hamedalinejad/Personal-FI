---
id: DOC-AUTH-STOCKS-TN
title: Stocks Iran T+n Settlement Accounting
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

# Trade vs settlement

| Event | Timing | Journal |
|-------|--------|---------|
| Trade | `tradeDate` | Dr Stock inventory / Cr Broker payable |
| Settlement | `settlementDate` | Dr Broker payable / Cr Cash |

Position quantity follows **tradeDate**. Cash follows **settlementDate** (or `actualCashDate` when present).

Same-day settlement only when `settlementDate === tradeDate` **and** `allowSameDaySettlement === true` (policy explicit).

Pending settlement: `settlementStatus = pending_settlement`. A future `stocks.settle` command clears payable.


## stocks.settle (IMPLEMENTED)

Command clears broker payable with cash. Position quantity unchanged. Double settle → ALREADY_SETTLED.


> Lifecycle state for `stocks.settle`: see `docs/core/registry/status.registry.json` (single SoT).
