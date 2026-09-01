# Corporate Actions — اثر روی Quantity / Cost / P&L (v1)

Identity: `instrumentId`. symbol change ≠ holding جدید.

| Action | v1 | Quantity | Cost Basis / Avg | Realized P&L | Cash |
|--------|-----|----------|------------------|--------------|------|
| Dividend (cash) | Yes | unchanged | unchanged | no (income) | + cash |
| Bonus shares | Yes | ↑ ratio | cost total same → avg ↓ | no | none |
| Stock split | Yes | ↑ ratio | cost total same → avg ↓ | no | none |
| Reverse split | Yes | ↓ | cost total same → avg ↑ | no | none |
| Capital increase (cash rights) | partial | per rights rules | + cash paid into basis | no until sale | − cash if paid |
| Rights issue / exercise / sell | Yes | per rules | allocated | rights sell may realize | vary |
| Symbol / ISIN change | Yes | same | same | no | no |
| Merger / Spin-off | v1.1+ | mapping | allocated | policy | vary |

همه از `Corporate-Action-Engine` + `operationId`. Rebuild ledger همه typeهای پشتیبانی‌شده را می‌شناسد.

Fields: TradeDate, SettlementDate, MarketDate, Session, Broker, ISIN, FirmCode, Lot, Tick, Fees breakdown — در Iran-Market-Rules + Stocks doc.

**Immutable:** CA تراکنش‌های قبلی را **rewrite نمی‌کند**. History ثابت + CA event + holding state جدید.

---

## Break-even / تعدیل averageBuyPrice پس از افزایش سرمایه (P0)

افزایش سرمایه (آورده نقدی، سود انباشته، تجدید ارزیابی) و **حق تقدم** روی `quantity` و `averageBuyPrice` (cost basis) اثر می‌گذارند.

### اصول

1. Corporate Action = Financial Operation با `operationId` (نه overwrite خام holding بدون audit)
2. Cost pool همان `holdingId` تعدیل می‌شود طبق نوع CA
3. فرمول‌ها باید **گام‌به‌گام** در engine تست fixture داشته باشند

### الگوی مفهومی (باید در engine دقیق و با fixture قفل شود)

**الف) افزایش از محل سود انباشته / سهام جایزه (بدون پرداخت نقدی کاربر):**

```text
quantity' = quantity + bonusShares
costTotal unchanged
averageBuyPrice' = costTotal / quantity'
```

**ب) افزایش از محل آورده نقدی (کاربر پرداخت می‌کند):**

```text
cashOut = payable per right/share rules
quantity' = quantity + newShares
costTotal' = costTotal + cashOut + fees
averageBuyPrice' = costTotal' / quantity'
```

**ج) حق تقدم:**

- صدور حق → instrument/holding جدا یا meta روی همان نماد طبق مدل CA
- استفاده / فروش / ابطال حق = operations جدا با cost allocation صریح
- پس از تبدیل حق به سهم: ادغام cost طبق policy CostBasisEngine

**د) تجدید ارزیابی:** معمولاً quantity ثابت؛ اگر مقررات/مدل پروژه cost را تغییر ندهد، فقط meta/audit — در غیر این صورت policy versioned.

هر فرمول نهایی در `Cost-Basis-Engine` + fixture عددی ایران؛ این بخش قرارداد است که **بدون فرمول گام‌به‌گام + تست، release سهام ایران معتبر نیست**.

---

## Corporate Action Lifecycle (P1)

تاریخ‌های جدا (نه فقط یک effectiveDate):

`announcementDate` · `recordDate` · `exDate` · `effectiveDate` · `settlementDate` · `paymentDate`

### حق تقدم — حالات

`rights_received` · `rights_sold` · `rights_exercised` · `rights_expired` · `subscription_payment` · `fractional_entitlement` · `cash_in_lieu`

رابطه:

```text
parent security
  → rights instrument
  → new shares
  → cash payment
```

بدون این روابط، cost basis خراب می‌شود. هر گام = Operation جدا یا legهای یک CA operation با لینک صریح.
