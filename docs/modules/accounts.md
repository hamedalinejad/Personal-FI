# Module: Accounts

**Owner:** this file · **Cash balance SoT:** FINANCIAL-CORE journal

## Purpose
Operational cash/bank accounts metadata and transfer UX; event log in acc_transactions is projection only.

## Critical separation
* **Accounting class** (asset/liability/equity/income/expense) on fin_accounts.account_kind  
* **Operational kind** (cash, bank_account, …) on operational account fields — never mixed enums

## Rules
* Archive only with zero journal balance (amount_in_base).
* No inventing accounts inside persistOperation.
* Standalone features still post to Core accounts via settlement.

## Deferred
Full Iranian bank field pack UI · multi-currency account pairs UI.
