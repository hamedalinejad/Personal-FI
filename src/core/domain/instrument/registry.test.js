import test from "node:test";
import assert from "node:assert/strict";
import {
  registerInstrument,
  resolveLookup,
  _resetRegistryForTests,
} from "./registry.js";

test("BUG-008 USDT networks distinct", () => {
  _resetRegistryForTests();
  const a = registerInstrument({
    assetClass: "crypto",
    symbol: "USDT",
    networkId: "TRC20",
  });
  const b = registerInstrument({
    assetClass: "crypto",
    symbol: "USDT",
    networkId: "ERC20",
  });
  assert.notEqual(a.id, b.id);
  assert.equal(
    resolveLookup({ assetClass: "crypto", symbol: "USDT", networkId: "TRC20" })
      .id,
    a.id,
  );
});
