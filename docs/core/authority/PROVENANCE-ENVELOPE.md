---
id: DOC-AUTH-PROVENANCE
title: Minimum provenance envelope for imported/reported facts
status: approved
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# DATA-003

For imported or externally reported financial facts, prefer:

```text
source_type
source_reference
import_batch_id
source_document_id
```

External provider IDs: **provider namespace + external ID**, not one global ambiguous ID.

Tables that already carry import linkage: `import_raw_records`, selected feature rows with `import_batch_id`.
