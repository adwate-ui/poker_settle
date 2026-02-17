import React from 'react';
import { cn } from '@/lib/utils';

interface ProceduralChipProps {
    value?: string | number;
    color: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    depth?: number;
}

export const ProceduralChip = ({
    value: _value,
    color,
    size = 'md',
    className,
    depth = 1
}: ProceduralChipProps) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-chip-sm',
        md: 'w-10 h-10 text-chip-md',
        lg: 'w-12 h-12 text-chip-lg'
    };

    // Extract base color to handle light/dark variations
    // If color is a tailwind class like 'bg-blue-600', we might need to handle it.
    // But usually we'll pass hex or rgb.

    return (
        <div
            className={cn(
                "relative rounded-full flex items-center justify-center select-none transition-all duration-300 group shadow-2xl",
                sizeClasses[size],
                className
            )}
            style={{
                backgroundColor: color,
                // Enhanced 3D depth for premium feel
                boxShadow: `
                    0 ${depth + 1}px 4px rgba(0,0,0,0.5),
                    inset 0 -2px 4px rgba(0,0,0,0.4),
                    inset 0 2px 4px rgba(255,255,255,0.4)
                `,
                // Casino-style edge spots using repeating-conic-gradient
                backgroundImage: `
                    radial-gradient(circle at center, transparent 65%, rgba(0,0,0,0.1) 66%, transparent 68%),
                    repeating-conic-gradient(
                        from 0deg,
                        rgba(255, 255, 255, 0.9) 0deg 15deg,
                        transparent 15deg 45deg
                    )
                `,
            }}
        >
            {/* Inner pressed inlay ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-black/10 pointer-events-none mix-blend-overlay" />

            {/* Inlay surface */}
            <div
                className="absolute inset-[20%] rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.4)] border border-white/10"
                style={{
                    background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
                    backgroundColor: 'inherit'
                }}
            >
                {/* Subtle pressed texture effect */}
                <div className="absolute inset-0 rounded-full opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '4px 4px' }}
                />
            </div>

            {/* Top glint */}
            <div
                className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                }}
            />
        </div>
    );
};
