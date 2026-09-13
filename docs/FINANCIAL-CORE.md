# FINANCIAL-CORE (sole financial semantics owner)

**Status:** CURRENT · Normative for money, journal, operation, fee, cost basis, reversal, cash truth.  
Detail engines may live under `docs/core/` as **implementation notes** until fully absorbed; on conflict **this file wins**.

## 1. Money
* All money/qty/rate/price = **decimal strings** (no JS Number arithmetic).
* Normalize at boundary; reject non-string financial inputs on public money API.
* Forbidden: silent Number coercion for money.

## 2. Quantity
* Asset quantity is instrument-scoped; unit/precision per instrument policy.
* Conservation rules are **role-aware** (fee_from_received ≠ cash fee).

## 3. FX
* Fields: from/to currency, rate, rateAsOf, conversionPath, source.
* Posted ops preserve historical FX; never re-infer from “latest” for history.
* amountInBase required for posted journal lines (same currency ⇒ rate 1).

## 4. Operation
* Required: operationId, type, businessDate, baseCurrency, status (`draft|posted|voided|failed`).
* Provenance: sourceChannel (ui|api|import|migration|system|reconciliation), sourceType (business), sourceReference.
* Idempotency: operationId + commandHash; conflict on same id different hash.
* **status ≠ durability_state** (persistence transport is separate).

## 5. Journal
* Lines: accountId, side debit|credit, amount, currency, amountInBase, exchangeRateToBase, lineKind.
* Balance in **base**: Σ debit amountInBase = Σ credit amountInBase.
* Line currency must match ledger account currency (unless explicit FX account model).

## 6. Cash truth
* **Cash = journal/accounting truth only.**
* brokerage/platform/crypto cash balances = DERIVED/CACHE/PROJECTION.
* Standalone still uses Core journal + settlement accounts (no feature cash SoT).

## 7. Fees
* feeFundingKind = cash | asset; feeCurrency XOR feeInstrumentId when applicable.
* Treatments: expense | capitalized_cost | fee_from_received | from_cash (and documented roles).
* Dimensioned outputs: carrying in transaction currency vs base separately — never mix.

## 8. Cost basis
* Default weighted average; pool key (instrumentId, holdingId, costCurrency, method).
* Internal transfer: no realized P&L; economic swap: realize source, new dest cost from consideration.

## 9. Reversal
* New operation linked by reverses_operation_id; posted rows immutable.
* Feature reverse helpers are convenience only.

## 10. Pipeline
Feature API → normalize → domain → journal → invariants → single transaction → persist → result (result_json is **not** financial SoT).


## 11. Canonical Operation Identity
* Identity key: `operationId` (UUID).
* Idempotency: same `operationId` + same canonical `commandHash` → replay; mismatch → conflict.
* Hash inputs include economic fields: type, businessDate, baseCurrency, settlementDate, eventAt, provenance, sourceChannel, sourceType, sourceReference, normalized payload.
* Caller-supplied hash must equal server-computed hash or reject.

## 12. Result snapshot
* Relational journal/operations are financial SoT.
* `result_json` = diagnostic/replay envelope only.
* `result_hash` = SHA-256 of canonical payload (excluding the hash field itself).


## 13. Algorithm doctrine
Every financial algorithm documents:
1. Business meaning  
2. Mathematical formula  
3. Executable golden vector  

If prose and fixture disagree, fixture/test is investigated — developer must not guess.


## Absorbed micro-doc topics (no longer independent authority)
Money/decimal/precision/unit/JSON policies · Financial-Invariants · Accounting-Calculation-Invariants · Canonical-Financial-Operation · Canonical-Cash-Model · JOURNAL-LINE / BASE-AMOUNT contracts · Fee-Treatment-Matrix · Cost-Basis-Engine · Date-Semantics-Matrix · Reversal identity · Operation status vs durability_state.

See git history under `docs/core/` for prior long-form text. **This file is the sole finance owner.**


## Operation identity (canonical)
Economic identity for hash includes: type, businessDate, settlementDate, eventAt, provenance, payload amounts/rates/accounts, journal legs. Caller hash must match recomputed hash.

## Journal pre-commit algorithm
1. Normalize decimal strings
2. Resolve account currency
3. Apply FX → amount_in_base
4. Sum debits/credits in base with Decimal
5. Exact equality or reject
6. Commit only after pass

## Fee model
Single CanonicalFeeEvent: feeAmount, feeCurrency, feeInstrumentId?, feeTreatment, feeFundingKind cash|asset. Feature selects policy; Core Fee Engine applies treatment.

## Cost basis
WAC v1 unless policy says otherwise. cost pool currency model must be consistent (transaction currency vs base — locked per feature table in module docs).

## Reversal
Core: originalOperationId → reversalOperationId. Feature reverse links are convenience only.

## Rate units
Percentage points: 12 means 12%. Internal fraction = value/100. Never treat 12 as 12.0 interest multiple.
