# 07 fixtures release gate

## مرز مستند در برابر Runtime

مستندات **قرارداد** هستند، نه اثبات اجرای صحیح در production.

تا وقتی برای مسیرهای زیر **تست/fixture اجرایی** وجود نداشته باشد، صحت محاسبات تضمین runtime ندارد:

BUY/SELL، C2C، Transfer+fee، Loan installment، Fund NAV vs redemption، Stock CA، reconcile/repair.

Checklist پیاده‌سازی + تست در `core/reconciliation` fixtures و unit تست Domain اجباری قبل از ادعای «آماده استفاده مالی» است.

### Numerical Fixtures اجباری (Must Have قبل از release مالی)

**Release blocker:** بدون سبز بودن این مجموعه در CI، مسیر مالی «تأییدشده» اعلام **نشود**. مستند ≠ اثبات runtime.

مسیر: `tests/fixtures/financial/**/*.json` + runner روی Domain / CostBasisEngine / Journal / Loan formulas (نه mock UI).

هر fixture:
```json
{
  "id": "crypto_bridge_fee",
  "inputs": { },
  "steps": [ ],
  "expected": {
    "holdings": {},
    "realizedPL": null,
    "journal": { "balanced": true, "lines": [] },
    "operationStatus": "persisted"
  }
}
```
مقادیر مالی **string** decimal.

#### Crypto
| ID | سناریو | assert |
|----|--------|--------|
| `crypto_buy_then_buy_sell` | BUY → BUY → SELL partial | qty, avg, realizedPL, journal |
| `crypto_buy_fee_quote` | fee USDT | cost includes feeIn |
| `crypto_buy_fee_base` | fee from BTC | netQty |
| `crypto_c2c` | ETH→BTC | transferredCost نه market |
| `crypto_transfer_internal_fee` | internal + fee_burn | Σ qty, PL=0 |
| `crypto_bridge` | 100→fee1→99 other assetKey | transferredCost=99/100 pool |
| `crypto_external_sale` | proceeds+FX | realizedPL, no fake cash unless deposit |
| `crypto_external_receive` | opening/receive + cost | acquisition |
| `crypto_opening_position` | migration | equity journal |

#### Stocks
| ID | سناریو | assert |
|----|--------|--------|
| `stock_buy_sell` | | cost, realized |
| `stock_dividend` | gross/withholding/net | income ≠ capital gain |
| `stock_split` | 1:2 | qty×2 invested same |
| `stock_bonus` | | |
| `stock_rights` | issue+exercise | |
| `stock_ca_transfer` | instrumentId change | rebuild |

#### Funds
| ID | سناریو | assert |
|----|--------|--------|
| `fif_sub_ne_nav` | buy @ subscription ≠ NAV | avg from transactionPrice |
| `fif_redemption_ne_nav` | sell @ redemption | realized from price not NAV |
| `fif_distribution` | dividend | income leg |
| `fif_reinvest` | dual leg same operationId | units+cost+income |

#### Loans
| ID | سناریو | assert |
|----|--------|--------|
| `loan_declining` | getPeriodRate | portions sum |
| `loan_flat` | | totalInterest |
| `loan_qarz` | | principal schedule |
| `loan_bullet` | | |
| `loan_grace` | gracePeriods | interest-only then amort |
| `loan_early_payment` | schedule snapshot version | remaining rebuild |

#### Currency
| ID | سناریو | assert |
|----|--------|--------|
| `fx_direct` | | |
| `fx_inverse` | | |
| `fx_multi_hop` | path locked | amountInBase immutable |
| `fx_base_change` | report as-booked vs restated | |

#### Accounting
| ID | سناریو | assert |
|----|--------|--------|
| `journal_balanced` | any buy | Σ debit=credit base |
| `reversal_balanced` | reverseOperation | **domain + cash + journal + tax + snapshot** همه inverse/void |
| `persist_retry_success` | SQL posted → IDB fail → pendingCommit → reboot → retry → durable | holdings intact; UI saved only after durable |
| `persist_retry_fail_recover` | retries fail → persist_failed → user recover path | no silent data loss; marker visible |
| `opening_balanced` | opening_position | Dr asset Cr equity/income |
| `fee_burn_balanced` | | expense + asset credit |
| `bank_transfer_neutral` | | no income/expense |

#### Property / Invariant Tests (Must — علاوه بر expected ثابت)

Runner: random یا parameterized seeds روی قوانین؛ fail اگر invariant نقض شود.

| ID | Property |
|----|----------|
| `prop_internal_transfer_conservation` | بدون fee: Σ qty(assetKey) before = after روی همه locationهای کاربر |
| `prop_bridge_cost_split` | releasedCost = transferredCost + feeBurnCost |
| `prop_reversal_involution` | apply(op); apply(reverse(op)) ≈ state قبل از op (domain+journal+snapshots) |
| `prop_stock_split_cost` | qty' = qty×ratio؛ totalInvested ثابت |
| `prop_journal_balance` | ∀ operationId posted: Σ debit amountInBase = Σ credit amountInBase |
| `prop_opening_reverse_delta` | opening + reverse(opening) → economic delta صفر (به‌جز void markers) |
| `prop_idempotent_operationId` | دو submit با همان operationId+commandHash → یک نتیجه |
| `prop_fee_burn_pl_zero` | fee_burn ⇒ realizedPL contribution = 0 |

