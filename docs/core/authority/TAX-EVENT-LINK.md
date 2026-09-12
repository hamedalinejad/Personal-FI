---
id: DOC-AUTH-TAX-LINK
title: Investment feeTax vs tax liability
status: approved
---

# TAX-001

```text
investment transaction
  → optional linked tax_events row (operation_id)
  → separate tax_records / filing obligation if needed
```

`feeTax` on a trade is a **fee component**, not a tax liability.  
Never fold filing liability into `feeTax`.
