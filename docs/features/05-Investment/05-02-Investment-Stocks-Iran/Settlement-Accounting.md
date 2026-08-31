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
