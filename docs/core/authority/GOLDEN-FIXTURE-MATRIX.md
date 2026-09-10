---
id: DOC-AUTH-GOLDEN
title: Required Golden Fixture Matrix
status: reviewed
version: 0.1
updated: 2026-09-10
---

# Required golden fixture matrix

Do not delete a golden skeleton merely because expected values are incomplete.

## Core

income, expense, transfer, fee, reversal, correction, opening balance, multi-currency, Toman input, idempotency

## Crypto

buy fee-from-received / fee-in-quote / fee-from-base, sell, same-owner transfer, external receive/gift, airdrop, network burn, bridge, C2C swap, USDT/IRR historical FX, multi-hop FX, inverse FX

## Stocks Iran

buy, sell, fee breakdown, trade/settlement, dividend gross/net, bonus, split, reverse split, capital increase, rights (+ exercise/sale/CIL), broker transfer, delisting/write-off

## Funds

subscribe, redeem, distribution, reinvest, NAV ≠ transaction price, ETF market valuation, fee, cash settlement

## Metals

18K, 24K, coin, bullion, gross/fine, making/labor, premium, fee, delivery (+ fee/cancel), metals→physical

## Loans

bullet, flat, equal-principal declining, variable rate, grace, partial payment, early settlement, fee due/paid/waived, penalty, multi-currency repayment, reversal

## Recovery

crash before commit, crash after SQL, restore, backup, attachment restore, unknown import, interrupted migration, same operation replay, conflict replay, snapshot deletion + rebuild, license down/upgrade
