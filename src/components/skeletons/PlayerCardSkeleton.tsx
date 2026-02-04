import { Card } from "@/components/ui/card";

export const PlayerCardSkeleton = () => {
  return (
    <Card className="p-4 sm:p-6 border-border/50 bg-background/40 backdrop-blur-sm overflow-hidden relative">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted/30 animate-pulse flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Name */}
          <div className="h-5 w-32 bg-muted/40 rounded animate-pulse" />
          {/* Stats */}
          <div className="flex gap-4">
            <div className="h-3 w-20 bg-muted/20 rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted/20 rounded animate-pulse" />
          </div>
        </div>

        {/* Win rate badge */}
        <div className="h-8 w-16 bg-muted/30 rounded-lg animate-pulse flex-shrink-0" />
      </div>
    </Card>
  );
};

export const PlayerCardSkeletonList = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  );
};
