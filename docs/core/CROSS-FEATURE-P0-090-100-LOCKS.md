# Cross-Feature P0-090 … P0-100 Locks (2026-09-02)

این سند **برنده** در تعارض با prose قدیمی Feature است. پیاده‌سازی باید این قفل‌ها را رعایت کند.

---

## P0-090 — Canonical metrics + shared query engine

**مشکل:** Reports / Portfolio / Dashboard ممکن است یک مفهوم P&L یا Net Worth را با definitionهای مختلف بخوانند.

**قفل:**
- تعریف متریک‌های canonical در Core (مثلاً `docs/core/Essential-Reports.md` + metric catalog):
  - `realizedPnL`, `unrealizedPnL`, `totalReturn`, `netWealth`, `investmentValue`, …
- هر متریک: فرمول، scope (cashScope)، asOf semantics، included components.
- Reports, Portfolio (`calculateWealthView`), Dashboard **فقط** از shared query/projection engine (یا adapters روی همان definitions) می‌خوانند.
- Feature حق ندارد فرمول موازی برای همان نام متریک داشته باشد.

---

## P0-091 — Cash ownership: bank vs venue

**مشکل:** Investment cash adapters و Accounts ممکن است هر دو snapshot balance را owner بدانند → drift.

**قفل:**
- **Accounts / fin_accounts + journal** مالک bank cash (و هر account نقد canonical).
- **Venue feature** (Stocks brokerage, Crypto exchange, Metals platform) مالک **venue cash** همان venue؛ snapshot محلی فقط projection.
- لینک دو طرف فقط از طریق **Financial Operation** + CashSettlementPort (دو leg یا port route)، نه دو SoT موازی.
- `Canonical-Cash-Model.md` و `Cash-Settlement-Adapter.md` مرجع.

```text
Bank cash SoT     = fin_journal_lines on bank fin_account
Venue cash SoT    = venue ledger / journal lines for that venue account
Snapshot fields   = rebuildable projection only
```

---

## P0-092 — Canonical opening operation

**مشکل:** opening balances/positions باید financial operation باشند ولی contract یکسان ندارند.

**قفل:**
- هر opening balance / opening position فقط از مسیر **opening financial operation** با:
  - `operationKind = opening` (یا catalog equivalent)
  - `source` / `provenance` (manual | import | migration)
  - `asOf` / `businessDate`
  - amounts as decimal strings + currency + optional amountInBase locked
- Feature-specific opening بدون operationId ممنوع.
- ببین `Opening-Balance.md`.

---

## P0-093 — Import always has operation identity

**مشکل:** import/restore ممکن است transaction بدون operationId وارد کند → history non-replayable.

**قفل:**
- هر ردیف مالی واردشده از import **باید** به یک `operationId` وصل باشد.
- Import batch می‌سازد: `importOperationId` (و در صورت نیاز child operation per row) + حفظ `externalId` / source ids.
- Restore همان قرارداد: بدون operationId commit مالی ممنوع.
- ببین `Import-Infrastructure.md` / `Import-Lineage.md`.

---

## P0-094 — operation source ≠ transaction source

**مشکل:** `source=migration` با semantics business operation مخلوط می‌شود.

**قفل:**
- فیلد **operation provenance/source** (مثلاً `operationSource`: `user` | `import` | `migration` | `system` | `repair`) روی `fin_operations` جدا از:
- **domain transaction source** (مثلاً contribution source, payment channel).
- UI/گزارش audit هر دو را نشان می‌دهد؛ منطق business (P&L, budget apply) از provenance عملیات مهاجرتی در صورت نیاز فیلتر می‌شود نه با قاطی کردن enumها.

---

## P0-095 — Price provider failure does not block offline ops

**مشکل:** قطعی provider قیمت ممکن است ثبت معامله را block کند → نقض offline-first.

**قفل:**
- Price provider **ثانویه** است.
- ثبت transaction / operation با **manual price** یا **last-known price** (با flag `priceSource=manual|last_known` و stale) همیشه مجاز است.
- Valuation ممکن است `stale=true` شود؛ registration بلاک نمی‌شود.
- ببین Price-Fetching feature + Offline-Modes.

---

## P0-096 — marketDate / priceAsOf vs fetchedAt

**مشکل:** marketDate و fetchedAt در valuation یکسان فرض می‌شوند.

**قفل:**
| Field | Role |
|-------|------|
| `priceAsOf` / `marketDate` | **primary** for valuation as-of |
| `fetchedAt` | provenance only (when downloaded) |

Historical valuation از `priceAsOf` استفاده می‌کند نه `fetchedAt`.

---

## P0-097 — Immutable amountInBase at operation

**مشکل:** correction بعد از تغییر baseCurrency ممکن است historical `amountInBase` را عوض کند.

**قفل:**
- روی هر financial operation: `baseCurrencyAtOperation` و `amountInBase` (و rates قفل‌شده) **immutable** پس از commit.
- تغییر baseCurrency کاربر فقط روی **عملیات جدید** و گزارش‌های forward اثر دارد؛ تاریخچه بازنویسی نمی‌شود.
- Correction = reverse + new op با rates همان زمان op اصلی (یا صریح documented)، نه mutate amountInBase قدیمی.

---

## P0-098 — Multi-hop conversion path persisted

**مشکل:** conversion path چندمرحله‌ای در بعضی docs حذف شده.

**قفل:**
- اگر تبدیل >1 hop: **persist** `conversionPath` (ordered hops: from, to, rate, asOf, source).
- intermediate currencies و نرخ‌ها برای audit/replay لازم‌اند.
- هم‌راستا با Financial-Invariants و Reports P0-080.

---

## P0-099 — Single RoundingPolicy engine

**مشکل:** گرد کردن intermediate vs final بین Featureها یکسان نیست → اختلاف penny/wei.

**قفل:**
- یک **RoundingPolicy** engine در Core با `policyVersion` ذخیره‌شده روی operation (یا settings snapshot).
- Featureها policy invent نمی‌کنند؛ فقط `RoundingPolicy.apply(amount, context)` را صدا می‌زنند.
- intermediate rounding vs final-only در version policy مشخص است.
- ببین `Rounding-Policy.md`.

---

## P0-100 — Reconcile repair explicit & audited

**مشکل:** repair ممکن است snapshot را silent fix کند بدون audit.

**قفل:**
- Repair **همیشه** explicit است: permissioned، با `repairOperationId` / audit log.
- Repair **هرگز** ledger/journal را خاموش rewrite نمی‌کند؛ در صورت نیاز reverse+correct ops.
- Snapshot rebuild از ledger پس از repair مجاز است و خودش audit می‌شود.
- Silent mutation of snapshot or ledger = forbidden.
- ببین `Reconciliation-Foundation.md`.

