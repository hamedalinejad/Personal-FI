# Unit Policy

Currency ≠ Unit of measure.

| Canonical unit | کاربرد |
|----------------|--------|
| money codes (IRR, USD, …) | مبالغ |
| BTC/ETH… qty | از instrument.decimals |
| `share` | سهام |
| `fund_unit` | صندوق |
| `mg` | فلزات (ذخیره) |
| gram/ounce | **فقط نمایش** از mg |

**ممنوع:** اشتباه گرفتن `quantity` (تعداد/وزن) با `amount` (پول) یا `price` با `pricePerMg` بدون unit در قرارداد فیلد.

---

## Instrument unit registry (جدا از Currency)

Currency = denomination پول.  
Instrument مشخص می‌کند:

```text
unit
scale / precision
minQuantity
minNotional
priceUnit
fractionalAllowed?
```

| مثال | unit |
|------|------|
| طلا | mg (+ purity) |
| BTC | BTC precision 8 |
| سهم | share |
| صندوق | unit |

مرکز: `ref_instruments` + Unit-Policy — نه فرض «quantity = decimal کافی است».
