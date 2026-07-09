import { cn } from "@/lib/utils";

interface StatTileProps {
    label: string;
    labelIcon?: React.ReactNode;
    value: React.ReactNode;
    valueClassName?: string;
    caption?: React.ReactNode;
    numeric?: boolean;
    className?: string;
}

/**
 * The canonical "stat/KPI card" — a muted caption over a headline value, with an
 * optional secondary caption underneath. One padding/radius/type recipe used everywhere
 * this pattern appears, instead of each screen re-implementing its own sizing.
 */
export const StatTile = ({
    label,
    labelIcon,
    value,
    valueClassName,
    caption,
    numeric = true,
    className,
}: StatTileProps) => {
    return (
        <div className={cn("p-4 sm:p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-2", className)}>
            <p className="text-label text-muted-foreground flex items-center gap-1">
                {labelIcon}
                {label}
            </p>
            <div className={cn("text-2xl font-bold", numeric && "font-numbers", valueClassName)}>{value}</div>
            {caption && <div className="text-xs text-muted-foreground font-numbers">{caption}</div>}
        </div>
    );
};

export default StatTile;
