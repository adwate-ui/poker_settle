import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full bg-white/5 border-0 border-b border-white/20 px-0 py-2 text-base font-luxury text-gold-50 placeholder:text-white/20 placeholder:font-sans placeholder:tracking-widest placeholder:uppercase placeholder:text-[10px] sm:placeholder:text-xs focus-visible:outline-none focus-visible:border-gold-500 focus-visible:bg-white/10 transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
