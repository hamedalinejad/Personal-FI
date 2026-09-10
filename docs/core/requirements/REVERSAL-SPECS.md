---
id: DOC-REQ-REVERSAL
title: Reversal Specs — Runtime Commands
status: reviewed
version: 0.1
updated: 2026-09-10
---

# R-012 — Reversal plans (commands with runtime)

## Common rules

- Posted journal rows are **immutable**; reverse = new operation with opposite legs + `reverses_operation_id`.
- Domain tx rows get a paired reversal tx (`tx_type` adjustment/reversal) linked by operationId.
- Holdings/snapshots are **rebuildable** from tx history; do not silently rewrite history.
- Same `operationId` + different payload → `OP_IDEMPOTENCY_CONFLICT`.

## loan.create / loan.payment / loan.reversePayment

| Item | Behavior |
|------|----------|
| Original | ln_loans, schedule snapshot, journal, ln_transactions |
| Reversal | `loan.reversePayment` exists for payments; create-loan reverse = void path + compensating journal |
| Linkage | reversal tx references original payment operationId |

## crypto.buy

| Item | Behavior |
|------|----------|
| Original | inv_crypto_transactions (buy), holdings qty/cost, journal Dr inventory Cr cash |
| Reversal command | `crypto.reverseBuy` (**SPEC_LOCKED** — not implemented) |
| Plan | insert disposal/adjustment tx netting qty; journal Cr inventory Dr cash (or expense if fee treatment differs); rebuild holding |

## fund.subscribe

| Item | Behavior |
|------|----------|
| Original | inv_fif_transactions, holdings, journal |
| Reversal | `fund.reverseSubscribe` (**SPEC_LOCKED**) |
| Plan | redeem-like domain row + inverse journal; scope by account_id |

## stocks.buy

| Item | Behavior |
|------|----------|
| Original | inv_stocks_iran_transactions, holdings, journal (principal + fee treatments) |
| Reversal | `stocks.reverseBuy` (**SPEC_LOCKED**) |
| Plan | inverse qty/cost; inverse fee expense if any; settlement state machine aware |

## metals.buy

| Item | Behavior |
|------|----------|
| Original | inv_metals_transactions, holdings, journal (metal/premium/fee split) |
| Reversal | `metals.reverseBuy` (**SPEC_LOCKED**) |
| Plan | inverse quantity_mg and carrying components per treatment |
