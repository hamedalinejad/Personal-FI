import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EXPECTED_FK, ensureOperationPayloadTable, writeOperationPayload } from "./schemaHardening.js";

describe("schemaHardening REL-P1 / field payload", () => {
  it("EXPECTED_FK documents crypto exchange and network", () => {
    assert.ok(EXPECTED_FK["inv_crypto_holdings.exchange_id"]);
    assert.equal(EXPECTED_FK["inv_crypto_holdings.exchange_id"].status, "REQUIRED_REL_P1_01");
    assert.ok(EXPECTED_FK["inv_crypto_holdings.network_id"].nullMeans === "venue_offchain");
    assert.ok(EXPECTED_FK["inv_stocks_iran_holdings.account_id"]);
  });

  it("writeOperationPayload requires db.run", () => {
    const calls = [];
    const db = {
      run(sql, params) {
        calls.push({ sql, params });
      },
    };
    ensureOperationPayloadTable(db);
    writeOperationPayload(db, "op-1", { feeTreatment: "reduce_received" }, { hash: "abc" });
    assert.ok(calls.some((c) => String(c.sql).includes("fin_operation_payloads")));
    assert.ok(calls.some((c) => c.params && c.params[0] === "op-1"));
  });
});
