import React from "react";

export function LoadingState({ label = "بارگذاری…" }: { label?: string }) {
  return (
    <p className="muted" role="status" aria-live="polite">
      {label}
    </p>
  );
}
