import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "secondary" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  primary:
    "ub-grad-blue text-white shadow-[0_1px_2px_rgba(0,59,113,0.35),inset_0_-1px_0_rgba(0,0,0,0.18)] hover:brightness-110 focus:ring-[var(--ub-blue)]",
  danger:
    "ub-grad-red text-white shadow-[0_1px_2px_rgba(227,6,19,0.35),inset_0_-1px_0_rgba(0,0,0,0.18)] hover:brightness-110 focus:ring-[var(--ub-red)]",
  secondary:
    "bg-[var(--ub-blue-50)] text-[var(--ub-blue)] hover:bg-[var(--ub-blue-100)] focus:ring-[var(--ub-blue)]",
  ghost: "bg-transparent text-[var(--fg)] hover:bg-[var(--bg-muted)]",
  outline:
    "border border-[var(--border-strong)] bg-white text-[var(--fg)] shadow-sm hover:bg-[var(--bg-muted)] focus:ring-[var(--ub-blue)]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }
>(function Button({ className, variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm"
          ? "px-2.5 py-1 text-xs"
          : size === "lg"
            ? "px-4 py-2.5 text-sm"
            : "px-3.5 py-2 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
