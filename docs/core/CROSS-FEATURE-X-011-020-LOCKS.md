# Cross-Feature Locks X-011 … X-020

---

## X-011 — Fee: one economic effect

- Use **CanonicalFeeEvent** (or equivalent) + explicit `feeTreatment` (into cost basis / from proceeds / expense / burn qty / …).
- `feeAmount` total and breakdown components must not both hit cost/P&L as independent full effects.
- **Acceptance:** each fee unit of economics applies **once**.

See `Fee-Treatment-Matrix.md`.

---

## X-012 — Precision / rounding single engine

- All Features call Core **RoundingPolicy / Precision engine** with `policyVersion` stored on the operation.
- Feature-local ad-hoc round that diverges from engine = forbidden.
- **Acceptance:** same input + same policyVersion ⇒ same result.

See `Rounding-Policy.md`, BATCH-2 §9.

---

## X-013 — Offline valuation / rebuild

- Rebuild and valuation paths use **local** last-known or manual prices + `stale` flags.
- Must not require live provider/network.
- **Acceptance:** airplane mode — post transaction + rebuild succeeds.

See Offline-Requirements, BATCH-4 §3, P0-095.

---

## X-014 — Durability dual-store

- States: intent / pendingCommit / primary committed / secondary persisted / durable_fully (names per Persistence-State-Machine).
- Crash between SQLite and IDB (or secondary) must not **lose** a user-acknowledged financial op; recovery completes or rolls back safely.
- **Acceptance:** no silent lost financial operation after crash mid dual-write.

See `Persistence-State-Machine.md`, BATCH-4 §10.

---

## X-015 — Deterministic ordering for rebuild

Sort key for replay/rebuild:

```text
businessDate | effectiveDate  ASC
createdAt                     ASC
stable id (operationId / row id) ASC
```

- Date-only ordering insufficient when two events share a day.
- **Acceptance:** two same-day events always apply in the same order.

---

## X-016 — One SoT per metric

- Reports must not sum the same economic fact from domain + journal + cash snapshots independently.
- Each metric declares **one** SoT path (e.g. journal for cash, domain rebuild for holding qty, explicit bridge for P&L).
- **Acceptance:** no duplicate aggregation of the same cash/position effect.

See P0-090 metrics, Essential-Reports.

---

## X-017 — Data preservation legacy vs canonical

- **New writes:** canonical fields only.
- **Legacy fields:** read-only for migration/display.
- **Raw import:** preserved; normalization derived.
- **Acceptance:** import/export roundtrip field loss = 0 for preserved/raw/canonical mapped fields.

See Data-Preservation-Contract, Import lineage, BATCH-4 §4.

---

## X-018 — Audit on sensitive mutations

- Repair, reversal, correction, migration apply: `fin_audit_log` with actor, source, reason, **operationId**.
- **Acceptance:** every repair/reversal is traceable to actor + operation graph.

See Audit-vs-Financial-Event, BATCH-5 §1.

---

## X-019 — Every projection has rebuild

- Any snapshot/projection exposed to UI or reports implements:
  - `reconcileX` (compare to SoT)
  - `rebuildXFromLedger` (or Core equivalent)
- **Acceptance:** intentional snapshot corruption ⇒ reconcile mismatch.

See Reconciliation-Foundation, Feature-API-Contract §3.

---

## X-020 — Architecture enforced, not prose-only

- Feature independence and “no direct cross-feature repository imports” enforced by:
  - ESLint boundaries / dependency-cruiser / architecture tests
  - CI fail on illegal dependency
- Prose alone is insufficient.
- **Acceptance:** illegal dependency fails CI.

See Feature-Package-Architecture, BATCH-5 §7–§8.

---

## Status

| ID | Status |
|----|--------|
| X-011 … X-020 | **LOCKED** 2026-09-02 |

