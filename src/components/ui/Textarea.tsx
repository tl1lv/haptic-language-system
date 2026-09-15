"use client";

import { forwardRef, type TextareaHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  function Textarea({ label, error, className, id, ...props }, ref) {
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
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "focus-ring min-h-[6rem] w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
            error && "border-red-400 dark:border-red-600",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
