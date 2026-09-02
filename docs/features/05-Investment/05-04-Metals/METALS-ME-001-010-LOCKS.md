# Metals Locks ME-001 … ME-010 (P0)

---

## ME-001 — quantityMg is sole quantity SoT

- Storage/holding SoT quantity = **`quantityMg`** (gross mg).
- Coin counts = derived helper or input conversion only — not a second parallel SoT balance.

## ME-002 — quoteBasis mandatory

Every metals price observation: `quoteBasis` = `gross_metal` | `fine_metal` | `per_coin` | … (P0-061). Valuation must match basis.

## ME-003 — Purity-aware quotes

Price for 18K is not substitutable by 24K without explicit conversion policy. Quotes keyed by metalType + purityCode (and basis).

## ME-004 — Gold coin ≠ bullion

`gold_coin` (or per-coin instruments) separate instrument/quote semantics including premium/bubble; not bullion×purity only (P0-062).

## ME-005 — Platform cash

Platform cashBalance is **projection**; canonical cash via fin_account / venue cash model + CashSettlementPort. No competing prose SoT.

## ME-006 — Delivery request vs economic debit

| Status | Holding effect |
|--------|----------------|
| requested / processing | **no** economic qty debit (or reservation model only if explicitly documented) |
| delivered | economic transfer: metals qty down + PA lineage |

## ME-007 — Cancel after debit

If qty was debited before final delivery, **cancel requires Core reverse** (or compensating op). Prefer: no debit until delivered (ME-006).

## ME-008 — Fee categories

`deliveryFee` ≠ trading/spread fee. Separate FeeCategories / fee events; treatments independent.

## ME-009 — Metals → Physical cost

On delivered transfer: `sourceOperationId` + **transferred carrying cost** from metals holding (not mark price). See BATCH-3 §2 / P0-063.

## ME-010 — Making / labor / tax breakdown

Making charge, labor, VAT/tax components = explicit fee/tax component lines with treatment (cost vs expense vs tax event) — not one opaque “extra” amount.

---

## Status: ME-001…ME-010 **LOCKED** 2026-09-02
