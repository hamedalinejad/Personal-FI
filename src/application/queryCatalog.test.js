import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isQueryId, listQueryIds, QUERY_CATALOG } from "./queryCatalog.js";

describe("queryCatalog", () => {
  it("exact membership only", () => {
    assert.equal(isQueryId("accounts.list"), true);
    assert.equal(isQueryId("accounts."), false);
    assert.equal(isQueryId("unknown.query"), false);
    assert.equal(isQueryId(""), false);
    assert.equal(isQueryId(null), false);
  });

  it("listQueryIds matches catalog keys", () => {
    const ids = listQueryIds();
    assert.ok(ids.includes("meta.book"));
    assert.ok(ids.includes("investments.holdings"));
    assert.equal(ids.length, Object.keys(QUERY_CATALOG).length);
  });

  it("catalog is frozen", () => {
    assert.ok(Object.isFrozen(QUERY_CATALOG));
  });
});
