# Market Data Quality Pipeline (قبل از هر مصرف‌کننده / AI)

> **اصل P0:** Data Quality **قبل از** Model / AI / Signal است.  
> هیچ مدل، گزارش تاریخی، یا valuation نباید دادهٔ خراب/تأییدنشده را به‌عنوان Canonical ببیند.

Personal-FI Core مالی offline است؛ این سند قرارداد **ingestion قیمت/کندل/تیک** است (Adapterهای اختیاری: CSV، API، MT5، …).  
بدون عبور از Pipeline، داده وارد لایه Canonical نمی‌شود.

---

## 56 — Pipeline اجباری (ترتیب ثابت)

```text
Raw
  ↓
Schema Validation
  ↓
Timestamp Validation
  ↓
Duplicate Detection
  ↓
Gap Detection
  ↓
OHLC Validation          // فقط اگر candle
  ↓
Price Validation
  ↓
Volume Validation        // اگر volume موجود
  ↓
Cross-Timeframe Validation  // اگر TF بالاتر از TF پایین‌تر ساخته/چک می‌شود
  ↓
Canonical Store
```

**AI / Model / Discovery نباید به مرحلهٔ قبل از Canonical وصل شود.**

هر مرحله Fail:

- رکورد → `rejected` + reason code + raw حفظ می‌شود
- یا batch → `quarantine` تا اصلاح دستی/re-import

---

## 57 — OHLC Invariants (رسمی)

برای هر Candle معتبر:

```text
high >= open
high >= close
high >= low
low  <= open
low  <= close
low  <= high
range = high - low >= 0
body  = abs(close - open)
body  <= range
```

اختیاری سخت‌گیرانه (policy versioned):

```text
open, high, low, close > 0   // برای دارایی‌های قیمت‌مثبت
volume >= 0 یا null
```

نقض هر invariant → **reject** از Canonical (نه silent clamp مگر policy صریح `repair_mode` با audit).

---

## 58 — Duplicate Detection = Composite Key

حداقل کلید یکتایی منطقی:

```text
(source, broker, symbolKey, timeframe, timestamp)
```

ترجیح storage:

```text
UNIQUE(source_id, broker_id, instrument_id, timeframe, bar_open_ts)
```

- فقط `timestamp` کافی **نیست**
- برای Tick: `(source, broker, symbol, timestamp, sequence)` یا `tick_id` پایدار از منبع

Duplicate → drop/ignore با شمارنده metric؛ **نه** double insert.

---

## 59 — Timeframe Enum

Canonical enum (بسته؛ فقط مقادیر پشتیبانی‌شده توسط Source یا قابل ساخت از TF پایین‌تر):

```text
TICK
M1 M2 M3 M4 M5 M6 M10 M12 M15 M20 M30
H1 H2 H3 H4 H6 H8 H12
D1 W1 MN1
```

قواعد:

1. TFای که نه Source می‌دهد نه از TF پایین‌تر **به‌صورت deterministic** aggregate می‌شود → وارد سیستم نشود.
2. Aggregate مثلاً M5 از M1 فقط با alignment مرز کندل رسمی (UTC یا session policy versioned).
3. نام‌های آزاد مثل `"5min"` ممنوع — فقط enum.

---

## 60 — Live Collector: Effectively-Once

هدف: **effectively-once** به Canonical (exactly-once ایده‌آل اگر منبع `tick_id` پایدار بدهد).

```text
onTick(t):
  key = tick_id OR (symbol, timestamp, sequence)
  if seen(key) → skip
  else validate → buffer → persist → mark seen
```

- Double delivery از MT5/socket نباید dataset را دوبار بنویسد.
- Idempotency store: persistent (DB/WAL) نه فقط RAM.

---

## 61 — Crash-Safe ingestion

```text
last_persisted_sequence / last_persisted_ts per (source, symbol, stream)
```

پس از crash:

```text
recover checkpoint
resume from last_persisted + 1
re-read overlap window و dedupe با composite key
```

مثال: اگر Tick ۱۰۰۰۰۰ در RAM بود و persist تا ۹۹۹۹۸ → restart از ۹۹۹۹۸ با dedupe.

Write path پیشنهادی: append WAL / transaction → checkpoint atomic.

---

## 62 — Shutdown order

```text
1. stop accepting live ingestion
2. flush buffers
3. commit DB / swap files
4. checkpoint (last_persisted, open batches)
5. persist sync state
6. persist model state (اگر AI module فعال)
7. persist runtime state
8. close source connection (e.g. MT5)
9. exit
```

Shutdown ناقص = startup باید recovery را اجباری بداند.

---

## 63 — Startup = Recovery-aware

```text
Environment Check
  ↓
Storage Check
  ↓
Database Recovery (WAL/integrity)
  ↓
Source Connection (MT5/API/optional)
  ↓
Symbol Verification (map to instrumentId)
  ↓
Data Health (gaps, last bar age, reject rates)
  ↓
Sync (backfill gaps if policy allows)
  ↓
Model Load (optional module)
  ↓
Model Health
  ↓
Live Mode
```

**ممنوع:** `start → run` بدون recovery و health gates.

اگر Data Health قرمز است → Live trading/signals خاموش؛ فقط diagnose/repair.

---

## 64 — Observability Events (حداقلی)

هر رخداد مهم یک **Event** append-only:

| Event |
|-------|
| DATA_INGESTED |
| DATA_REJECTED |
| DATA_GAP_FOUND |
| SYNC_STARTED |
| SYNC_COMPLETED |
| MODEL_LOADED |
| MODEL_REJECTED |
| DISCOVERY_FOUND |
| DISCOVERY_REJECTED |
| SIGNAL_CREATED |
| SIGNAL_EXPIRED |
| RISK_DENIED |
| ORDER_SENT |
| ORDER_FILLED |
| ORDER_FAILED |
| MODEL_UPDATED |
| MODEL_ROLLBACK |

Payload: `eventId`, `ts`, `severity`, `correlationId`, داده‌های غیرقابل‌حذف لازم برای debug.

---

## 65 — Event Log Immutable

- Event log **append-only**؛ update/delete منطقی ممنوع (جز archive سرد)
- برای بازسازی رفتار مدل/سیگنال روز قبل: `runId` + `modelVersion` + `dataSnapshotRef` + events
- اگر مدل عوض شد، Run قبلی باید از log + canonical data همان نسخه قابل توضیح باشد

---

## ارتباط با Personal-FI

| لایه PF | نقش |
|---------|-----|
| Price-Fetching adapters | می‌توانند همین pipeline را برای series تاریخی پیاده کنند |
| Valuation / reports | فقط Canonical + asOf |
| Offline | بدون live collector هم CSV/manual از Schema→Canonical می‌گذرد |
| AI / auto-trade | **خارج از Core مالی**؛ اگر ماژول جدا باشد، وابسته به این pipeline است نه برعکس |

License/Edition می‌تواند Live Collector یا AI را خاموش کند؛ Pipeline کیفیت برای هر دادهٔ واردشده باقی می‌ماند.
