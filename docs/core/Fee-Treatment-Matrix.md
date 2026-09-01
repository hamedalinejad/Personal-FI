# Fee Treatment Matrix (سراسری)

| Field | |
|-------|--|
| feeAsset | |
| feeAmount | |
| feeTreatment | accounting (expense, cost_basis_in, proceeds_reduction, fee_burn, capitalize, …) |
| feeIncludedInQuantity | bool — آیا qty دریافتی net است؟ |
| feeIncludedInCost | bool |
| feeIncludedInCash | bool |

## Quantity modes (crypto و mapپذیر)

| Mode | Received qty | Fee |
|------|--------------|-----|
| fee_from_received | gross − fee | same asset |
| fee_from_base_asset | gross full | از موجودی پایه جدا |
| fee_in_quote | full base qty | quote currency |
| fee_external | full | خارج از trade |

Feature invent نمی‌کند — CanonicalFeeEvent + این ماتریس.


## Loan tiered fees SoT

```text
ln_loan_fee_tiers = تنها SoT پلکان
ln_loan_fees.tiers JSON = Legacy / Migration Only — write جدید ممنوع
```

---

## Core Fee Engine (P0)

Fee فقط loan/crypto/stock نیست. در محصول لایسنسی همه جا ظاهر می‌شود:

Bank · Loan · Broker · Exchange · Network · Fund · Delivery · Withdrawal · Subscription · Tax-like charge

```text
Core Fee Engine
  ├── Fee Policy
  ├── Fee Calculation
  ├── Fee Allocation
  └── Fee Accounting Treatment
         ↑
    Crypto / Stocks / Funds / Loans / Metals / Banking
```

هر Feature فقط **policy** خودش را تعریف می‌کند؛ محاسبه و ثبت حسابداری از Core می‌آید.

`feeAmount` (total) همیشه حفظ می‌شود حتی وقتی breakdown وجود دارد:

```text
feeAmount = total (canonical sum)
feeBrokerCommission / feeExchange / feeTax / feeOther = breakdown اختیاری
```

داده قدیمی با فقط `feeAmount` معتبر می‌ماند. هیچ فیلدی به‌خاطر schema جدید DROP نمی‌شود.

---

## Tax-like charges در Fee Engine (P0)

مالیات نقل‌وانتقال سهام (مثلاً نرخ مقرراتی ۰.۵٪ / ۰.۰۱٪ طبق قانون جاری — **نسخه‌دار در IranCore/Fee policy**) و در آینده عایدی سرمایه کریپتو/طلا:

```text
feeCategory = tax   (یا tax_like)
accountingTreatment = tax
```

- از ورود دستی تکراری جلوگیری می‌شود: policy نرخ + base محاسبه → FeeAPI
- `feeTax` روی trade = هزینه همان معامله است
- رکورد دوره‌ای `tax_events` جدا می‌ماند (feeTax ≠ tax return)

نرخ‌ها **hard-code در Feature نیستند**؛ versioned config (IranMarketFees / Fee Policy).
