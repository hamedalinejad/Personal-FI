> **Canonical کامل:** `docs/core/rounding/Rounding-Policy.md` — این فایل الحاقی‌های P0 (UI-only display، version، day_count) است.

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

---

## UI-only display rounding (P0) — ایران

گرد کردن نمایشی (مثلاً نزدیک‌ترین ۱۰ یا ۱۰۰ ریال برای نمایش تومان) **فقط در لایه UI** است.

| لایه | قانون |
|------|--------|
| DB / Journal / Ledger | مقدار **کامل** decimal string — هرگز دادهٔ از‌قبل‌گرد‌شدهٔ نمایشی ذخیره نشود |
| Reconcile / جمع‌ها | روی مقادیر ذخیره‌شده (غیرگرد‌شدهٔ UI) |
| UI | می‌تواند برای نمایش تومان/ریال گرد کند؛ edit/commit دوباره از مقدار canonical |

**Invariant:** اگر UI-rounded در DB ذخیره شود، Reconcile کلان اختلاف کاذب می‌دهد.

---

## day_count_convention per asset_class

علاوه بر rounding، قرارداد روزشمار جدا:

| کلاس | نمونه |
|------|--------|
| Loan | 365 / 360 / 30/360 / actual (policy) |
| FIF / صندوق درآمد ثابت | اغلب 30/360 (نه لزوماً actual/actual) — versioned |
| Stocks interest-like | طبق Iran/market rule |

در calculationContext روی operation قفل می‌شود.


---

## P0-099 — Single engine

One Core RoundingPolicy engine; `policyVersion` stored on financial operations. Features must not implement independent intermediate/final rounding rules. See CROSS-FEATURE-P0-090-100-LOCKS.md.
