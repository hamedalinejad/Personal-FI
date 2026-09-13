> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.


## Status vocabulary (B-031)

| Term | Meaning |
|------|---------|
| **READY TO IMPLEMENT** | Spec/contracts are locked enough to code against |
| **PARTIAL** | Some runtime commands exist; not feature-complete |
| **IMPLEMENTED** | Public API surface complete for claimed edition |
| **RELEASE-PROVEN** | Gates green (tests, fixtures, recovery, no-field-loss) |

`READY TO IMPLEMENT ≠ IMPLEMENTED ≠ RELEASE-PROVEN`.

**Gate:** Parallel production packages for Crypto/Stocks/Funds/Metals are forbidden until Loan is RELEASE-PROVEN. Scaffold-only work may exist under that constraint.

# Implementation-Ready — All Feature Verticals

**Coding status:** READY to implement using Loan as the **template pattern**.  
**Production ship:** still requires CI green + recovery evidence on release branch.

## Shared pattern (copy from Loan)

```text
src/features/<name>/
  package.json
  public-api/index.js
  commands/*.js
  queries/*.js
  domain/
  ledger/
  ports/
  adapters/
  fixtures/
  tests/
```

Every money command: `operationId` required · Decimal strings · journal via `runAtomicFinancialOperation` · one SQLite txn · no cross-feature private imports.

## Order (recommended parallelization)

| Stream | Owner focus | Depends on |
|--------|-------------|------------|
| A | Loan polish + recovery CI | Core |
| B | Crypto | Core + CostBasis + CashPort |
| C | Funds | Core + CostBasis |
| D | Stocks Iran + CA | Core + CostBasis + CA engine |
| E | Metals | Core + CostBasis |
| F | Cheque / Accounts UI | Core journal |

Streams B–E may start **in parallel** after reading Loan package; they must not invent a second cash/journal.

---

## Crypto v1 commands

| Command | Required payload |
|---------|------------------|
| `crypto.buy` | operationId, instrumentId, exchangeId?, networkId?, grossQuantity, feeQuantity, netQuantity, feeRole, costTotal, costCurrency, price, priceAsOf, businessDate, currency |
| `crypto.sell` | same shape + proceeds |
| `crypto.swap` | sourceInstrumentId, destInstrumentId, consideration, feeRole… (C2C economic) |
| `crypto.transfer` | internal: realizedPL=0, cost moves |
| `crypto.deposit` / `withdraw` | quantity, fee, externalTxId |
| `crypto.airdrop` | quantity, cost=0 policy |
| `crypto.opening` | opening balance |

Identity: `ref_instruments.id`. USDT-TRC20 ≠ USDT-ERC20.

## Stocks Iran v1

| Command | Notes |
|---------|-------|
| `stocks.buy` / `sell` | tradeDate ≠ settlementDate, commission/tax/otherFee |
| `stocks.settle` | T+2 cash stage |
| `stocks.ca.apply` | only CA engine mutates holdings |

## Funds v1

| Command | Notes |
|---------|-------|
| `fund.subscribe` | cost uses **transactionPrice** |
| `fund.redeem` | |
| `fund.reinvest` | one op: income leg + subscription leg |
| Valuation | may use NAV; NAV ≠ transactionPrice |

## Metals v1

| Command | Notes |
|---------|-------|
| `metals.buy` / `sell` | grossWeight, purityRatio, fineWeight=gross×purity, premium **separate** |
| `metals.delivery` | to Physical Assets lineage |

## Cheque v1

Lifecycle: draft→issued→deposited→cleared|bounced. Partial clear rejected.

## Acceptance per feature

```text
SPECIFIED → IMPLEMENTED → INTEGRATED → GOLDEN-GREEN → RECOVERY-GREEN → RELEASE-PROVEN
```

Do not claim RELEASE-PROVEN without fixtures + recovery tests.
