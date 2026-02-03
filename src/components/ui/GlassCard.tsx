import React from 'react';
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

/**
 * GlassCard - Implementing a "Crystal" glass effect.
 * Features:
 * - Dynamic background with hover gradient
 * - Top-light highlight via masked pseudo-element
 * - Double-layer shadow (Amber glow + Black depth)
 * - Micro-noise texture for realism
 */
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden rounded-2xl transition-all duration-700 ease-out",
                    "bg-white/5 backdrop-blur-2xl",
                    "hover:bg-gradient-to-b hover:from-white/10 hover:to-transparent",
                    "shadow-[0_0_20px_rgba(212,175,55,0.1),0_25px_50px_-12px_rgba(0,0,0,0.5)]",
                    "group",
                    className
                )}
                {...props}
            >
                {/* Crystal Border Effect (Top-Light) */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[mask-composite:xor] z-20" />

                {/* Noise Texture Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay z-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] z-10" />

                <div className="relative z-30">
                    {children}
                </div>
            </div>
        );
    }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
