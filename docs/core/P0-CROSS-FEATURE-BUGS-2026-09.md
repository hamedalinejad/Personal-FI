# Cross-Feature P0 Bugs — 2026-09

| ID | وضعیت | محل قفل |
|----|--------|---------|
| P0-001 | **CLOSED** | Canonical-Financial-Operation — Core sole reverse |
| P0-002 | **CLOSED** | Income/Expense — correction via reverseOperation + new op |
| P0-003 | **CLOSED** | operationId + reversesOperationId + reversalOperationId |
| P0-004 | **CLOSED** | Field-Write-Contract — snapshot not SoT in prose |
| P0-005 | **CLOSED** | API-Result — decimal string only |
| P0-006 | **CLOSED** | Feature-Independence — nullable account FK |
| P0-007 | **CLOSED** | db/05-constraints-polymorphic |
| P0-008 | **CLOSED** | types.md sole relatedFeature enum |
| P0-009 | **CLOSED** | date + createdAt + id order |
| P0-010 | **CLOSED** | Date-Semantics-Matrix |

در تعارض با Feature prose قدیمی، این جدول و اسناد قفل برنده است.

## Batch P0-011 … P0-020

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-011 | **CLOSED** | exchangeRateToBase canonical; «نرخ تتر» فقط UI |
| P0-012 | **CLOSED** | baseCurrencyAtOperation NOT NULL + immutable rates |
| P0-013 | **CLOSED** | CanonicalFeeEvent + one economic effect |
| P0-014 | **CLOSED** | convert fee before aggregate; currency guard |
| P0-015 | **CLOSED** | domain precision/sign validation |
| P0-016 | **CLOSED** | operationId required on all financial commands |
| P0-017 | **CLOSED** | IDEMPOTENCY_CONFLICT on hash mismatch |
| P0-018 | **CLOSED** | accountKind canonical; bankProductType separate |
| P0-019 | **CLOSED** | cardLast4/token only; no PAN |
| P0-020 | **CLOSED** | available ≠ ledger; commitments once |

## Batch P0-021 … P0-030

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-021 | **CLOSED** | credit_account v1 reject یا liability جدا؛ no silent overdraft |
| P0-022 | **CLOSED** | transfer principal legs + independent fee leg |
| P0-023 | **CLOSED** | Income correction Core-only |
| P0-024 | **CLOSED** | Expense correction Core-only |
| P0-025 | **CLOSED** | exclusive template source + unique occurrence link |
| P0-026 | **CLOSED** | financialOperationId canonical on occurrence |
| P0-027 | **CLOSED** | cash link nullable / SettlementPort |
| P0-028 | **CLOSED** | UNIQUE(templateId, scheduledOccurrenceKey) |
| P0-029 | **CLOSED** | anchorDay + monthClamp last_day policy |
| P0-030 | **CLOSED** | one reverseOperation for bounce after clear |

## Batch P0-031 … P0-040

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-031 | **CLOSED** | reversalOperationId canonical; acc link derived |
| P0-032 | **CLOSED** | currentNetWorth vs committedAdjustedNetWorth |
| P0-033 | **CLOSED** | cash via operationId; header accountTransactionId legacy |
| P0-034 | **CLOSED** | single fee treatment enum + mapping table |
| P0-035 | **CLOSED** | fee context scheduleVersion + base snapshot |
| P0-036 | **CLOSED** | rate by periodStart; accrueTo policy |
| P0-037 | **CLOSED** | interestModel + dayCount explicit |
| P0-038 | **CLOSED** | grace capitalize/waive flags explicit |
| P0-039 | **CLOSED** | versioned allocation waterfall |
| P0-040 | **CLOSED** | immutable schedule snapshots referenced by payments |

## Batch P0-041 … P0-049

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-041 | **CLOSED** | cancel after disbursement only via Core reverse; no cancel after payments |
| P0-042 | **CLOSED** | rebuild uses netQuantity |
| P0-043 | **CLOSED** | C2C one op; fee-from-base cost policy explicit |
| P0-044 | **CLOSED** | transfer cost_moved vs cost_fee_burn split |
| P0-045 | **CLOSED** | totalFeesPaidBase derived from active ops |
| P0-046 | **CLOSED** | instrumentId sole identity |
| P0-047 | **CLOSED** | USDT cash ≠ USDT token instrument |
| P0-048 | **CLOSED** | feePresence mutually exclusive |
| P0-049 | **CLOSED** | address must match wallet+network |

## Batch P0-050 … P0-059 (Stocks + Funds) — CLOSED 2026-09-01

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-050 | **CLOSED** | rebuildStockHolding / reconcile از CorporateActionEngine + همه CA types؛ snippet فقط buy/sell ممنوع |
| P0-051 | **CLOSED** | instrumentId: UUID + FK واقعی به ref_instruments.id (نه string آزاد) |
| P0-052 | **CLOSED** | feeAmount legacy preserved؛ breakdown nullable؛ new rows invariant sum |
| P0-053 | **CLOSED** | feeTax = transaction cost only؛ tax liability از Tax Feature / linkedTaxEventId جدا |
| P0-054 | **CLOSED** | tradeDate + settlementDate + effectiveCashDate/actualCashDate برای as-of reconstruction |
| P0-055 | **CLOSED** | CA lifecycle dates کامل (announcement/record/ex/effective/settlement/payment) روی entity |
| P0-056 | **CLOSED** | fractionalPolicy + cash-in-lieu operation صریح |
| P0-057 | **CLOSED** | priceAsOf + source + quoteType + staleState mandatory برای NAV/valuation |
| P0-058 | **CLOSED** | یک CashSettlementPort route per venue برای ETF cash (stocks_iran_brokerage) |
| P0-059 | **CLOSED** | P&L decomposition: NAV return / distributed / reinvested / realized جدا |

محل تفصیل: Investment-Stocks-Iran.md, Corporate-Actions-Spec.md, Settlement-Accounting.md, Fixed-Income-Funds.md, Corporate-Action-Engine.md
