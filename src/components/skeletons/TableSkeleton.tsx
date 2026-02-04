export const TableSkeleton = () => {
  return (
    <div className="w-full border border-border/50 rounded-lg overflow-hidden relative">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Header */}
      <div className="bg-muted/20 border-b border-border/30">
        <div className="grid grid-cols-4 gap-4 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/20">
        {[...Array(5)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4">
            {[...Array(4)].map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-5 bg-muted/20 rounded animate-pulse"
                style={{ animationDelay: `${(rowIndex * 4 + colIndex) * 100}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CompactTableSkeleton = ({ rows = 3 }: { rows?: number }) => {
  return (
    <div className="w-full space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 bg-muted/10 rounded-lg border border-border/20 relative overflow-hidden"
        >
          {/* Shimmer */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-muted/30 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
};
