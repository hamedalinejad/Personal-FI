---
id: DOC-CMD-MATRIX
title: Command Field Coverage Matrix
status: reviewed
version: 0.2
updated: 2026-09-10
---

# Command field coverage (R-001 / B-033 / B-034)

**Rule:** `holding snapshot alone` is never enough. Required lineage:

```text
operation + feature transaction row + journal + cash effect + rebuildable holding
all linked by operationId
```

## Status vocabulary (B-032)

| Stage | Meaning |
|-------|---------|
| SPEC_LOCKED | Spec locked |
| IMPLEMENTED | Command runtime exists |
| INTEGRATED | Uses Core atomic path + port |
| GOLDEN-GREEN | Golden fixtures pass |
| RECOVERY-GREEN | Backup/restore proven for command |
| RELEASE-PROVEN | Full edition gates green |

**One command ≠ feature implemented.**

## crypto.buy

| API field | SoT | Column / effect | Status |
|-----------|-----|-----------------|--------|
| instrumentId | ref_instruments | id | INTEGRATED |
| symbol | label on create | ref_instruments.symbol | INTEGRATED (required on create) |
| networkId | instrument + holding | network_identifier / network_id | INTEGRATED |
| exchangeId | inv_crypto_exchanges | id | INTEGRATED |
| gross/fee/net qty | inv_crypto_transactions | gross_quantity, fee_quantity, net_quantity | INTEGRATED |
| feeCurrency | inv_crypto_transactions | fee_currency | INTEGRATED |
| feeInstrumentId | inv_crypto_transactions | fee_instrument_id | INTEGRATED |
| costTotal + FX | journal + payload | amount_in_base via journal lines | INTEGRATED |
| carrying cost | inv_crypto_holdings | total_invested | INTEGRATED (derived; rebuild later) |
| raw payload | fin_operations.result_json | payload | INTEGRATED |

## fund.subscribe

| API field | SoT | Status |
|-----------|-----|--------|
| instrumentId + symbol | ref_instruments | INTEGRATED |
| quantity/units | inv_fif_transactions + holdings | INTEGRATED |
| nav / transactionPrice | tx + valuation in domainResult | INTEGRATED |
| accountId | holdings.account_id + tx.account_id | INTEGRATED |
| valuation provenance | domainResult.valuation + payload | PARTIAL→INTEGRATED |

## stocks.buy

| API field | SoT | Status |
|-----------|-----|--------|
| instrument + isin + lot/tick | ref + inv_stocks_iran_instruments | INTEGRATED |
| brokerageId | inv_stocks_iran_brokerages | INTEGRATED |
| tradeDate / settlementDate | inv_stocks_iran_transactions | INTEGRATED |
| qty/price/fees | transactions + fee treatment | INTEGRATED |
| accountId | transactions.account_id | INTEGRATED |

## metals.buy

| API field | SoT | Status |
|-----------|-----|--------|
| quantityMg | inv_metals_holdings.quantity_mg + transactions | INTEGRATED |
| metal/premium/fee | transactions + journal treatments | INTEGRATED |
| platformId | inv_metals_platforms | INTEGRATED |

## Not yet implemented commands

Sell, transfer, swap, CA, distribution, delivery, etc. remain **SPEC_LOCKED only** until coded.
