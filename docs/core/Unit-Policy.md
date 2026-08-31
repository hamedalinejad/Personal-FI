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