#### Cross-Feature Chains (Must)

| ID | زنجیره | assert |
|----|--------|--------|
| `xf_bank_to_exchange_buy` | Bank withdraw → exchange cash → BUY crypto | journal+acc+holding؛ بدون double count |
| `xf_bank_broker_stock` | Bank → brokerage cash → stock BUY | |
| `xf_bank_fif_reinvest` | Bank → subscription → distribution → reinvest | operationIds و income+units |
| `xf_loan_disburse_invest` | Loan disbursement → bank → investment | liability+cash+asset |
| `xf_crypto_sell_withdraw_bank` | SELL on exchange → withdraw to bank | domain sale + cash legs + journal balanced |
| `xf_transfer_neutral_chain` | bank A→B then expense | transfer not in income/expense totals |

#### Reliability / Persistence Fixtures (Must — کلاس جدا از محاسبات)

| ID | جریان | assert |
|----|--------|--------|
| `persist_retry_success` | posted → IDB fail → `db_meta.pendingCommit` → reboot → retry swap → durable | data + operation نتیجه idempotent؛ DomainEvent فقط بعد durable |
| `persist_retry_fail_recover` | N fail → user intervention / recover | status/marker شفاف؛ بدون overwrite کور |
| `idempotent_double_click` | same operationId+commandHash twice | یک op |
| `idempotent_conflict` | same operationId, different commandHash | IDEMPOTENCY_CONFLICT |

#### Reversal full stack
`reversal_balanced` برای هر xf_* نمونه (حداقل `xf_bank_to_exchange_buy` و `xf_crypto_sell_withdraw_bank`):
```text
assert domain inverse
assert cash inverse (acc_transactions void/reverse)
assert journal Σ base = 0 net after pair
assert tax_events active → voided/reversed
assert snapshots = rebuild from ledger
```

**CI gate:** job `financial-fixtures` (numeric + property + cross-feature + **reliability**) must pass on main before financial release tag.



### Invariant: Transfer Accounting-neutral

هر journal با `lineKind`/`accountClass` مربوط به transfer (جابه‌جایی بین حساب‌های خود کاربر یا معادل asset-location):
- نباید در totals درآمد/هزینه ظاهر شود
- نباید `accountClass` برابر `income` یا `expense` برای اصل مبلغ باشد
- Journal Engine / validate قبل از COMMIT این را enforce می‌کند

---

## Checklist رفع تناقض‌های ذخیره و Journal (تأیید در spec)

| # | موضوع | وضعیت |
|---|--------|--------|
| 1 | Amount = decimal string SoT | ✅ |
| 2 | Journal: فقط `accountClass` + `lineKind` (بدون accountClass) | ✅ |
| 3 | FeeTreatment: فقط `proceeds_reduction` | ✅ |
| 4 | جداول fin_operations, ref_instruments, ln_schedule_snapshots, ln_loan_collateral, acc_transaction_links در لیست مرکزی | ✅ |
| 5 | `acc_transaction_links` **Must** + UNIQUE | ✅ |
| 6 | getPeriodRate + dayCountConvention/yearBasis | ✅ در Loan doc |
| 7 | grace ROUND_DOWN عمدی | ✅ |
| 8 | AssetCategory شامل physical/cash/other | ✅ types.md |
| 9 | Loan v1 بدون balloon/step_up؛ annuity=alias UI | ✅ |
| 10 | ln pay: ردیف‌های جدا + invariant | ✅ |
| 11 | فازبندی MVP Product-Map | ✅ |
| 12 | گزارش کلی فقط journal (`vw_financial_report` / getFinancialReport) | ✅ Must |


## B-006 — Mandatory fixture families (CI target)

| Family | Path pattern | Min green before Feature writers |
|--------|--------------|----------------------------------|
| Core income/expense/transfer/reversal | GOLDEN-CORE-* | YES |
| Crypto fee + C2C + bridge + PnL attribution | GOLDEN-CRYPTO-* / CRITICAL-* | YES for crypto commands |
| Stocks buy/sell + CA + T+2 | GOLDEN-STOCK-* | YES for stocks |
| Funds NAV vs tx / reinvest | GOLDEN-FUND-* | YES for funds |
| Loan qarz / flat / declining / reverse | GOLDEN-LOAN-* | YES for loan |
| Cheque bounce | GOLDEN-CHEQUE-* or STANDALONE | YES for cheque |
| Offline recovery | GOLDEN-RECOVERY-OFFLINE | YES for sync |

Gate: `OPEN-004` / CODING-GATE — family green = expected domain+journal+cash+holding+cost+PnL strings pass harness.
