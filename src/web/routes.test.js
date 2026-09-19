import test from "node:test";
import assert from "node:assert/strict";
import { TOP_LEVEL_ROUTES, MORE_DESTINATIONS, isTopLevelRoute, resolveShellPath } from "./routes.js";
import { SURFACES } from "./surfaces.js";
import { createInitialShellState, completeOnboarding, enterRecovery } from "./shellState.js";
import { UI_FORBIDDEN_IMPORT_SUBSTR } from "./apiClient.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

test("Phase10 exactly six top-level routes (PRODUCT lock)", () => {
  assert.equal(TOP_LEVEL_ROUTES.length, 6);
  assert.ok(TOP_LEVEL_ROUTES.includes("/money"));
  assert.ok(TOP_LEVEL_ROUTES.includes("/more"));
  assert.ok(!TOP_LEVEL_ROUTES.includes("/reports"));
  assert.ok(MORE_DESTINATIONS.includes("/more/reports"));
  assert.ok(MORE_DESTINATIONS.includes("/more/settings"));
});

test("Phase10 resolve sheets under parent route", () => {
  assert.deepEqual(resolveShellPath("/more/reports"), { route: "/more", sheet: "/more/reports" });
  assert.equal(resolveShellPath("/loans/pay").route, "/loans");
  assert.equal(isTopLevelRoute("/crypto"), false);
});

test("Phase10 surfaces catalog complete", () => {
  for (const k of [
    "search",
    "quickAdd",
    "detailSheet",
    "transactionEditor",
    "accountSelector",
    "currencyFxSelector",
    "reportFilters",
    "backupRestore",
  ]) {
    assert.ok(SURFACES[k], k);
  }
});

test("Phase11 onboarding → ready", () => {
  let s = createInitialShellState();
  assert.equal(s.phase, "onboarding");
  s = completeOnboarding(s, { bookId: "b1", baseCurrency: "IRR", bookName: "Test" });
  assert.equal(s.phase, "ready");
  assert.equal(s.baseCurrency, "IRR");
});

test("Phase11 recovery captures error without wiping book", () => {
  let s = completeOnboarding(createInitialShellState(), { bookId: "b1", baseCurrency: "IRR" });
  s = enterRecovery(s, new Error("PERSISTENCE_FAILURE"));
  assert.equal(s.phase, "recovery");
  assert.equal(s.book.id, "b1");
  assert.match(s.lastError.message, /PERSISTENCE/);
});

test("Phase10 UI modules must not contain forbidden import substrings", () => {
  // apiClient.js defines the forbidden list — scan shell entry & routes only
  const files = ["src/web/routes.js", "src/web/shellState.js", "apps/web/src/main.js"];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.ok(!text.includes("../ledger/"), f);
    assert.ok(!text.includes("/commands/"), f);
    assert.ok(!text.includes("fin_journal"), f);
    assert.ok(!text.includes("schema.sql"), f);
    assert.ok(!text.includes("node:sqlite"), f);
  }
  // api client may only import public-api + reports + browser port
  const api = readFileSync("src/web/apiClient.js", "utf8");
  assert.ok(api.includes("public-api"));
  assert.ok(!api.includes("/ledger/"));
  assert.ok(!api.includes("/commands/"));
});
