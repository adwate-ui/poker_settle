import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold font-luxury ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-gold-400 to-gold-500 text-black border border-gold-600/20 shadow-[0_2px_10px_rgba(212,184,60,0.2)] hover:from-gold-300 hover:to-gold-400 hover:shadow-[0_0_20px_rgba(212,184,60,0.4)]",
        destructive:
          "bg-gradient-to-b from-red-600 to-red-700 text-white border border-red-800 shadow-sm hover:from-red-500 hover:to-red-600",
        outline:
          "border-2 border-gold-500 bg-transparent text-gold-700 dark:text-gold-400 hover:bg-gold-500 hover:text-black hover:border-gold-500 hover:shadow-[0_0_15px_rgba(212,184,60,0.3)]",
        secondary:
          "bg-black/80 dark:bg-white/10 border border-gold-500/20 text-gold-200 backdrop-blur-md shadow-lg hover:bg-black/60 dark:hover:bg-white/20 hover:border-gold-500/40 hover:text-gold-100",
        ghost:
          "text-gold-700 dark:text-gold-400 hover:bg-gold-500/10 hover:text-gold-900 dark:hover:text-gold-200",
        link:
          "text-gold-700 dark:text-gold-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-14 rounded-xl px-8 text-base tracking-[0.15em] uppercase",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
