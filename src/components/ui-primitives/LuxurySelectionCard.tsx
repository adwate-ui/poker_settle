import { memo } from "react";
import { Player } from "@/types/poker";
import { formatProfitLoss, cn } from "@/lib/utils";
import OptimizedAvatar from "@/components/player/OptimizedAvatar";
import { Badge } from "@/components/ui/badge";
import { Star, Check } from "lucide-react";

interface LuxurySelectionCardProps {
    player: Player;
    onClick: () => void;
    className?: string;
    size?: "sm" | "md";
}

const LuxurySelectionCard = memo(({ player, onClick, className, size = "md" }: LuxurySelectionCardProps) => {
    const isSm = size === "sm";

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left p-4 rounded-lg border border-border/40 bg-card/20 hover:bg-primary/5 hover:border-primary/50 transition-all group flex items-center gap-4",
                isSm && "p-3 gap-3",
                className
            )}
        >
            <OptimizedAvatar
                name={player.name}
                size={size}
                className={cn("ring-1 ring-primary/20", isSm && "h-8 w-8")}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "font-luxury uppercase tracking-widest truncate",
                        isSm ? "text-[10px]" : "text-xs"
                    )}>
                        {player.name}
                    </span>
                    {player.total_games && player.total_games > 10 && (
                        <Star className={cn("text-primary fill-current", isSm ? "h-2.5 w-2.5" : "h-3 w-3")} />
                    )}
                </div>
                <div className={cn("flex gap-2.5 mt-1.5", isSm && "mt-1 gap-2")}>
                    <Badge variant="stats" className={isSm ? "text-[8px] h-4 px-1" : ""}>
                        {player.total_games || 0} SESSIONS
                    </Badge>
                    {player.total_profit !== undefined && (
                        <Badge
                            variant={player.total_profit >= 0 ? "profit" : "loss"}
                            className={isSm ? "text-[8px] h-4 px-1" : ""}
                        >
                            {formatProfitLoss(player.total_profit)}
                        </Badge>
                    )}
                </div>
            </div>
            <Check className={cn("text-primary opacity-0 group-hover:opacity-100 transition-opacity", isSm ? "h-3 w-3" : "h-4 w-4")} />
        </button>
    );
});

LuxurySelectionCard.displayName = "LuxurySelectionCard";

export default LuxurySelectionCard;
