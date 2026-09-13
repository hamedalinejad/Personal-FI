# Architecture (owner)

Layers:
Feature UI → Feature Public API → Domain/Ledger → Atomic Operation → CashSettlementPort → Journal → SQLite

Rules:
* One cash SoT (journal)
* One instrument identity (ref_instruments.id)
* Decimal strings only for money/qty/rate
* Feature packages never import another feature's internals
* Standalone editions share Core; hide Accounts UI

Authority chain: concept homes → this file → feature modules → schema → runtime → fixtures.
