---
id: DOC-LOAN-EARLY-MATRIX
title: Early settlement / re-amortization matrix
status: approved
version: 1.0
---

# LOAN-004 — single contract

Dimensions:

```
method × earlyPaymentMode × rateType × feePolicy × graceState
```

| method | earlyPaymentMode | rateType | feePolicy | graceState | Schedule effect | Accounting |
|--------|------------------|----------|-----------|------------|-----------------|------------|
| declining_balance | reduce_term | fixed | none | none | Recompute remaining periods; residual principal ↓ | Payment allocation → principal first after interest due |
| declining_balance | reduce_installment | fixed | none | none | Keep term; lower installment | Same |
| declining_balance | any | fixed | prepayment_fee | none | Fee event separate operation/component | Fee journal + fee_portion |
| flat_rate | any | fixed | * | * | No silent re-amortize; residual tracked | Explicit adjustment op if needed |
| bullet | early_full | fixed | * | * | Close principal + accrued | Full settlement op |
| * | * | * | * | in_grace | Grace policy from loan row; no invent | |

**Rule:** Combinations not listed are `LOAN_EARLY_COMBO_UNSUPPORTED` — no silent guess.
