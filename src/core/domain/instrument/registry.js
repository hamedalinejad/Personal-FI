import { randomUUID } from "node:crypto";

/** In-memory registry — production → ref_instruments table */
const byId = new Map();
const byKey = new Map();

function keyOf({ assetClass, symbol, networkId, contractAddress }) {
  return [
    assetClass || "",
    (symbol || "").toUpperCase(),
    networkId || "",
    (contractAddress || "").toLowerCase(),
  ].join("|");
}

export function registerInstrument({
  assetClass,
  symbol,
  networkId = null,
  contractAddress = null,
  displaySymbol,
}) {
  if (!assetClass || !symbol) throw new Error("INSTR_REQUIRED");
  const k = keyOf({ assetClass, symbol, networkId, contractAddress });
  if (byKey.has(k)) return byKey.get(k);
  const id = randomUUID();
  const row = {
    id,
    assetClass,
    symbol: symbol.toUpperCase(),
    displaySymbol: displaySymbol || symbol,
    networkId,
    contractAddress,
  };
  byId.set(id, row);
  byKey.set(k, row);
  return row;
}

export function resolveById(id) {
  const row = byId.get(id);
  if (!row) throw new Error("INSTR_NOT_FOUND");
  return row;
}

/** Lookup only — never use symbol alone as historical identity without network */
export function resolveLookup({ assetClass, symbol, networkId = null, contractAddress = null }) {
  const k = keyOf({ assetClass, symbol, networkId, contractAddress });
  const row = byKey.get(k);
  if (!row) throw new Error("INSTR_NOT_FOUND");
  return row;
}

export function _resetRegistryForTests() {
  byId.clear();
  byKey.clear();
}
