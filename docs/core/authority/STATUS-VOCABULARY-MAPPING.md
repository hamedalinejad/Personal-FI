---
id: DOC-AUTH-STATUS-MAP
title: Status Vocabulary Mapping
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

# Single vocabulary (STATUS-TAXONOMY)

Primary statuses:

```text
SPEC_LOCKED | IMPLEMENTED | PARTIAL | BLOCKED | DEFERRED | CLOSED_HISTORICAL
```

Release proof:

```text
GOLDEN-GREEN | RECOVERY-GREEN | RELEASE-PROVEN
```

## Formal mapping of informal terms

| Informal (deprecated in registries) | Official meaning |
|-------------------------------------|------------------|
| INTEGRATED | `IMPLEMENTED` for that **command** on Core operation path (port + journal + domain txn) |
| INTEGRATED + Fee Engine | `IMPLEMENTED` **and** fees route through Core Fee Engine |
| READY TO IMPLEMENT | Not a status — means specs locked enough to code (`SPEC_LOCKED` package) |
| DONE / GREEN / READY | Forbidden as synonyms |

Command registry must use only official terms. Example:

```text
crypto.buy → IMPLEMENTED (PARTIAL feature surface)
funds.subscribe → IMPLEMENTED (no Fee Engine path yet)
```
