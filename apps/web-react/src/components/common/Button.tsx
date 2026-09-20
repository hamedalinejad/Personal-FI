import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", type = "button", children, ...rest }: Props) {
  return (
    <button type={type} className={`btn btn-${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
