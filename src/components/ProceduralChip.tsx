import React from 'react';
import { cn } from '@/lib/utils';

interface ProceduralChipProps {
    value: string | number;
    color: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    depth?: number;
}

export const ProceduralChip = ({
    value,
    color,
    size = 'md',
    className,
    depth = 1
}: ProceduralChipProps) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-[8px]',
        md: 'w-10 h-10 text-[10px]',
        lg: 'w-12 h-12 text-[12px]'
    };

    // Extract base color to handle light/dark variations
    // If color is a tailwind class like 'bg-blue-600', we might need to handle it.
    // But usually we'll pass hex or rgb.

    return (
        <div
            className={cn(
                "relative rounded-full flex items-center justify-center select-none transition-all duration-300 group",
                sizeClasses[size],
                className
            )}
            style={{
                backgroundColor: color,
                // 3D thickness effect
                boxShadow: `
          0 ${depth * 2}px 0 rgba(0,0,0,0.3),
          0 ${depth * 3}px 10px rgba(0,0,0,0.4),
          inset 0 -2px 5px rgba(0,0,0,0.2),
          inset 0 2px 5px rgba(255,255,255,0.3)
        `,
                // Edge spots pattern using multiple background layers
                backgroundImage: `
          radial-gradient(circle at center, transparent 70%, rgba(255,255,255,0.1) 71%, transparent 72%),
          repeating-conic-gradient(
            from 0deg,
            rgba(255, 255, 255, 0.4) 0deg 15deg,
            transparent 15deg 45deg
          )
        `,
            }}
        >
            {/* Outer Rim texture */}
            <div className="absolute inset-0 rounded-full border-2 border-white/20 pointer-events-none" />

            {/* Inner circular groove */}
            <div
                className="absolute inset-[15%] rounded-full border border-black/10 shadow-inner flex items-center justify-center"
                style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 70%)`,
                    backgroundColor: 'inherit'
                }}
            >
                {/* The numeric value in the center */}
                <span
                    className="font-luxury font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] tracking-tighter"
                    style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                >
                    {value}
                </span>
            </div>

            {/* Surface shine/glint layer */}
            <div
                className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
                }}
            />
        </div>
    );
};
