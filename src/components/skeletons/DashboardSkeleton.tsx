import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted/40 rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted/20 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden border-border/50 bg-background/40">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <CardHeader className="pb-3">
              <div className="h-3 w-20 bg-muted/20 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted/40 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content area */}
      <Card className="relative overflow-hidden border-border/50 bg-background/40">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <CardHeader className="border-b border-border/30">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted/40 rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted/20 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Content rows */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-muted/5 rounded-lg border border-border/20">
              <div className="h-10 w-10 rounded-full bg-muted/30 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted/20 rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-muted/30 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Table poker view skeleton */}
      <Card className="relative overflow-hidden border-border/50 bg-background/40">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <CardContent className="p-8">
          {/* Oval table */}
          <div className="relative mx-auto" style={{ maxWidth: '600px', aspectRatio: '3/2' }}>
            <div className="absolute inset-0 bg-muted/20 rounded-[50%] border-4 border-muted/30 animate-pulse" />

            {/* Player positions */}
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60) * (Math.PI / 180);
              const radius = 45; // percentage
              const x = 50 + radius * Math.cos(angle - Math.PI / 2);
              const y = 50 + radius * Math.sin(angle - Math.PI / 2);

              return (
                <div
                  key={i}
                  className="absolute h-16 w-16 rounded-full bg-muted/30 border-2 border-muted/40 animate-pulse"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 150}ms`
                  }}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const GameDetailSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Back button and title */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-muted/30 rounded-lg animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 bg-muted/40 rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted/20 rounded animate-pulse" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-muted/30 rounded-lg animate-pulse" />
      </div>

      {/* Main dashboard */}
      <DashboardSkeleton />
    </div>
  );
};
