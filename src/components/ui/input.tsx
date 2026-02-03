import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full bg-white/5 border-0 border-b border-white/20 px-0 py-2 text-base font-luxury text-gold-50 placeholder:text-white/20 placeholder:font-sans placeholder:tracking-widest placeholder:uppercase placeholder:text-[10px] sm:placeholder:text-xs focus-visible:outline-none focus-visible:border-gold-500 focus-visible:bg-white/10 transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
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
