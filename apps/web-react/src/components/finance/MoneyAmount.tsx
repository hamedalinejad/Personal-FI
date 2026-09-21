import React from "react";

/** Display-only — value is already formatted or raw string */
export function MoneyAmount({ value }: { value: string | { display?: string; raw?: string; availability?: string } }) {
  if (typeof value === "string") {
    return <span className="money">{value}</span>;
  }
  if (value.availability && value.availability !== "available") {
    return <span className="money missing">—</span>;
  }
  return <span className="money">{value.display ?? value.raw ?? "—"}</span>;
}
