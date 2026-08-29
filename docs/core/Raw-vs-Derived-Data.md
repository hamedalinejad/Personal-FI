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
