# Data-Model-Relationship-Matrix

```text
acc_accounts
  └── acc_transactions
        └── acc_transaction_links → domain events

fin_accounts
  └── fin_journal_lines ← fin_journal_entries ← fin_operations
                                              ├── domain txs (inc/exp/inv/ln/…)
                                              ├── cash (acc_transactions)
                                              └── audit (fin_audit_log)

ref_instruments
  ├── inv_crypto_holdings (+ inv_crypto_cash)
  ├── inv_stocks_iran_holdings
  ├── inv_fif_holdings
  └── inv_metals_holdings

ref_parties → income/expense/loan/cheque
docs_documents → docs_links → any entity
```

FK واقعی جایی که ممکن؛ polymorphic فقط از طریق links + validate.

## P2

Dependency/ER diagrams in docs **must** be generated from this matrix (and Domain-Dependency-Matrix). Hand-maintained diagrams that diverge are invalid.
