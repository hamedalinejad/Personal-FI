# Capability API Layer (P0)

علاوه بر Feature Public API، یک لایه **Core Capability API** تعریف می‌شود.

```text
UI
 ↓
Feature API          (LoanAPI, CryptoAPI, StocksAPI, FundsAPI, MetalsAPI, …)
 ↓
Capability API       (Accounting, Settlement, Currency, Pricing, CostBasis, Fee, Document, Party, Reconciliation, …)
 ↓
Domain
 ↓
Persistence
```

## Capability APIs (نمونه)

| API | نقش |
|-----|-----|
| `AccountingAPI` | journal projection, CoA queries |
| `SettlementAPI` | CashSettlementPort façade |
| `CurrencyAPI` | FX convert, rates asOf |
| `PricingAPI` | latest / historical price |
| `CostBasisAPI` | acquisition/disposal cost pools |
| `FeeAPI` | calculate / allocate fee treatment |
| `DocumentAPI` | attach / link documents |
| `PartyAPI` | parties CRUD / resolve |
| `ReconciliationAPI` | reconcile + rebuild reports |
| `OperationAPI` | runAtomicFinancialOperation helpers |

## قوانین

- Feature API **نباید** persistence یا journal را مستقیم بنویسد؛ از Capability / Core استفاده می‌کند.
- Feature به Feature دیگر فقط از Public API همان Feature یا Capability مشترک وصل می‌شود — نه repository داخلی.
- v1 transport: TypeScript **in-process**. آینده: همان contract پشت REST / IPC / Mobile / Cloud.

مرجع: `Feature-API-Contract.md` · `Module-Architecture.md`

## Headless modules (historical batch-5 §6; see host LOCK)

Every Feature/Capability module exposes API usable **without** parent UI (tests, jobs, import, limited license modules). UI is a client, not a runtime requirement.

