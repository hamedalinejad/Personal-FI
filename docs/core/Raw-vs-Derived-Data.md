# Raw / Historical Facts vs Derived Data

فلسفه: **هیچ فیلد واقعی کاربر از بین نرود.**

## Raw / Historical Facts (حقیقت ثبت‌شده)

آنچه کاربر (یا import) واقعاً وارد کرده — **append-only / immutable** از نظر مالی:

| نمونه | |
|--------|--|
| amount, quantity, price, fee, feeCurrency | |
| exchangeRateToBase, conversionPath | |
| businessDate, settlementDate, marketDate, eventAt | |
| partyId, description, reference, source, externalId | |
| domain transaction rows, journal lines, operation header | |

**ممنوع:** DROP/overwrite معنای این فیلدها بدون migration سازگار با خواندن dual.

## Derived Data (قابل rebuild)

محاسبه از Raw + قوانین engine:

| نمونه | |
|--------|--|
| averageCost, totalInvested, realizedPL, unrealizedPL | |
| currentBalance, balanceAfterTransaction, remainingBalance | |
| holding qty snapshot, portfolioValue, port_snapshots | |

- می‌توان (و باید بتوان) از ledger **rebuild** کرد  
- **هرگز SoT گزارش** نیستند (`Financial-Invariants` §9)  
- در drift: Snapshot خراب است، نه Ledger

## جریان

```text
Raw (Ledger / Journal)
      ↓
Calculation (engineVersion قفل‌شده روی operation)
      ↓
Derived / Report
```

اگر `snapshot ≠ ledger` → reconcile → repair فقط با تأیید کاربر.

## چهار نوع فیلد (نسخه نهایی)

| Kind | معنی |
|------|------|
| **RAW** | حقیقت ثبت‌شده کاربر/import |
| **DERIVED** | محاسبه از RAW + engine |
| **SNAPSHOT** | cache مشتق — rebuild |
| **EXTERNAL_REPORTED** | عدد گزارش بیرونی (صندوق/کارگزاری) — جدا از DERIVED سیستم |

جزئیات field-level: `Field-Level-SoT.md`


---

## Snapshot قابل نابودی / rebuild (P0)

جداول snapshot مثل:

- `inv_crypto_holdings` (کش)
- `currentBalance` / `remainingBalance`
- `portfolioSnapshot` / `port_snapshots`
- `rep_net_worth_snapshots`

**نباید** تنها منبع حقیقتی داشته باشند که در transactions نیست.

اگر holding/snapshot پاک شود، سیستم باید بتواند از ledger **rebuild** کند.

```text
Snapshot = cache مشتق
Ledger / Journal = SoT
```

در drift: Snapshot خراب است، نه Ledger.

---

## همه چیز Derived نیست — EXTERNAL_REPORTED

اعدادی که از بیرون سیستم آمده‌اند حفظ می‌شوند و با محاسبه سیستم قاطی نمی‌شوند:

| EXTERNAL_REPORTED (نمونه) | جدا از |
|---------------------------|--------|
| externalReportedProfit | calculatedProfit |
| broker statement quantity | holding rebuild از trades |
| bank statement balance | balance از acc_transactions |
| fund manager reported profit | P&L engine |

Field-Level SoT این تفکیک را enforce می‌کند. Import نباید EXTERNAL را به‌عنوان DERIVED بنویسد.
