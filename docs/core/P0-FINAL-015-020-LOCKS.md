# P0-FINAL-015 … 020 — Data model / persistence

---

## P0-FINAL-015 — deletedAt vs financial immutability

Three categories (no single soft-delete pattern for all rows):

| Category | Delete policy |
|----------|----------------|
| **Master / reference** (accounts, instruments, categories, parties) | soft-delete / archive allowed per Deletion-Policy-Matrix |
| **Posted financial operation** (+ immutable domain legs, journal lines) | **no delete**; correction = Core reverse only |
| **Unposted draft** | delete/cancel per draft policy |

`deletedAt` on **posted** financial operation / journal line / posted domain tx is **forbidden** as a deletion path. If column exists for schema uniformity, it must remain NULL forever on posted rows; writers reject non-null.

---

## P0-FINAL-016 — updatedAt on posted financial data

| Field class after post | Writable? |
|------------------------|-----------|
| Financial amounts, qty, dates of economic meaning, accounts | **immutable** |
| Provenance/audit-only columns (explicit allow-list) | optional controlled update |
| `updatedAt` | **frozen at post** for financial rows **or** only bumps on allow-listed metadata amendment — never on amount edits |

v1 LOCK: posted financial rows → `updatedAt = postedAt` effectively; no UPDATE of financial columns; metadata amendments use audit log + optional `metadataUpdatedAt`, not silent amount change.

---

## P0-FINAL-017 — Field Kind enum (canonical)

```text
RAW
DERIVED
SNAPSHOT
EXTERNAL_REPORTED
LABEL
SYSTEM_INDEX
```

- Replace prose `LABEL / INDEX` with **`SYSTEM_INDEX`** for `assetKey` and similar.
- All Feature matrices must use only this enum.

---

## P0-FINAL-018 — feeInstrumentId vs feeCurrency

```text
feeCurrency        // fee settled as currency/cash (ISO or system currency code)
feeInstrumentId    // fee settled as crypto/security/metal instrument qty
```

**Rules:**

1. At least one required when feeAmount/feeQuantity > 0.
2. **Prefer exclusive:** cash fee → `feeCurrency` set, `feeInstrumentId` null; asset fee → `feeInstrumentId` set, `feeCurrency` null.
3. Simultaneous both only when explicit dual representation (currency mirror of instrument) — rare; must not double-count economics (one CanonicalFeeEvent).
4. Legacy `feeAssetInstrumentId` → rename/alias to `feeInstrumentId`.

---

## P0-FINAL-019 — Holding uniqueness (exact)

```text
locationKind: 'venue_offchain' | 'wallet_onchain' | …

venue_offchain:
  UNIQUE(exchangeId, instrumentId)
  networkId IS NULL

wallet_onchain:
  UNIQUE(exchangeId, networkId, instrumentId)
  networkId IS NOT NULL
```

Enforce with **partial unique indexes** (or check constraint on locationKind). Not two unconditional UNIQUEs on the same table without predicates.

---

## P0-FINAL-020 — acc_transactions vs journal

```text
journal (fin_journal_lines) = accounting cash/equity SoT

acc_transactions =
  bank/Accounts UX event stream + optional projection helper
  NOT a second independent accounting SoT for the same cash movement
```

Per operation:

1. One financial operation posts **journal** (and domain investment legs as needed).
2. If Accounts Feature materializes `acc_transactions`, it is **linked** (`operationId`) and rebuildable/projection — or explicit “Accounts domain event” that **feeds** the same operation, never a parallel sum in reports.

Reports must not do `sum(acc_transactions) + sum(journal)` for the same pocket.

---

## Status

| ID | Status |
|----|--------|
| P0-FINAL-015…020 | **LOCKED** |
