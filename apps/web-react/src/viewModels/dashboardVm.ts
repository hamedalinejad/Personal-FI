export type MetricVM = {
  id: string;
  label: string;
  state: "loading" | "ready" | "unavailable";
  display?: string;
  hint?: string;
};

export function metricLoading(id: string, label: string): MetricVM {
  return { id, label, state: "loading", display: "…" };
}

export function metricUnavailable(id: string, label: string, hint: string): MetricVM {
  return { id, label, state: "unavailable", display: "—", hint };
}
