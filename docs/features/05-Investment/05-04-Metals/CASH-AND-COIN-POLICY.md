---
id: DOC-METAL-001-002
title: Metals cash derivation and coin identity
status: approved
---

**METAL-001:** Platform `cashBalance` (if present in projections) is **derived** from journal. Writes only via Operation + Journal.

**METAL-002:** `gold_coin` instruments use instrument quote basis by default. Fine-weight × bullion price is **analytical only** (`valuationMode=explicit_analytical`).
