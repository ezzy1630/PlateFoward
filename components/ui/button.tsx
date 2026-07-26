"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-orange text-white hover:bg-orange-600 active:bg-orange-600",
  secondary: "bg-navy text-fog hover:bg-navy-600 active:bg-navy-600",
  ghost: "bg-transparent text-navy hover:bg-navy-100 active:bg-navy-200",
  danger: "bg-error text-white hover:opacity-90 active:opacity-80",
  outline: "border-2 border-navy-200 text-navy hover:border-navy hover:bg-navy-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm min-h-[36px]",
  md: "px-5 py-3 text-[0.9375rem] min-h-[44px]",
  lg: "px-7 py-4 text-base min-h-[52px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "btn-base",
          variantStyles[variant],
          sizeStyles[size],
          loading && "cursor-wait",
          className,
        )}
        {...props}
      >
        {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
