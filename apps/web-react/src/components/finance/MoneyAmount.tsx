import React from "react";
import type { MoneyVM } from "../../viewModels/accountVm";

export function MoneyAmount({ value }: { value: MoneyVM }) {
  if (value.availability !== "available" || value.raw == null) {
    return <span className="money missing">—</span>;
  }
  return <span className="money">{value.display}</span>;
}
