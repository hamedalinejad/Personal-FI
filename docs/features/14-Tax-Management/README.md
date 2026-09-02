# Feature: Tax Management

## Source of Truth
- tax_records / tax_events; payTax single operation path

## Dependencies
- Core: Canonical-Financial-Operation, relevant engines/ports
- Cross-feature only via ports/adapters (see Feature-Package-Architecture)

## Vocabulary
- `docs/core/NAMING-GLOSSARY.md` (operation vs transaction; reversed vs cancelled vs archived)

## Out of scope
- See main feature document in this folder
