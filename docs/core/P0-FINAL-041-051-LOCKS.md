# P0/P1 FINAL 041–051 Locks (pre-coding last pass)

## P0-FINAL-041 — businessDate day-boundary

| Rule | |
|------|--|
| `businessDate` timezone | **user profile timezone** (default: Asia/Tehran for Iran installs) |
| Cutoff | **local midnight** in that timezone |
| Storage type | **DATE-only** (calendar day string `YYYY-MM-DD` in civil calendar of the profile, or explicit Gregorian date-only) — **not** a UTC timestamp truncated |
| Near midnight | Event at 23:50 local → businessDate = that local calendar day; event at 00:10 next day → next businessDate |
| `createdAt` / `eventAt` | always **UTC instant** (ISO-8601 with Z) |
| Conversion | UTC instant → businessDate via profile TZ only at boundary |

**Forbidden:** treating `businessDate` as `timestamp.toISOString().slice(0,10)` without profile TZ (wrong near midnight).

## P1-FINAL-042 — Jalali boundary only

| Layer | Calendar |
|-------|----------|
| Accrual / intervals / age / TTL | Gregorian UTC **instant** or duration in ms |
| businessDate storage | Gregorian date-only (or explicit civil DATE policy) |
| UI display / Iran business labels | Jalali via `jalali_display` helper |
| Loan “+1 month” | business calendar rule (IranLoanConventions), **not** Jalali string math in engine core |

Jalali **must not** enter timestamp interval arithmetic unless a documented business rule (e.g. Jalali month-end installment) is selected on the loan and implemented in Iran adapter.

## P0-FINAL-043 — IRR/Toman input contract

```text
DB / Domain / Command payload amounts = IRR only (canonical decimal string)
UI may show/edit Rial or Toman via display unit toggle
```

| Step | Owner |
|------|--------|
| User types in form | UI (display unit) |
| On submit, before Feature Command | **Form boundary normalizer** → IRR string |
| Feature Command / Domain / Journal | receives **IRR only** |

**Acceptance:** Input `1,000,000` Toman → command amount `"10000000"` IRR.  
**Forbidden:** any UI component scaling amounts inside `runAtomicFinancialOperation` or repository.

Setting: `uiMoneyUnit: 'rial' | 'toman'` (display only).

## P1-FINAL-044 — Banking identifier normalization

Before uniqueness check / store:

| Input | Normalize |
|-------|-----------|
| Persian/Arabic digits ۰-۹ / ٠-٩ | → ASCII 0-9 |
| spaces, ZWJ, hyphens | strip |
| IBAN/Shaba | uppercase Latin letters; no spaces |
| leading zeros on national account numbers | preserve if meaningful; document per bank rule; compare on normalized form |

```text
normalize(id) then UNIQUE(normalized)
raw display form may be kept separately as displayValue
```

False-negative duplicates (same Shaba with different spaces/digits) = bug.

## P1-FINAL-045 — Backup tamper evidence

Manifest **required** for valid backup:

```json
{
  "createdAt": "ISO-UTC",
  "appVersion": "...",
  "schemaVersion": 12,
  "dataChecksum": "sha256 of sqlite bytes",
  "attachmentManifest": [{ "blobId": "...", "checksum": "..." }],
  "engineVersions": { "accounting": "1", "costBasis": "1", "..." : "..." },
  "databaseId": "..."
}
```

Restore **must** verify manifest checksums before swap. Fail → reject restore, keep current DB.

## P1-FINAL-046 — Single mutation pathway

**Only allowed** financial mutation path:

```text
Feature Command
  → Operation Builder
  → Core engines (validate, fee, cost, fx, …)
  → Journal + Cash (+ domain ledger)
  → projection rebuild
  → COMMIT / persist
```

Second path (Feature → SQL snapshot update, Feature → direct journal, UI → SQL) = **architectural violation** (lint/architecture test in CI when code exists).

## P1-FINAL-047 — Standalone scenario fixtures

Before feature code, fixtures must exist (spec + later harness):

| ID | Scenario |
|----|----------|
| STANDALONE-CRYPTO | Crypto buy/sell/hold **without** Accounts UI; later attach bank cash without destructive migration |
| STANDALONE-LOAN | Loan create/pay **without** Accounts UI; later link disbursement account |
| STANDALONE-FUND | Fund sub/redeem **without** Accounts UI; later attach bank |

Journal still written by Core. Accounts UI optional.

## P0-FINAL-048 — Historical report calculation context

Every historical report payload includes metadata (UI may collapse):

```typescript
interface ReportCalculationContext {
  asOf: string;              // businessDate or instant policy
  priceAsOf?: string;
  fxAsOf?: string;
  cashCutoff?: string;
  liabilityScope?: string;
  valuationMode?: string;    // e.g. nav | redemption | market
  priceSourceId?: string;
  priceSourceVersion?: string;
  fxSourceId?: string;
  fxSourceVersion?: string;
  engineVersions: Record<string, string>;
  staleStatus?: { prices?: boolean; fx?: boolean };
}
```

## P0-FINAL-049 — EXTERNAL_REPORTED distinct

| | |
|--|--|
| `calculatedProfit` / engine P&L | DERIVED internal |
| `externalReportedProfit` | EXTERNAL_REPORTED only |

Reports and exports **must** keep separate fields. Never overwrite calculated with external or sum them silently.

## P1-FINAL-050 — Acceptance matrix hygiene

At SPEC Freeze, every checklist item is exactly one of:

```text
GREEN
EXPLICITLY_OUT_OF_SCOPE (with ADR/note)
```

No aspirational `[ ]` left on P0/P1-GLOBAL items in scope for v1 coding gate.

## P1-FINAL-051 — Canonical Page/Route/Sheet table

See `docs/00-Product/Pages-IA.md` § Canonical IA Table — counts are **computed**, not “~9”.
