import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold font-luxury ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-gold-400 to-gold-600 text-black tracking-wider border border-gold-300 shadow-[0_2px_10px_rgba(212,184,60,0.3)] hover:from-gold-300 hover:to-gold-500 hover:shadow-[0_0_20px_rgba(212,184,60,0.5)]",
        destructive:
          "bg-gradient-to-b from-red-800 to-red-950 text-red-100 border border-red-800 shadow-[0_2px_10px_rgba(153,27,27,0.3)] hover:from-red-700 hover:to-red-900",
        outline:
          "bg-transparent border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500 hover:text-gold-300 shadow-sm",
        secondary:
          "bg-black/60 backdrop-blur-md border border-white/10 text-gold-100 hover:bg-black/80 hover:border-gold-500/50 shadow-lg",
        ghost: "hover:bg-gold-500/10 hover:text-gold-300 font-medium",
        link: "text-gold-400 underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-14 rounded-lg px-10 text-base tracking-widest uppercase",
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
