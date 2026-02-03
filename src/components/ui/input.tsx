import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full bg-white/5 border-0 border-b border-gold-500/20 px-4 py-2 text-gold-50 font-luxury placeholder:text-gold-500/30 focus-visible:outline-none focus-visible:border-gold-500 focus-visible:shadow-glow-gold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 text-base md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
