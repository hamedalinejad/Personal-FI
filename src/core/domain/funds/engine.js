import { assertPositive, assertNonNegative, toNum } from "../../money/decimalMath.js";

export function subscribe({ quantity, nav, transactionPrice }) {
  const q = assertPositive(quantity);
  const n = assertPositive(nav);
  const tx = transactionPrice != null ? assertPositive(transactionPrice) : n;
  return {
    quantity: String(q),
    costTotal: String(q * tx),
    nav: String(n),
    transactionPrice: String(tx),
    valuationMode: n === tx ? "nav" : "transaction_price",
  };
}

export function reinvestDistribution({ cashAmount, nav }) {
  const cash = assertPositive(cashAmount);
  const n = assertPositive(nav);
  const q = cash / n;
  return {
    legs: [
      { type: "distribution_income", amount: String(cash) },
      { type: "subscribe", quantity: String(q), nav: String(n), costTotal: String(cash) },
    ],
    // one operation two legs — no duplicate bank cash
  };
}
