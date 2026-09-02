# Settlement Accounting (سهام ایران)

| Date | نقش |
|------|-----|
| tradeDate | معامله |
| accountingDate / businessDate | ثبت دفاتر |
| settlementDate | تسویه T+n |
| actualCashDate | وقتی پول واقعاً جابه‌جا شد |

**v1 ساده (نه full ERP receivable):**

```text
tradeDate, settlementDate, cashSettlementStatus = pending|settled|failed
```

- تا `settled`: موجودی **قابل‌استفاده بانک** ممکن است کم نشود؛ `pending payable/receivable` در projection
- Stock qty از trade؛ cash bank از settlement leg
- یک `operationId` می‌تواند trade + later settlement را به هم وصل کند (یا op فرزند با link)

IranSettlement Core — hard-code داخل UI ممنوع.

---

## Trade vs Settlement (قفل)

جدا نگه دار:

| مفهوم | نقش |
|--------|------|
| order / trade date | تاریخ معامله |
| settlement date | تاریخ تسویه |
| cash reserved | نقد رزرو |
| cash available | نقد آزاد |
| position pending | موقعیت در انتظار تسویه |
| position settled | موقعیت تسویه‌شده |

بدون این تفکیک، Cash / Portfolio / P&L در بازه T+n غلط می‌شوند.

---

## P0-054 — Historical as-of Reconstruction Contract (اجباری)

برای reconstruction صحیح portfolio و cash در هر `asOf`:

1. **tradeDate** — تاریخ معامله (effect on position quantity از این تاریخ).
2. **settlementDate** — تاریخ تسویه قراردادی (T+n طبق قوانین بازار؛ اثر روی pending vs settled cash).
3. **effectiveCashDate / actualCashDate** — تاریخی که cash واقعاً در حساب/کارگزاری جابه‌جا شده (ممکن است با settlementDate فرق کند).

### Contract

```text
Position quantity as-of D  = Σ trades where tradeDate <= D (net of reversals)
Settled cash effect as-of D = Σ cash legs where settlementDate <= D AND status=settled
                            + actualCashDate when known and different
Available cash as-of D     = settled − commitments/reservations still open at D
```

- `cashBalance` snapshot روی Brokerage **فقط** current است؛ historical از ledger + این سه تاریخ reconstruct می‌شود.
- هر transaction سهام باید حداقل `tradeDate` و `settlementDate` داشته باشد (nullable فقط برای legacy با migration flag).
- `asOf` query بدون این تفکیک = باگ P0 (portfolio/cash غلط در بازه T+n).

**ممنوع:** استفاده از یک فیلد `date` واحد برای همه semantics.

## ST-001

P&L/position timing → tradeDate; cash → settlementDate / effectiveCashDate. Do not conflate in reports.

