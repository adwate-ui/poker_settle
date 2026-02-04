import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "h-12 rounded-lg bg-input/20 border border-input px-4 py-2 text-base font-body text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
        luxury: "h-12 bg-accent/5 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-luxury tracking-widest text-xs uppercase placeholder:text-muted-foreground/30",
        ghost: "h-10 bg-transparent border-none px-0 focus-visible:ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
  VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
