# Module: Tax

**Owner:** this file

## Entities
* **TaxEvent** — economic/tax accounting event  
* **TaxRecord** — user-facing obligation / filing record  
Relation: record → 0..N events; payment only via `payTax` operation.

## Rule
`status=paid` only through payTax path — never bare status mutation.

## Deferred
Full jurisdiction rule engine · loss carry detailed policy.
