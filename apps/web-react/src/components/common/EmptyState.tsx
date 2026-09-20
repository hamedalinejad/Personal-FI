import React from "react";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty" role="status">
      <p>{title}</p>
      {hint ? <p className="muted">{hint}</p> : null}
    </div>
  );
}
