"use client";

import { forwardRef, type SelectHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, className, id, children, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          "focus-ring h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});
