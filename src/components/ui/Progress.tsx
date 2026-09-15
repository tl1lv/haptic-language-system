import { cn } from "@/lib/cn";

export function Progress({
  value,
  className,
  label,
}: {
  value: number; // 0-100
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "التقدم"}
    >
      <div
        className="h-full rounded-full bg-primary-600 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
