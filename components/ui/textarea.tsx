"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-navy">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full rounded-box border border-navy-200 bg-surface px-4 py-3 text-sm text-navy placeholder:text-fog-600 focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange transition-colors min-h-[44px] resize-y",
            error && "border-error focus:border-error focus:ring-error",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
        {error && (
          <p className="text-xs text-error" role="alert">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
