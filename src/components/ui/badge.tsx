import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-tiny sm:text-table-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        stats: "bg-black/5 dark:bg-white/5 border-border text-muted-foreground font-numbers px-3 py-1 font-normal",
        profit: "border-transparent bg-state-success text-state-success-foreground hover:bg-state-success/80 shadow-md",
        loss: "border-transparent bg-state-error text-state-error-foreground hover:bg-state-error/80 shadow-md",
        luxury: "bg-primary/10 border-primary/20 text-primary px-3 py-1",
        // Semantic state variants
        info: "border-transparent bg-state-info/10 text-state-info hover:bg-state-info/20",
        warning: "border-transparent bg-state-warning/10 text-state-warning hover:bg-state-warning/20",
        success: "border-transparent bg-state-success/10 text-state-success hover:bg-state-success/20",
        error: "border-transparent bg-state-error/10 text-state-error hover:bg-state-error/20",
        neutral: "border-transparent bg-state-neutral/10 text-state-neutral hover:bg-state-neutral/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
