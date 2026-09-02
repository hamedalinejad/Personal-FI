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

## Corporate Action Lifecycle Dates (P0-055 — اجباری)

تاریخ‌های جدا **اجباری** هستند (نه فقط یک `date`/`effectiveDate` روی entity اصلی).

| فیلد | معنی | حداقل برای |
|------|------|------------|
| `announcementDate` | اعلام رسمی | همه |
| `recordDate` | تاریخ ثبت سهامداران واجد شرایط | dividend, rights, bonus, capital |
| `exDate` | تاریخ ex (بدون حق) | dividend, rights, split |
| `effectiveDate` | تاریخ اعمال quantity/cost | همه CAهای quantity-affecting |
| `settlementDate` | تسویه نقدی/اوراق | cash legs, rights exercise |
| `paymentDate` | پرداخت واقعی وجه | dividend, cash-in-lieu |

### مدل داده

`inv_stocks_iran_corporate_actions` (یا payload CA روی operation):

```text
id, instrumentId (UUID FK ref_instruments), actionType,
announcementDate, recordDate, exDate, effectiveDate, settlementDate, paymentDate,
ratio, cashAmount, cashCurrency, costBasisPolicy,
sourceInstrumentIds, targetInstrumentIds,
fractionalPolicy, operationId, notes, createdAt
```

Entity اصلی CA نباید فقط یک `date` داشته باشد. Rebuild از `effectiveDate` برای quantity و از `settlementDate`/`paymentDate` برای cash استفاده می‌کند.

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


---

## P0-056 — Fractional Entitlement & Cash-in-Lieu (اجباری)

برای rights / bonus / split / reverse_split که entitlement کسری تولید می‌کند:

### Policy فیلد

`fractionalPolicy` روی CA:

| مقدار | رفتار |
|--------|--------|
| `round_down` | سهم کسری دور ریخته می‌شود (پیش‌فرض محافظه‌کار) |
| `round_nearest` | رند به نزدیک‌ترین واحد مجاز |
| `cash_in_lieu` | ارزش کسری به صورت نقد پرداخت/دریافت می‌شود |
| `carry_forward` | کسری به entitlement بعدی منتقل (نادر؛ نیاز policy version) |

### الزامات

1. **Precision**: quantity entitlement با precision تعریف‌شده instrument (معمولاً integer share یا 0.01) محاسبه شود؛ بدون policy صریح، سیستم نباید سهم/پول یتیم تولید کند.
2. **Cash-in-lieu operation**: اگر `cash_in_lieu`، یک leg نقدی جدا با `operationId` همان CA یا child op ثبت شود؛ مبلغ = fractionalQty × referencePrice (قیمت اعلام‌شده یا close روز effective).
3. **Rebuild**: CorporateActionEngine باید fractionalPolicy را اعمال کند و نتیجه qty نهایی + هر cash-in-lieu را در ledger بنویسد.
4. **بدون policy**: reject یا default به `round_down` + warning audit (قابل پیکربندی در settings ولی default امن).

```text
entitlement = floor(holdingQty * ratio)   // or per policy
fractional = holdingQty * ratio - entitlement
if fractional > 0 and policy == cash_in_lieu:
  create cash leg (cash-in-lieu)
```

## ST-002 / ST-003 / ST-004 / ST-009

Rebuild via CorporateActionEngine only. Fractional + cash-in-lieu explicit. Symbol change keeps instrumentId. Delisting/worthless = explicit disposal/write-off operation.

## P0-FINAL-010 — Dividend journal

gross / withholding / net with incomeRecognitionDate vs paymentDate journals — see `P0-FINAL-005-010-LOCKS.md` §010.

