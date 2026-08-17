# BUGS Report

## ✅ رفع‌شده در همین بررسی

### BUG-H10 — Multiple wallet addresses per network
**راه‌حل:** inv_crypto_wallet_addresses با derivationPath/accountIndex؛ network ≠ یک address.

### BUG-H11 — Qarz principal vs service fee
**راه‌حل:** principalAmount مبنای اقساط/remaining؛ serviceFee expense جدا؛ نه P=principal-fee.

### BUG-H12 — Loan fee accounting treatment
**راه‌حل:** accountingTreatment per feeCategory؛ پیش‌فرض expense نه reduction of liability.

### BUG-H13 — balanceAfterTransaction derived only
**راه‌حل:** snapshot غیرauthoritative؛ rebuild از ledger.

### BUG-H14 — Polymorphic link risk
**راه‌حل:** validate-before-commit، enum check، orphan reconcile اجباری؛ کاهش surface در آینده.


### BUG-H06 — FIF multi-currency
**راه‌حل:** currency روی معامله + exchangeRateToBase به baseCurrency؛ حذف hard-code ریال/تتر.

### BUG-H07 — Fund fee cost basis
**راه‌حل:** includeInCostBasis؛ subscription/brokerage در basis؛ redemption از proceeds.

### BUG-H08 — Transfer conservation
**راه‌حل:** تفکیک transfer بدون fee vs با network fee؛ fee می‌سوزاند و کل موجودی کم می‌شود.

### BUG-H09 — C2C gross/net
**راه‌حل:** grossQuantity + feeQuantity + netQuantity روی هر leg C2C.


### BUG-H01 — Crypto price API by instrumentId
**راه‌حل:** fetch/get/set با instrumentId/PriceAssetRef؛ symbol API deprecated.

### BUG-H02 — assetKey required, no symbol fallback
**راه‌حل:** assetKey اجباری و UNIQUE؛ symbol فقط label؛ assetId فقط mapping Provider.

### BUG-H03 — Quote market vs valuation stream
**راه‌حل:** priceCurrency/quoteMarket جدا؛ BTC-USDT ≠ BTC-USD در یک stream.

### BUG-H04 — Iran stocks corporate actions
**راه‌حل:** انواع CA روی transactions + قوانین cost basis + جدول اختیاری CA.

### BUG-H05 — Stock holding stable instrumentId
**راه‌حل:** UNIQUE(brokerageId, instrumentId)؛ symbol mutable.


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
