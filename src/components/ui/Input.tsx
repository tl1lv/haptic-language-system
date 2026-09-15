"use client";

import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, className, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "focus-ring h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100",
          error
            ? "border-red-400 dark:border-red-600"
            : "border-slate-300 dark:border-slate-700",
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});
