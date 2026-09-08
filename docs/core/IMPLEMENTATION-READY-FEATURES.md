# Implementation-Ready — All Feature Slices

Loan detail: `IMPLEMENTATION-READY-LOAN-SLICE.md`  
Shared pattern for every domain.

## Shared rules

1. Commands → `runAtomicFinancialOperation` only
2. Money = decimal strings
3. Cash → `CashSettlementPort` only
4. Identity → `instrumentId` = `ref_instruments.id`
5. Package: `src/features/<id>/{public-api,commands,queries,domain,ledger,reports,ports,adapters,fixtures}`
6. No cross-feature internal imports

## Slice order

| Order | Feature | Package | First commands |
|-------|---------|---------|----------------|
| 1 | Loan | loan | create, recordPayment, getSchedule |
| 2 | Crypto | crypto | buy, sell, transferInternal, applyFee |
| 3 | Stocks Iran | stocks-iran | buy, sell, recordDividend, applyCA |
| 4 | Funds | funds | subscribe, redeem, reinvest |
| 5 | Metals | metals | buy, sell, physicalDelivery |
| 6 | Cheque | cheque | issue, deposit, clear, bounce |
| 7 | Income/Expense | cashflow | recordIncome, recordExpense, transfer |
| 8 | Reports | reports | trialBalance, balanceSheet, incomeStatement, cashFlow |

## Crypto

```ts
type CryptoBuy = {
  type: "crypto.buy";
  operationId: string;
  payload: {
    instrumentId: string;
    exchangeId?: string;
    networkId?: string;
    grossQuantity: string;
    feeQuantity?: string;
    netQuantity: string;
    feeRole?: "quote" | "base" | "received" | "network_burn";
    costTotal: string;
    costCurrency: string;
    businessDate: string;
    price?: string;
    priceAsOf?: string;
    externalTxId?: string;
  };
};
```

Must preserve: instrumentId, network, gross/net/fee, fee role, acquisition cost, FX, provenance.  
Acceptance: USDT-TRC20 ≠ USDT-ERC20; one fee allocation; C2C uses consideration.

## Stocks Iran

```ts
type StockBuy = {
  type: "stocks.buy";
  operationId: string;
  payload: {
    instrumentId: string;
    brokerageId: string;
    quantity: string;
    price: string;
    tradeDate: string;
    settlementDate?: string;
    commission: string;
    tax?: string;
    otherFee?: string;
    currency: string;
  };
};
```

Must preserve: ISIN/identity, broker, trade/settlement, fees, CA provenance.  
CA engine sole lot mutation owner.

## Funds

```ts
type FundSubscribe = {
  type: "funds.subscribe";
  operationId: string;
  payload: {
    instrumentId: string;
    units: string;
    nav: string;
    transactionPrice: string;
    amount: string;
    businessDate: string;
    currency: string;
  };
};
```

NAV may differ from transactionPrice. Reinvest = one op, distinct journal legs.

## Metals

```ts
type MetalsBuy = {
  type: "metals.buy";
  operationId: string;
  payload: {
    instrumentId: string;
    quantityMg: string;
    purityCode: string;
    purityRatio: string;
    metalPricePerMg: string;
    premiumAmount?: string;
    feeAmount?: string;
    currency: string;
    businessDate: string;
    platformId?: string;
  };
};
```

Fine weight = quantityMg × purityRatio. Premium separate from metal price.

## Cheque

```ts
type ChequeIssue = {
  type: "cheque.issue";
  operationId: string;
  payload: {
    amount: string;
    currency: string;
    sayadiId?: string;
    issueDate: string;
    dueDate: string;
    counterpartyId?: string;
  };
};
```

Events: issue → deposit → clear | bounce.

## Income / Expense

```ts
type Expense = {
  type: "expense.record";
  operationId: string;
  payload: {
    amount: string;
    currency: string;
    categoryId?: string;
    businessDate: string;
    accountFinId?: string;
  };
};
```

## DoD per feature

create/mutate posts journal; idempotency; decimal strings; no cross-imports; golden family green in CI.

## Journal sketch (all investment buys)

Disbursement-like buy (cash out):
- Cr cash (Port)
- Dr investment asset / holding clearing

Sell:
- Dr cash
- Cr investment asset
- Cr/Dr realized gain/loss (from cost basis engine)

Always: lines balanced; amounts decimal strings; one operationId.
