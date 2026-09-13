---
id: DOC-REL-TABLES
title: Major Table Relationships
status: approved
version: 1.0
updated: 2026-09-10
---

# Final intended table relationships

## Accounting

```text
fin_accounts → fin_journal_lines → fin_journal_entries → fin_operations
```

- `fin_operations` = operation identity / orchestration  
- Journal = accounting truth  

## Accounts (banking surface)

```text
acc_accounts → acc_transactions → acc_transaction_links
```

`acc_transactions` is event/projection — **not** second cash truth. Cash SoT remains Core journal via CashSettlementPort.

## Instruments

```text
ref_instruments
  ├── crypto
  ├── stocks
  ├── funds
  └── metals
```

No feature may create a second identity graph.

## Crypto

```text
ref_instruments → inv_crypto_exchanges → network/wallet → inv_crypto_holdings
  → inv_crypto_transactions → fin_operations / journal
Cash: CashSettlementPort → Core journal
```

Holding key: `exchange + network + instrument`.

## Stocks

```text
ref_instruments → inv_stocks_iran_instruments → brokerage → holdings → transactions
  → corporate actions → journal/cash
```

Holding key: `brokerage + instrument`.

## Funds

```text
ref_instruments → inv_fif_funds → holdings → transactions → NAV/market valuation → journal/cash
```

Holding key: `account/portfolio + instrument` (account_id nullable only for true standalone).

## Metals

```text
ref_instruments → platform → holdings → transactions → physical delivery → physical asset
```

Holding key: `platform + instrument` (extend with account when multi-account metals ships).
