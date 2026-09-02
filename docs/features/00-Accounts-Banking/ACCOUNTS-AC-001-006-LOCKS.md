# Accounts & Banking Locks AC-001 … AC-006 (P0)

---

## AC-001 — accountKind canonical

- Canonical field: **`accountKind`** (Core enum owner).
- Legacy `accountType` / product labels map via explicit migration table; not parallel competing enums in new writes.
- `bankProductType` (if any) is orthogonal product metadata, not a second kind system.

## AC-002 — Card data

- Store **last4** and/or payment **token** only.
- Full PAN / raw `cardNumber` forbidden (Deep Lock / security).

## AC-003 — credit_account & negative balance

**v1:** reject postings that would drive available/ledger balance negative **unless** the account is explicitly modeled as liability/credit with allowed negative (or separate credit limit model).

Silent overdraft on normal asset cash accounts = forbidden.

## AC-004 — Archive preconditions

Archive allowed only when:

1. Ledger balance = 0 (rebuild-verified), **and**
2. No blocking commitments (pending cheques, open loan liens on account, reserved budget holds if any, unsettled ops)

Zero balance alone is insufficient if commitments remain.

## AC-005 — IBAN / accountNumber uniqueness

```text
PARTIAL UNIQUE (institutionId, normalizedAccountNumber) WHERE active
PARTIAL UNIQUE (iban) WHERE iban IS NOT NULL AND active
```

Scope includes institution where national account numbers are not globally unique. Align BATCH-5 §10.

## AC-006 — Transfer fees

Transfer: principal legs + **independent fee economic leg** (or child fee lines on same operation with CanonicalFeeEvent).

Fee must not be double-counted inside principal amount without breakdown.

---

## Status: AC-001…AC-006 **LOCKED** 2026-09-02
