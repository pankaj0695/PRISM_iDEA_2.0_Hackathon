import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "secondary" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--ub-blue)] text-white hover:bg-[var(--ub-blue-dark)] focus:ring-[var(--ub-blue)]",
  danger:
    "bg-[var(--ub-red)] text-white hover:bg-[var(--ub-red-dark)] focus:ring-[var(--ub-red)]",
  secondary:
    "bg-[var(--ub-blue-50)] text-[var(--ub-blue)] hover:bg-[var(--ub-blue-50)]/80 focus:ring-[var(--ub-blue)]",
  ghost: "bg-transparent text-[var(--fg)] hover:bg-[var(--bg-muted)]",
  outline:
    "border border-[var(--border-strong)] bg-white text-[var(--fg)] hover:bg-[var(--bg-muted)]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }
>(function Button({ className, variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
