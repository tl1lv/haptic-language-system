"use client";

import { cn } from "@/lib/cn";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, label, description, disabled }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {label}
        </p>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-ring relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "start-6" : "start-1"
          )}
        />
      </button>
    </div>
  );
}
