import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { Priority } from "@/types";
import { PRIORITY_LABELS } from "@/types";

type Variant = "default" | "primary" | "success" | "warning" | "danger";

const variants: Record<Variant, string> = {
  default:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  primary:
    "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

const priorityVariant: Record<Priority, Variant> = {
  low: "default",
  normal: "primary",
  high: "warning",
  emergency: "danger",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant={priorityVariant[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
