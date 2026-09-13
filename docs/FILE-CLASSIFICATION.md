# File classification

Statuses: **CURRENT** | **MERGE** | **ARCHIVE** | **GENERATED** | **DELETE**

## CURRENT
docs/PRODUCT.md · ARCHITECTURE.md · FINANCIAL-CORE.md · DATA-MODEL.md · API.md · REPORTING.md · OFFLINE-RELEASE.md · DEVELOPMENT.md · modules/* · QUALITY-STATUS.md · DOCUMENTATION-STANDARD.md · MODULE-TEMPLATE.md · README.md

## MERGE (pointer only)
Product-Map-*.md · Project-Blueprint.md · Technical-Architecture.md · API-Reference.md · READY-FOR-CODING.md · DEVELOPER-HANDOFF.md

## ARCHIVE
docs/archive/** — including core-status, core-legacy, authority-pointers

## GENERATED / MACHINE
docs/core/db/schema.sql · schema.manifest.json · field-inventory · fixtures · scripts/

## DELETE
Only after unique rules = 0 and inbound refs = 0 (prefer ARCHIVE first).

## Protocol
EXTRACT → MERGE → REPOINT → VALIDATE → ARCHIVE/DELETE  
Forbidden: new public BUG/GAP authority files.

## MERGE deletion policy
Run reference search across repo before DELETE. Prefer ARCHIVE over DELETE.
