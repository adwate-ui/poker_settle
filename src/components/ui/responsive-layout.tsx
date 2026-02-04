import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * Responsive Layout Utilities
 * Components for consistent mobile/desktop layouts
 */

interface ResponsiveProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * MobileOnly - Renders children only on mobile screens (<768px)
 */
export function MobileOnly({ children, className }: ResponsiveProps) {
    const isMobile = useIsMobile();
    if (!isMobile) return null;
    return <div className={className}>{children}</div>;
}

/**
 * DesktopOnly - Renders children only on desktop screens (>=768px)
 */
export function DesktopOnly({ children, className }: ResponsiveProps) {
    const isMobile = useIsMobile();
    if (isMobile) return null;
    return <div className={className}>{children}</div>;
}

interface ResponsiveStackProps extends ResponsiveProps {
    /** Gap between items - uses Tailwind spacing scale */
    gap?: 1 | 2 | 3 | 4 | 6 | 8;
    /** Reverse order on desktop (useful for sidebar layouts) */
    reverseOnDesktop?: boolean;
}

/**
 * ResponsiveStack - Column on mobile, row on desktop
 */
export function ResponsiveStack({
    children,
    className,
    gap = 4,
    reverseOnDesktop = false,
}: ResponsiveStackProps) {
    const gapClasses = {
        1: "gap-1",
        2: "gap-2",
        3: "gap-3",
        4: "gap-4",
        6: "gap-6",
        8: "gap-8",
    };

    return (
        <div
            className={cn(
                "flex flex-col",
                `md:flex-row${reverseOnDesktop ? "-reverse" : ""}`,
                gapClasses[gap],
                className
            )}
        >
            {children}
        </div>
    );
}

interface ResponsiveGridProps extends ResponsiveProps {
    /** Columns on mobile (1-4) */
    mobileColumns?: 1 | 2 | 3 | 4;
    /** Columns on desktop (1-6) */
    desktopColumns?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Gap between items */
    gap?: 2 | 3 | 4 | 6 | 8;
}

/**
 * ResponsiveGrid - Adjusts grid columns based on breakpoint
 */
export function ResponsiveGrid({
    children,
    className,
    mobileColumns = 1,
    desktopColumns = 3,
    gap = 4,
}: ResponsiveGridProps) {
    const mobileColClasses = {
        1: "grid-cols-1",
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
    };

    const desktopColClasses = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        5: "md:grid-cols-5",
        6: "md:grid-cols-6",
    };

    const gapClasses = {
        2: "gap-2",
        3: "gap-3",
        4: "gap-4",
        6: "gap-6",
        8: "gap-8",
    };

    return (
        <div
            className={cn(
                "grid",
                mobileColClasses[mobileColumns],
                desktopColClasses[desktopColumns],
                gapClasses[gap],
                className
            )}
        >
            {children}
        </div>
    );
}

interface ContainerProps extends ResponsiveProps {
    /** Max width constraint */
    size?: "sm" | "md" | "lg" | "xl" | "full";
    /** Add horizontal padding */
    padded?: boolean;
}

/**
 * Container - Centered container with responsive max-width
 */
export function Container({
    children,
    className,
    size = "lg",
    padded = true,
}: ContainerProps) {
    const sizeClasses = {
        sm: "max-w-screen-sm",
        md: "max-w-screen-md",
        lg: "max-w-screen-lg",
        xl: "max-w-screen-xl",
        full: "max-w-full",
    };

    return (
        <div
            className={cn(
                "mx-auto w-full",
                sizeClasses[size],
                padded && "px-4 md:px-6 lg:px-8",
                className
            )}
        >
            {children}
        </div>
    );
}
