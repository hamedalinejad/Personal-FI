# Schema Freeze Requirements

Before schema implementation is frozen, **every table** must document:

| Item | |
|------|--|
| table name | |
| column name | |
| type | financial amounts = **TEXT** decimal string |
| nullable | |
| default | |
| unit | |
| precision | via PrecisionPolicy / instrument |
| currency semantics | |
| SoT | RAW/DERIVED/… |
| owner | |
| immutable? | |
| FK | |
| ON DELETE | financial history ≈ RESTRICT |
| ON UPDATE | |
| unique indexes | |
| partial unique indexes | |
| structural CHECK | length/enum/NOT NULL — **not** sole numeric correctness |
| application/domain validation | Decimal rules |
| indexes | |
| migration introduced version | |
| delete/archive/void policy | |

**P0:** numeric financial fields are TEXT; SQLite CHECKs are not the only correctness layer.
