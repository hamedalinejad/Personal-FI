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

---

## سه گزارش مستقل Performance (P0/P1 — جلوگیری از double-count)

**ممنوع:** ریختن current unrealized مستقیم داخل period P&L تاریخی.

### 1. Since Inception
total invested + income + realized + unrealized (مرز از شروع)

### 2. Period Economic P&L
```text
opening value
+ cash flows
+ income
+ realized
→ vs closing value
```

### 3. Return %
جدا: TWR · MWR/IRR (بعداً)

### NAV sources
- reported NAV: value, source, reportedAt, marketDate, provider, rawValue
- calculated NAV (ممکن است ≠ reported)
- Liquidation Value ≠ NAV ≠ Transaction Price (early redemption fee, broker commission, …)

### ETF vs Issue/Redemption dependency
- صدور/ابطال: Fund + Core کافی (standalone)
- ETF: conditional dependency به Broker + Stock Settlement — نه global اجباری
