import { Card } from "@/components/ui/card";

export const GameCardSkeleton = () => {
  return (
    <Card className="p-6 border-border/50 bg-background/40 backdrop-blur-sm overflow-hidden relative">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="space-y-4">
        {/* Header section */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* Date */}
            <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
            {/* Title */}
            <div className="h-6 w-48 bg-muted/40 rounded animate-pulse" />
          </div>
          {/* Status badge */}
          <div className="h-6 w-20 bg-muted/30 rounded-full animate-pulse" />
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
            <div className="h-5 w-12 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
            <div className="h-5 w-14 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>

        {/* Players section */}
        <div className="flex items-center gap-2 pt-2">
          <div className="h-3 w-12 bg-muted/20 rounded animate-pulse" />
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full bg-muted/30 border-2 border-background animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Multiple skeleton loader for lists
export const GameCardSkeletonList = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
};
