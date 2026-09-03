# Canonical Financial Requirements (implementable — UI-agnostic)

> **Authority for coding.** UI design may vary; these rules may not.  
> Cross-refs: Financial-Invariants, Canonical-Financial-Operation, Canonical-Cash-Model, Cost-Basis-Engine, CODING-GATE.

---

## 4.1 Money / decimal

| Rule | |
|------|--|
| DB persistence | decimal **string** |
| API financial values | decimal **string** |
| Engine arithmetic | **Decimal** (decimal.js) after parse |
| Forbidden | IEEE `number`/`float` for money/qty/rate/price |
| Forbidden | SQL `SUM`/`AVG` on TEXT money columns — aggregate in Domain with Decimal |
| Before commandHash / persist | **Canonical Decimal String** normalization |

---

## 4.2 Currency

| Rule | |
|------|--|
| Currency ≠ Instrument | always |
| IRR | canonical Iran money currency in storage |
| Toman | **display unit only** (1 Toman = 10 Rial); never a ledger currency |
| `baseCurrencyAtOperation` | immutable snapshot on the operation |
| `costCurrency` | fixed per cost pool at creation; default = base at first cost-bearing event |

---

## 4.3 Instrument identity

| Rule | |
|------|--|
| `instrumentId` | `ref_instruments.id` **ONLY** |
| `symbol` | label |
| `assetKey` | system/provider index (`SYSTEM_INDEX`) |
| ISIN / ticker / contract | attributes |
| Distinct economic identity | may be distinct instruments (e.g. USDT-TRC20 vs USDT-ERC20) |

---

## 4.4 Cash

| Rule | |
|------|--|
| Cash SoT | **`fin_accounts` + `fin_journal_lines`** |
| Feature cash tables / `acc_transactions` | projection / event metadata only |
| Forbidden | second balance truth parallel to journal |

---

## 4.5 Financial operation

Every financial **mutation**:

```text
Feature Command
  → Operation Builder
  → validate
  → Domain ledger
  → Journal / Cash
  → projection rebuild
  → COMMIT
  → durable persistence
```

- `operationId` = idempotency key (+ `commandHash`)
- Reversal = **new** operation linked to original (never mutate posted amounts in place)

---

## 4.6 Immutability

Posted financial amount / qty / money date / account fields are **immutable**.

Correction path only:

```text
original → reversal operation → corrected operation
```

Never overwrite posted money to create new truth.

---

## 4.7 Fee

One economic fee = one **CanonicalFeeEvent**.

Every fee defines:

```text
funding asset
funding location
amount / quantity
currency / instrument
valuation rate
accounting treatment
quantity effect
cost effect
P&L effect
wealth effect
```

Same fee must not hit both cost and cash/P&L paths unless treatment documents **separate** economic components.

---

## 4.8 FX

Canonical rate meaning:

```text
1 fromCurrency = rate toCurrency
amountTo = amountFrom × rate
```

Multi-hop:

```text
amountOut = amountIn × product(pathLegRates)
```

Persist selected **path** when hop count > 1.  
`sourcePriorityRank` from versioned `sourcePriorityOrder` only.

---

## 4.9 Historical valuation

One **ValuationContext** per historical query:

```text
valuationAsOf
priceAsOf
fxAsOf
cashAsOf
liabilityAsOf
baseCurrency
valuationMode
cashScope
liabilityScope
```

Forbidden: “latest price + old cash” mixed historical reports.

---

## 4.10 Price / FX source failure

Missing data **never** silently becomes zero.

Statuses:

```text
VALID | STALE | MISSING_INPUT | DEGRADED | FAILED
```

Plus attribution: `exact | degraded | unavailable`.

---

## 4.11 Rebuild

```text
same ledger
+ same engineVersions
+ same asOf / ValuationContext
+ same price/FX datasets
→ same result
```

Rebuild is **offline**; must not call a live provider.

---

## 4.12 Reconciliation

```text
detect → explain expected vs actual → user-approved repair (if any) → audit → rebuild
```

**No silent repair.**

---

## 4.13 Persistence

```text
WAL / intent
  → primary commit (SQL)
  → durable secondary persistence (IndexedDB / storage)
  → persisted state
```

UI **«ثبت شد»** = documented **durable** state — not RAM-only SQL commit.

**P0-FIX-017…020:** see `AUDIT-HISTORY-NOTE.md` (immutable rows, full ValuationContext, FX path, reconcile≠repair).
