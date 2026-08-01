import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/90",
  outline: "border border-border text-foreground hover:bg-surface",
  ghost: "text-muted hover:bg-surface hover:text-foreground",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-[11px]",
  md: "h-12 px-6 text-xs",
  lg: "h-14 px-8 text-sm",
};

/**
 * Class string for button-styled elements. Use directly on a `<Link>` when you
 * need a link that looks like a button.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
}: { variant?: Variant; size?: Size } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 font-mono uppercase tracking-[0.2em] transition-colors disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
