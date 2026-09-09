# Journal Line Contract (FINAL v1)

## Required persist fields

accountId, side, amount, currency, line_number  

## Required when multi-currency / historical FX

amountInBase, exchangeRateToBase, conversionPath  

## Optional classification

lineKind, memo, reference, source_type, source_reference  

## Balance

- Same currency, no base fields: Σ debit(amount) = Σ credit(amount)  
- Any amountInBase present: all lines must have amountInBase; Σ debit(base) = Σ credit(base)  
- Multi-currency without base → reject  

Persistence must not drop optional/canonical fields when provided.
