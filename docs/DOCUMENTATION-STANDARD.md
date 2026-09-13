# DOCUMENTATION-STANDARD

**Status:** LOCKED · **Owner of this file:** Development governance  
**Normative product rules live in owner docs below — this file only defines structure.**

## 1. Purpose
One standard for all Personal-FI human documentation after consolidation.

## 2. Allowed human documents

```
docs/
  README.md                 # Entry + chain
  DOCUMENTATION-STANDARD.md # This file (structure only)
  PRODUCT.md
  ARCHITECTURE.md
  FINANCIAL-CORE.md
  DATA-MODEL.md
  API.md
  REPORTING.md
  OFFLINE-RELEASE.md
  DEVELOPMENT.md
  QUALITY-STATUS.md         # Live gates only — not a second product spec
  modules/                  # Exactly 11 feature owners
  archive/AUDIT-HISTORY.md  # Pointer only
  core/                     # MACHINE ONLY (no normative prose except README pointer)
```

No other human-facing markdown under `docs/` is allowed without updating this list.

## 3. Forbidden
- New BUG-*, GAP-*, REQ-*, AUDIT-*, VERDICT-*, MATRIX-* specification files
- Second owners for the same concept
- Ghost cash ledgers as tables
- Competing enums for one concept
- Ticket IDs as domain vocabulary in normative text
- Expanding documentation instead of fixing code/tests

## 4. Owner map (one concept → one owner)

| Concept | Owner |
|---------|--------|
| Product scope, editions, IA | PRODUCT.md |
| Layers, ports, boundaries | ARCHITECTURE.md |
| Money, journal, fee, FX, cost, reversal, cash truth | FINANCIAL-CORE.md |
| Fields, identity, no-field-loss | DATA-MODEL.md |
| Envelope, errors, idempotency | API.md |
| GL/TB/BS/IS/CF, valuation reports | REPORTING.md |
| Persistence, offline, recovery, release | OFFLINE-RELEASE.md |
| How to change repo, CI gates, module template | DEVELOPMENT.md |
| Feature behavior | modules/<feature>.md |

## 5. Machine artifacts (not optional clutter)
Keep under `docs/core/`:
- `db/schema.sql`, `db/schema.manifest.json`
- `registry/*.json`
- `field-inventory.checklist.tsv`
- `json-schemas/*`
- `RELEASE-EVIDENCE.json` when used by gates

Executable fixtures: repository `fixtures/*.json` and `src/**/tests`.

## 6. Module standard
Each `docs/modules/*.md` follows the 34-section template in DEVELOPMENT.md.

## 7. Change protocol
| Change | Action |
|--------|--------|
| Bug in code | Fix code → test → QUALITY-STATUS if needed |
| Business rule | Update **one** owner doc → fixture/test → code |
| Architecture | ARCHITECTURE + affected owners → tests |
| History | Git only; do not revive archive prose as authority |

## 8. Coding handoff chain
```
PRODUCT → ARCHITECTURE → FINANCIAL-CORE → DATA-MODEL → API
→ REPORTING → OFFLINE-RELEASE → DEVELOPMENT → modules/<feature>
→ schema.sql → fixtures → tests
```

## 9. Completion criteria
Documentation is **standardized** when:
1. Allowed tree matches §2
2. No dual authority for one rule
3. Machine files remain
4. `docs-validator` passes
5. Tests pass
6. Release remains NO_GO until RELEASE_PROVEN evidence

## 10. Explicit non-goals of this file
This is not a second Financial Core, Product map, or bug register.
