# Cross-Cutting Contracts Batch 3 (Funds / Metals / PA / Loan / Cheque / Budget / Goals / Wealth)

قفل‌های دامنه — در تعارض با Feature prose قدیمی این سند برنده است.

---

## 1. Fund redemption fee/tax ≠ realized return ≠ distribution income

برای Fixed Income Funds / ETF:

| Component | Meaning | P&L bucket |
|-----------|---------|------------|
| Redemption / subscription **fee** | هزینه معامله واحد | fee expense / reduce proceeds — **not** distribution income |
| Redemption **tax** / withholding on exit | transaction or withholding cost | feeTax / withholding metadata — **not** NAV return |
| **Realized return** on units | sell/redeem vs averageBuyPrice (cost basis) | realizedPnL on units |
| **Distribution income** | type=dividend cash (or reinvest pair) | distributed / reinvested income |

**ممنوع:** جمع کردن redemption fee یا feeTax داخل distribution income یا به‌عنوان «سود صندوق».

---

## 2. Metals physical delivery → Physical Asset cost basis

`physical_delivery` (P0-063) هنگام ایجاد/لینک `pa_assets`:

```text
carryingCostTransferred = cost basis released from metals holding
  (weighted average / method on that holding for quantity delivered)
deliveryFee → separate cash (not added to PA cost unless policy include_delivery_fee_in_basis = true; default false)
```

- PA acquisition leg: cost = carrying cost released از Metals (historical), نه قیمت روز تحویل.
- `sourceOperationId` + quantity + costCurrency صریح روی `pa_transactions`.
- بدون این، lineage و P&L بعدی PA غلط است.

---

## 3. Physical asset revaluation ≠ automatic realized P&L

- `revaluation` / mark-to-market: فقط `currentValue` (و audit valuation event).
- **Realized P&L** فقط از `sale` یا `write_off` (با carrying released) — مگر policy صریح `revaluation_realizes = true` (پیش‌فرض **false**، v1 ایران معمولاً false).
- Unrealized = currentValue − carrying cost؛ جدا از realized.

---

## 4. Loan: accrued interest unpaid ≠ principal ≠ cash payment

| Concept | Field / state |
|---------|----------------|
| Principal outstanding | schedule / loan balance principal |
| Interest accrued unpaid | accrual ledger / `accruedInterest` |
| Cash payment | payment allocation: principal + interest + fee + penalty portions |

Accrual بدون cash **journal/schedule state** است نه کاهش خودکار principal. Payment op جدا allocation می‌کند.

---

## 5. Loan: fee due vs fee paid — independent amounts

```text
feeDue (scheduled / assessed)
feePaid (sum of allocations from payments)
feeOutstanding = feeDue - feePaid  (per fee type or aggregate per policy)
```

دو state/amount مستقل؛ یکی فرض کردن due=paid ممنوع. Waive جدا (`feeWaived`).

---

## 6. Loan payment reversal reverses schedule allocation

Reverse payment (Core reverse):

1. Reverse cash / journal legs.
2. **Reverse schedule allocation** (principal/interest/fee/penalty portions همان payment).
3. Restore schedule remaining / accrued state به قبل از payment.
4. یک `operationId` reverse؛ نه orphan allocation.

---

## 7. Cheque clear / bounce — preserve payment & effective cash dates

| Event | Dates to preserve |
|-------|-------------------|
| Issue | issueDate, dueDate |
| Clear | `clearedDate` / `paymentDate`, `effectiveCashDate` (when bank cash moves) |
| Bounce | `bouncedDate`, link to reverse/clear reversal; **original due/payment attempts not erased** |

Clearing و bounce تاریخ‌های قبلی را overwrite نمی‌کنند؛ event جدید + status.

---

## 8. Budget ↔ cheque spending timing — one policy

```text
budgetChequeRecognition:
  'on_pending'   // reserve/spend when cheque issued/pending
  | 'on_cleared' // only when cleared (default recommended for cash-basis feel)
```

- یک policy سراسری (budget settings)؛ نه per-cheque بی‌قانون.
- Pending recognition در صورت `on_pending` باید با bounce/cancel آزاد شود (release envelope).

---

## 9. Goals v1 = earmark (unless dedicated cash account)

- **Default v1:** Goal = **earmark** روی progress (`fg_contributions`); پول در bank/venue عمومی می‌ماند مگر:
  - `fundingMode = segregated_cash` و `dedicatedAccountId` به یک fin_account اختصاصی.
- `source=budget|income` همیشه earmark (بدون جابه‌جایی نقد جدید).
- `source=manual|transfer` فقط وقتی segregated یا transfer واقعی به dedicated account.
- UI باید «برچسب هدف» در برابر «حساب جدا» را نشان دهد.

---

## 10. Portfolio wealth — liability scope

`calculateWealthView` / net wealth:

```text
liabilityScope:
  'principal_only'           // loan principal outstanding only
  | 'principal_plus_accrued' // + unpaid accrued interest
  | 'full_carrying'          // + fees due, penalties outstanding (documented)
```

- Default مستند (پیشنهاد: `principal_plus_accrued` برای ثروت محافظه‌کارانه، یا `principal_only` برای سادگی v1 — **باید در API صریح باشد**).
- خروجی typed شامل `liabilityScope` تا UI اشتباه برچسب نزند (هم‌راستا با cashScope P0-081).

---

## Checklist

1. Fund fee/tax vs realized vs distribution separated  
2. Metals→PA delivery transfers historical carrying cost  
3. PA revaluation does not realize by default  
4. Loan accrued interest distinct from principal and cash  
5. feeDue vs feePaid independent  
6. Payment reverse undoes schedule allocation  
7. Cheque clear/bounce keep date history  
8. budgetChequeRecognition single policy  
9. Goals v1 earmark default  
10. liabilityScope on wealth view  

