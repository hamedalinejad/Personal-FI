# Accounting Calculation Invariants (قفل ریاضی)

کوچک‌ترین ابهام در فرمول = باگ حسابداری. این سند بر هر توضیح قدیمی‌تر اولویت دارد.

---

## 1. پول و دقت

```text
همه amount/quantity/price/rate در DB = TEXT decimal string
محاسبه فقط decimal.js (یا معادل)
گرد کردن نمایشی فقط UI — DB بدون UI-round
```

---

## 2. FX — معنی نرخ (رفع تناقض)

### نرخ ذخیره‌شده در `cur_exchange_rates` (canonical)

```text
1 × fromCurrency = rate × toCurrency
```

مثال: from=USDT, to=IRR, rate=60000 → ۱ USDT = ۶۰٬۰۰۰ IRR.

```text
amount_to = amount_from × rate
amount_from = amount_to / rate
```

**Deprecated / ممنوع در کد جدید:** تفسیر قدیمی «مقدار From به ازای ۱ To» با فرمول `amountTo = amountFrom / rate` بدون direction — مستعد معکوس شدن نرخ.

### نرخ روی Operation: `exchangeRateToBase`

```text
semantic name: basePerTransactionUnit
1 × transactionCurrency = exchangeRateToBase × baseCurrency

amountInBase = amount × exchangeRateToBase
```

`amountInBase` پس از post **immutable** است؛ rebuild از rate فعلی ممنوع.

---

## 3. Journal دوطرفه

برای هر `operationId` با status posted:

```text
Σ amountInBase(debit) = Σ amountInBase(credit)
```

بدون line متوازن → COMMIT مالی ممنوع.

| Event | Debit | Credit |
|-------|-------|--------|
| Expense (cash) | Expense | Cash |
| Income | Cash | Income |
| Borrow disbursement | Cash | Loan liability |
| Loan payment (borrowed) | Liability (prin) + InterestExp + FeeExp + Penalty | Cash |
| Lend disbursement | Receivable | Cash |
| Loan receipt (lent) | Cash | Receivable (prin) + InterestInc + … |
| Asset buy | Asset | Cash (+ FeeExp if expensed) |
| Asset sell | Cash | Asset (at cost) + Realized PL |
| Internal transfer same currency | Cash dest | Cash src |
| Custody transfer asset | Asset@locB | Asset@locA (same cost) |

---

## 4. Cash balance

```text
ledgerBalance(account) = Σ signed cash movements (non-void) from ops
snapshot.currentBalance = rebuild(ledger)   // never independent write
```

---

## 5. Cost basis (WAC v1)

Per `holdingId` + `costCurrency`:

```text
acquisition:
  qty' = qty + q_in
  cost' = cost + cost_in   // fees per Fee matrix

disposal (WAC):
  avg = cost / qty
  cost_out = avg × q_out
  qty' = qty - q_out
  cost' = cost - cost_out
  realized = proceeds_net - cost_out   // sign per convention

fee paid in asset (burn):
  qty' = qty - fee_qty
  cost pool: policy versioned — default v1: cost unchanged (cost/unit rises)
  // NEVER silently set cost = 0
```

### Custody transfer (exchange → wallet)

```text
qty moves; cost moves; acquisition lots/dates preserved
realized P&L = 0 (ex network fee treatment)
Net Worth Δ = 0 except explicit fee expense
```

---

## 6. Loan math

### Remaining contractual principal

```text
remainingPrincipal -= principalPortion_only
// interest, fee, penalty do NOT reduce remainingPrincipal
```

Accrued unpaid interest is **separate** state (schedule / accrued components) — not mixed into `remainingPrincipal`.

### Payment one operation

```text
cash_out = principalPortion + interestPortion + feePortion + penaltyPortion
```

Allocation order (policy, default):

```text
penalty → fee → interest → principal
```

Partial installment: track unpaid residual per component; not only boolean paid.

### Schedule engines (names)

| method | رفتار |
|--------|--------|
| declining_balance | سود روی مانده؛ قسط می‌تواند ثابت (annuity formula) باشد |
| flat_rate | سود کل از اصل اولیه؛ اصل/سود تقریباً ثابت در قسط |
| bullet | اصل در انتها؛ سود دوره‌ای طبق policy |
| qarz_al_hasaneh | بدون سود قراردادی؛ فقط کارمزد/fee lines |

Day-count و roundingVersion روی schedule snapshot hash می‌شوند.

---

## 7. Funds

```text
cost basis & realized  ← transactionPrice (subscription/redemption price)
valuation / unrealized ← NAV (and/or liquidation value)
NAV ≠ transactionPrice ≠ liquidationValue
```

Period P&L: opening value + flows + realized − closing — **not** “dump current unrealized into historical period”.

---

## 8. Metals

```text
fineWeightMg = quantityMg × purityRatio
valuation uses fine weight × price per pure unit (policy)
purityAtAcquisition snapshot for historical reports
```

---

## 9. Reversal exact inverse

```text
Original: +A cash, fee F
Reversal: −A cash, reverse fee F
```

**Not** approximate. Posted rows not edited; new reverse operation + links.

Cheque after clear then bounce = reverse cash op — not `UPDATE amount`.

---

## 10. Conservation

| Invariant | |
|-----------|--|
| Journal | debit = credit (base) |
| Same-currency transfer | src + dest + fee legs = 0 economically |
| Custody transfer | total qty economic conserved |
| NW on pure transfer | Δ = 0 |
| Historical | f(op, calcVersion, priceAsOf, fxAsOf) deterministic |

---

## 11. Toman display

```text
storage always IRR
displayToman = amountIRR / 10   // UI only
never store mixed rial/toman in same column without currency
```

## FX (X-008 / X-009 / X-010)

- Canonical rate field: `exchangeRateToBase`; UI «نرخ تتر» is label only when applicable.
- P&L in base should attribute asset price vs FX vs fee vs cash-flow effects where multi-currency.
- Historical reports use asOf + priceAsOf + fxAsOf (+ settlement cutoff); never latest market data for past dates.

## P0-FINAL-005…008

Attribution Algorithm v1, FX Conversion Path v1, PriceSelectionPolicy v1, FxSelectionPolicy v1: `P0-FINAL-005-010-LOCKS.md`.

