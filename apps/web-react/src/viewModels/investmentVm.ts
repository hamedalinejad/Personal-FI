/** ViewModels for /investments — domain → display; missing price never becomes 0 */

export type PriceAvailability = "ok" | "missing" | "stale" | "unavailable";

export type MoneyDisplay = {
  canonical: string | null;
  display: string;
  availability: PriceAvailability;
};

export type ValuationContextVM = {
  reportCurrency: string;
  asOf: string | null;
  priceFreshness: "fresh" | "stale" | "unknown";
  fxStatus: "ok" | "missing" | "partial";
};

export type HoldingRowVM = {
  id: string;
  assetType: "crypto" | "stocks" | "funds" | "metals";
  instrumentLabel: string;
  quantityDisplay: string;
  cost: MoneyDisplay;
  marketValue: MoneyDisplay;
  unrealizedPnl: MoneyDisplay;
  priceDate: string | null;
  fxStatus: "ok" | "missing" | "n/a";
};

export function moneyOrDash(canonical: string | null | undefined, availability: PriceAvailability): MoneyDisplay {
  if (availability === "missing" || availability === "unavailable" || canonical == null || canonical === "") {
    return { canonical: null, display: "—", availability: availability === "ok" ? "unavailable" : availability };
  }
  if (availability === "stale") {
    return { canonical, display: `${canonical} (stale)`, availability: "stale" };
  }
  return { canonical, display: canonical, availability: "ok" };
}
