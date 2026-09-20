import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COMMAND_REGISTRY,
  isRegisteredCommand,
  isRegisteredQuery,
  getRegistryEntry,
  buildCommandHandlers,
  capabilityFor,
} from "./commandRegistry.js";

describe("commandRegistry R-M27", () => {
  it("is frozen", () => {
    assert.ok(Object.isFrozen(COMMAND_REGISTRY));
  });

  it("commands and queries are disjoint kinds", () => {
    for (const [id, e] of Object.entries(COMMAND_REGISTRY)) {
      assert.ok(e.kind === "command" || e.kind === "query", id);
      if (e.kind === "command") {
        assert.equal(isRegisteredCommand(id), true);
        assert.equal(isRegisteredQuery(id), false);
      } else {
        assert.equal(isRegisteredQuery(id), true);
        assert.equal(isRegisteredCommand(id), false);
      }
    }
  });

  it("every command with handler is buildable", () => {
    const handlers = buildCommandHandlers();
    for (const [id, e] of Object.entries(COMMAND_REGISTRY)) {
      if (e.kind === "command" && e.handler) {
        assert.equal(typeof handlers[id], "function", id);
      }
    }
  });

  it("import.commitBatch is registered but must not pretend complete import", () => {
    const e = getRegistryEntry("import.commitBatch");
    assert.ok(e);
    assert.equal(e.kind, "command");
    assert.equal(e.module, "import");
  });

  it("capabilityFor returns capability string", () => {
    assert.equal(capabilityFor("accounts.deposit"), "accounts.*");
    assert.equal(capabilityFor("meta.book"), "meta.*");
  });

  it("unknown id is not registered", () => {
    assert.equal(isRegisteredCommand("no.such.command"), false);
    assert.equal(isRegisteredQuery("no.such.query"), false);
    assert.equal(getRegistryEntry("no.such"), null);
  });
});
