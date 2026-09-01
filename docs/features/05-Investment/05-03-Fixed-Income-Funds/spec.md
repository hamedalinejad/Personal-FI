# Spec entry

مشخصات کامل: **[Fixed-Income-Funds.md](./Fixed-Income-Funds.md)**

این فایل alias برای کشف‌پذیری است.

---

## NAV ≠ transactionPrice (قفل P0)

این‌ها الزاماً یکی نیستند و جدا نگه داشته می‌شوند:

| مفهوم | نقش |
|--------|------|
| NAV | ارزش خالص دارایی اعلامی |
| transactionPrice | قیمت واقعی معامله کاربر |
| subscriptionPrice / issuance | قیمت صدور |
| redemptionPrice | قیمت ابطال |

Domain concepts جدا:

- Distribution vs Accumulation
- ETF vs Issue/Redemption fund

Cost basis و Realized P&L از **transactionPrice** (و fees) می‌آید؛ NAV برای valuation/unrealized است مگر policy صریح خلاف بگوید.
