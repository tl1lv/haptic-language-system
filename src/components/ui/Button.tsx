"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-900",
  secondary:
    "bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-700/20 dark:text-secondary-300 dark:hover:bg-secondary-700/30",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost:
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-13 min-h-[3.25rem] px-6 text-base",
  icon: "h-11 w-11",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
