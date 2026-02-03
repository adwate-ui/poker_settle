import React from 'react';
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

/**
 * A container component implementing a "Frosted Glass" effect using Luxury tokens.
 * Features:
 * - Backdrop blur
 * - Translucent background (light/dark responsive)
 * - Gold border transition on hover
 */
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden rounded-xl shadow-xl transition-all duration-300",
                    "bg-white/5 backdrop-blur-md dark:bg-black/40",
                    "border border-white/10 hover:border-gold-500/50",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
