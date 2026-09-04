# Rounding Policy (canonical)

**Path authority:** `docs/core/rounding/Rounding-Policy.md` only.  
Any `docs/core/Rounding-Policy.md` at parent level must be a **thin pointer** here (B-012 / P1-FINAL-031).

Related: `Money-Decimal-Policy.md`, `Precision-Policy.md`, `Financial-Invariants.md` § decimal.

---

## Rules

| Rule | Contract |
|------|----------|
| Storage / API money | decimal **string** |
| Arithmetic | parse → Decimal engine → format string |
| `policyVersion` | stored on `fin_operations.engineVersions` / operation |
| Same input + same policyVersion | ⇒ same output (X-012) |
| Intermediate FX | prefer **round final only** to base minor unit (P0-FINAL-006); intermediate optional per version |

## Defaults (v1)

| Domain | Scale source |
|--------|----------------|
| IRR cash | 0 decimal places display; storage integer rial string preferred |
| USD/EUR | currency minor units (2) unless registry says otherwise |
| Crypto qty | `ref_instruments` / token decimals |
| Rates / FX | policy scale (e.g. 8–12) then final money round |

## Iran display

| Storage | Display |
|---------|---------|
| Rial (IRR) canonical | Toman = UI scale only (`isTomanDisplay`); never dual SoT |

## Feature rule

Features **must not** implement ad-hoc `Math.round` on money. Call Core RoundingPolicy.

## P0-FINAL / BATCH residue

Historical “Policy (ex-batch-2) §9” text lives here as: **single Rounding engine + policyVersion**.
