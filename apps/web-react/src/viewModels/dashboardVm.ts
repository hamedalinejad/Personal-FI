<<<<<<< HEAD
export type MetricVM = {
  id: string;
  label: string;
  state: "loading" | "ready" | "unavailable";
  display?: string;
  hint?: string;
};

=======
/** Dashboard widget presentation states — missing price ≠ zero */

export type WidgetState = "loading" | "available" | "empty" | "missing" | "error";

export type MetricVM = {
  id: string;
  label: string;
  state: WidgetState;
  display: string;
  hint?: string;
};

export type DashboardSectionId =
  | "netWorth"
  | "cash"
  | "investments"
  | "loans"
  | "incomeExpense"
  | "bills"
  | "alerts"
  | "recent"
  | "quickActions";

export function metricUnavailable(id: string, label: string, reason = "unavailable"): MetricVM {
  return { id, label, state: "missing", display: "—", hint: reason };
}

>>>>>>> origin/main
export function metricLoading(id: string, label: string): MetricVM {
  return { id, label, state: "loading", display: "…" };
}

<<<<<<< HEAD
export function metricUnavailable(id: string, label: string, hint: string): MetricVM {
  return { id, label, state: "unavailable", display: "—", hint };
=======
export function metricValue(id: string, label: string, display: string): MetricVM {
  return { id, label, state: "available", display };
>>>>>>> origin/main
}
