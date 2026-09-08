import { assertPositive } from "../../money/decimalMath.js";

export function subscribe({ quantity, nav, transactionPrice }) {
  const q = assertPositive(quantity);
  const n = assertPositive(nav);
  const tx = transactionPrice != null ? assertPositive(transactionPrice) : n;
  return {
    quantity: q.toFixed(),
    costTotal: q.times(tx).toFixed(),
    nav: n.toFixed(),
    transactionPrice: tx.toFixed(),
    valuationMode: n.eq(tx) ? "nav" : "transaction_price",
  };
}

export function reinvestDistribution({ cashAmount, nav }) {
  const cash = assertPositive(cashAmount);
  const n = assertPositive(nav);
  const q = cash.div(n);
  return {
    legs: [
      { type: "distribution_income", amount: cash.toFixed() },
      {
        type: "subscribe",
        quantity: q.toFixed(),
        nav: n.toFixed(),
        costTotal: cash.toFixed(),
      },
    ],
  };
}
