# Fixture Harness (docs-only phase)

Golden JSON fixtures live in `/fixtures` and `docs/core/fixtures/`.

**Runtime harness** (`src/core/fixtures/harness.ts`) was removed from `main` during the documentation-only cleanup (2026-09-04).  
Restore on the **implementation branch** together with vitest CI.

Until then:

- Fixtures remain the **numeric contract** (all money/qty/rate = decimal strings).
- Gate C is **BLOCKED** for Feature coding until harness is restored and green.

See `OPEN-004-FIXTURE-GAP.md`, `CODING-GATE.md`, `GO-NO-GO.md`.
