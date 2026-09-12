---
id: DOC-AUTH-INV-CASH
title: Investment cash via CashSettlementPort only
status: locked
version: 1.0
---

# P0-INV-001

**Forbidden as cash SoT tables:**  
`inv_crypto_exchange_transactions`, `inv_stocks_iran_brokerage_transactions`, `inv_metals_platform_transactions`, any `inv_*_cash` balance ledger.

**Required path:** Feature DomainCashEvent → `CashSettlementPort` → `fin_accounts` + `fin_journal_lines`.

Venue-specific projections may store **non-cash** event facts only.
