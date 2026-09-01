# Rounding Policy

---

## ایران — قوانین گرد کردن جدا

| دامنه | Mode | Precision |
|--------|------|-----------|
| IRR money (بانک/ledger) | **HALF_UP** | 0 (ریال صحیح) |
| قیمت سهام بورس | **ROUND_DOWN** به ریال | طبق priceTick |
| Crypto quantity | از `instrument.decimals` (تا **18**) | نه global 2 |
| Stock quantity | lot / تا **4** در صورت نیاز | |
| USDT/USD | 2–6 طبق registry | |

**یک Decimal.set سراسری برای همه دامنهها کافی نیست** — PrecisionPolicy per domain.

IRR canonical storage؛ تومان فقط `isTomanDisplay` UI — نه دو currency.

---

## roundingPolicyVersion (P0)

Policy فعلی (IRR HALF_UP، Stocks ROUND_DOWN، Crypto decimals، …) قابل قبول است.

روی هر financial operation باید `roundingPolicyVersion` در calculationContext / engineVersions قفل شود تا تغییر آینده تاریخچه را silent rewrite نکند.
