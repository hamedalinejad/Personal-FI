---
id: DOC-AUTH-API
title: Mutation API Contract — Final Form
status: approved
version: 1.0
updated: 2026-09-10
---

# Required API contract

## Request

```json
{
  "operationId": "uuid",
  "type": "feature.operation",
  "businessDate": "YYYY-MM-DD",
  "baseCurrency": "IRR",
  "payload": {},
  "source": "ui|api|import|migration|system"
}
```

- Financial payload values: **decimal strings**.
- `businessDate` and `baseCurrency` are mandatory (no silent defaults).

## Result

```json
{
  "operationId": "uuid",
  "status": "posted",
  "commandHash": "sha256...",
  "domainResult": {},
  "journalSummary": {},
  "warnings": [],
  "errors": [],
  "idempotentReplay": false
}
```

Never expose a success result that cannot be reconciled with the persisted operation (`fin_operations` + journal + domain rows).

## Feature-specific minimum APIs

### Loan

`create`, `previewSchedule`, `generateSchedule`, `recordPayment`, `reversePayment`, `get`, `list`, `getSchedule`, `getStatement`

### Crypto

`buy`, `sell`, `transfer`, `deposit`, `withdraw`, `swap`, `bridge`, `airdrop`, `gift`, `opening`, `fee`, query holdings/transactions

### Stocks Iran

`buy`, `sell`, `settle`, `dividend`, `corporateAction.apply`, `brokerTransfer`, `writeOff`, query holdings/transactions

### Funds

`subscribe`, `redeem`, `distribution`, `reinvest`, ETF buy/sell, query holdings/transactions

### Metals

`buy`, `sell`, `deposit`, `withdraw`, `delivery`, `delivery.cancel`, query holdings/transactions

Runtime status is tracked per command in `docs/core/command-coverage/FEATURE-COMMAND-STATUS.md`.
