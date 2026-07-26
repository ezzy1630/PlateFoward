"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

type BadgeVariant = "default" | "success" | "error" | "warning" | "info" | "demo";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-navy-100 text-navy",
  success: "bg-navy text-fog",
  error: "bg-error-100 text-error",
  warning: "bg-orange-100 text-orange",
  info: "bg-navy-200 text-navy-800",
  demo: "inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-orange bg-orange-100 rounded-full",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {variant === "demo" && (
        <span className="h-1.5 w-1.5 rounded-full bg-orange" />
      )}
      {children}
    </span>
  );
}
