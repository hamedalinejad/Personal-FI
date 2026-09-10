import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openDb, closeAllDbs } from "../../persistence/port.js";
import { resolveOrCreateInstrument } from "./resolve.js";
import { buyCrypto } from "../../../features/crypto/public-api/index.js";
import { subscribeFund } from "../../../features/funds/public-api/index.js";
import { scopedAccountId } from "../../accounting/chartOfAccounts.js";

test("R-019 USDT TRC20 vs ERC20 are distinct instruments", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-id-"));
  const db = openDb(dataDir);
  const now = new Date().toISOString();
  resolveOrCreateInstrument(db, {
    instrumentId: "usdt-trc20",
    assetClass: "crypto",
    symbol: "USDT",
    networkIdentifier: "TRC20",
    now,
  });
  resolveOrCreateInstrument(db, {
    instrumentId: "usdt-erc20",
    assetClass: "crypto",
    symbol: "USDT",
    networkIdentifier: "ERC20",
    now,
  });
  const rows = db.prepare(`SELECT id, network_identifier FROM ref_instruments WHERE symbol='USDT'`).all();
  assert.equal(rows.length, 2);
  assert.throws(
    () =>
      resolveOrCreateInstrument(db, {
        instrumentId: "usdt-trc20",
        assetClass: "crypto",
        symbol: "USDT",
        networkIdentifier: "ERC20",
        now,
      }),
    (e) => /NETWORK_MISMATCH|INSTRUMENT_NETWORK/.test(String(e && e.message)),
  );
  closeAllDbs();
});

test("R-019 reject symbol mismatch on existing instrument id", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-id2-"));
  const db = openDb(dataDir);
  const now = new Date().toISOString();
  resolveOrCreateInstrument(db, {
    instrumentId: "btc-1",
    assetClass: "crypto",
    symbol: "BTC",
    now,
  });
  assert.throws(
    () =>
      resolveOrCreateInstrument(db, {
        instrumentId: "btc-1",
        assetClass: "crypto",
        symbol: "ETH",
        now,
      }),
    /SYMBOL_MISMATCH/,
  );
  closeAllDbs();
});

test("R-019 same fund two accounts stay separate holdings", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fund-scope-"));
  const db0 = openDb(dataDir);
  const now = new Date().toISOString();
  for (const id of ["acc-a", "acc-b"]) {
    db0.prepare(
      `INSERT INTO acc_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
       VALUES (?, ?, 'investment', 'IRR', 0, ?, ?, 'active')`,
    ).run(id, id, now, now);
  }
  closeAllDbs();
  await subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-x",
        symbol: "F1",
        units: "10",
        transactionPrice: "100",
        nav: "100",
        currency: "IRR",
        businessDate: "2026-01-01",
        accountId: "acc-a",
      },
    },
    { dataDir },
  );
  await subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-x",
        symbol: "F1",
        units: "5",
        transactionPrice: "100",
        nav: "100",
        currency: "IRR",
        businessDate: "2026-01-01",
        accountId: "acc-b",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const rows = db.prepare(`SELECT account_id, quantity FROM inv_fif_holdings WHERE instrument_id=?`).all("fund-x");
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.account_id === "acc-a").quantity, "10");
  assert.equal(rows.find((r) => r.account_id === "acc-b").quantity, "5");
  closeAllDbs();
});

test("R-019 scoped cash accounts differ by currency", () => {
  assert.notEqual(
    scopedAccountId("local_settlement_cash", "IRR"),
    scopedAccountId("local_settlement_cash", "USD"),
  );
});
