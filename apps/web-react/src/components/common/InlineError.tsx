import React from "react";

export function InlineError({ message }: { message: string }) {
  return (
    <p role="alert" className="error">
      {message}
    </p>
  );
}
