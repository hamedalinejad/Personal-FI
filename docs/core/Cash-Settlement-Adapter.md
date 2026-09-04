# Cash Settlement Adapter (P0) — P0-FIX-001 locked

> **Invariant:** Features never depend on Accounts UI tables for cash **truth**.  
> **Cash SoT always** = `fin_accounts` + `fin_journal_lines`.  
> Adapters only choose **which** `fin_accounts` row is debited/credited.

## Goal

Loan-only / Crypto-only / Fund-only editions work without full banking UI.

## Mandatory pattern

```text
Loan / Crypto / Stock / Fund / Metal
              ↓
     CashSettlementPort  (Core interface)
              ↓
    ┌─────────┴──────────┐
    │                    │
AccountsCashAdapter    LocalSettlementAdapter
    │                    │
resolve bank-linked    resolve edition-local
fin_accounts row       fin_accounts row
    │                    │
    └─────────┬──────────┘
              ↓
   fin_journal_lines  (ONLY cash balance truth)
              ↓
   optional projection (acc_transactions / inv_*_cash view)
   NEVER a second balance SoT
```

### Naming (P0-FIX-001)

| Name | Meaning |
|------|---------|
| `CashSettlementPort` | interface |
| `AccountsCashAdapter` | picks Core cash account linked to bank UX |
| `LocalSettlementAdapter` | picks Core cash account for standalone edition |
| Local Settlement **Account** | a **`fin_accounts`** row — **not** a feature-owned cash ledger |

**Forbidden wording:** “local cash ledger”, “feature cash balance SoT”, “LocalSettlementAdapter writes feature table as truth”.

## Port (minimum)

```text
CashSettlementPort
  postDebit(params)   // journal lines on fin_accounts
  postCredit(params)
  getAvailableBalance?(accountRef)  // derived from journal/lines only
  resolveAccountRef(ref)
```

All calls inside `runAtomicFinancialOperation`.

## Two modes — same ledger

| Mode | Adapter | Account resolution | Truth |
|------|---------|-------------------|--------|
| Accounts UI on | AccountsCashAdapter | bank-linked `fin_accounts` | journal lines |
| Standalone edition | LocalSettlementAdapter | edition default `fin_accounts` (systemRole e.g. `local_settlement_cash`) | **same** journal lines |

Both always emit balanced journal. Standalone UI ≠ second ledger.

## Editions

| Edition | Adapter | Cash SoT |
|---------|---------|----------|
| Full app | AccountsCashAdapter | journal |
| Loan-only | LocalSettlementAdapter | journal |
| Crypto-only | LocalSettlementAdapter | journal |
| Fund-only | LocalSettlementAdapter | journal |

## Control test (required)

```text
Loan-only or Crypto-only:
  post payment/buy via LocalSettlementAdapter
  → rebuild cash from fin_journal_lines
  → local projection (if any) MUST equal journal balance
  → zero drift
```

## P0-FIX-001 Done criteria

- No doc/table/sample presents a feature-local cash balance as SoT.
- LocalSettlementAdapter prose only mentions Core `fin_accounts` + `fin_journal_lines`.

## P0-DOC-001 — No second cash truth

```text
CashSettlementPort / LocalSettlementAdapter / AccountsCashAdapter
  = routing only (which fin_accounts.id receives journal lines)

NEVER:
  feature-owned cash ledger as balance SoT
  inv_*_cash.balance as independent truth
  “local settlement ledger” outside fin_accounts
```

Local settlement account **is** a `fin_accounts` row (e.g. systemRole `local_settlement_cash`).  
Feature cash tables = **projection** with optional `finAccountId` FK; rebuild from journal.
