"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={clsx("flex items-start gap-3", className)}>
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-navy-200 bg-surface text-orange focus:ring-2 focus:ring-orange focus:ring-offset-1 checked:border-orange checked:bg-orange appearance-none checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%3E%3Cpath%20d%3D%22M20%206L9%2017l-5-5%22%2F%3E%3C%2Fsvg%3E')] checked:bg-center checked:bg-no-repeat"
          {...props}
        />
        <label htmlFor={inputId} className="cursor-pointer">
          <span className="text-sm font-medium text-navy">{label}</span>
          {description && (
            <span className="block text-xs text-fog-600 mt-0.5">{description}</span>
          )}
        </label>
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
