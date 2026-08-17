# BUGS Report

## ✅ رفع‌شده در همین بررسی

### BUG-C02 — Offline-by-default
**راه‌حل:** `autoVersionCheckEnabled` پیش‌فرض **false**؛ Network فقط پس از opt-in.

### BUG-C03 — Unified Journal
**راه‌حل:** جدول `fin_journal_entries`؛ هر atomic op الزامی journal می‌نویسد؛ `acc_transactions` فقط cash ledger.

### BUG-C04 — totalFeesPaidBase
**راه‌حل:** جایگزینی `totalFeesPaidUSDT` با `totalFeesPaidBase` در همه سرمایه‌گذاری‌ها.

### BUG-C05 — Crypto trade model
**راه‌حل:** base/quote/settlement/fee assets؛ USDT فقط valuation پیش‌فرض نه محدودیت معامله.

### BUG-C06 — Fee quantity modes
**راه‌حل:** `feePresence` (fee_in_quote | fee_from_base_asset | fee_from_received | fee_external)؛ holding با netQuantity.
