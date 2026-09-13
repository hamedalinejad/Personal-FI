# DEVELOPMENT (sole workflow / governance owner)

**Status:** CURRENT

Absorbs: DOCUMENTATION-STANDARD process, DEVELOPER-HANDOFF, READY-FOR-CODING, CODING-GATE, readiness verdicts, IMPLEMENTATION-READY-*, GO-NO-GO prose.

## Defect workflow
ONE DEFECT → ONE CODE FIX → ONE TEST → QUALITY-STATUS  
No new BUG-*/GAP-*/REQ-* authority markdown.

## Docs workflow
EXTRACT → MERGE → REPOINT → VALIDATE → ARCHIVE/DELETE

## Owner map
PRODUCT · ARCHITECTURE · FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE · DEVELOPMENT · modules/*

## Coding gates
npm test · npm run gates · boundaries · inventory · fixtures · money-number lint · schema sync

## Do not guess
Missing contract → OPEN/PARTIAL; do not invent columns, fee treatment, T+n, purity defaults.

## Comments in code
Describe the rule, not ticket ids (no BUG-/P0- as permanent comment markers).

## Schema PRs
schema.sql + manifest + field inventory in same change as consumers.

## Money in tests
Decimal/toDecimal only.
