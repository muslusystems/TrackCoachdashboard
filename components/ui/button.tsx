import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-gradient-to-b from-signal-500 to-signal-700 text-white shadow-card hover:from-signal-600 hover:to-signal-800",
        variant === "secondary" &&
          "bg-white text-ink-800 border border-ink-200 hover:border-signal-300 hover:bg-signal-50",
        variant === "ghost" && "text-ink-600 hover:bg-ink-100",
        className
      )}
      {...props}
    />
  );
}
