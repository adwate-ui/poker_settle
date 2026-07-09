import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useHandsHistory } from '@/hooks/useHandsHistory';
import { TrendingUp, Target, Filter, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import MemoizedHandCard from '@/components/poker/MemoizedHandCard';
import { GameCardSkeletonList } from '@/components/skeletons';
import { EmptyState } from '@/components/feedback/EmptyState';
import { HOLE_CARD_FILTER_OPTIONS, HoleCardFilterType } from '@/utils/holeCardFilter';
import { formatCurrency } from '@/utils/currencyUtils';
import { StatTile } from '@/components/ui-primitives/StatTile';

const HandsHistory = () => {
  const _navigate = useNavigate();
  const {
    hands,
    loading,
    filters,
    updateFilters,
    clearFilters,
    heroNames,
    getUniqueGames,
    getUniqueHeroPositions,
    getUniqueVillainNames,
    getUniqueVillainPositions,
    getStatistics,
    loadMore: _loadMore,
    hasMore: _hasMore,
    deleteHand,
  } = useHandsHistory();

  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const handsPerPage = 20;

  // Get memoized values from hook
  const stats = getStatistics;
  const uniqueGames = getUniqueGames;
  const uniquePositions = getUniqueHeroPositions;
  const uniqueHeroNames = heroNames;
  const uniqueVillainNames = getUniqueVillainNames;
  const uniqueVillainPositions = getUniqueVillainPositions;

  // Pagination
  const totalPages = Math.ceil(hands.length / handsPerPage);
  const startIndex = (currentPage - 1) * handsPerPage;
  const endIndex = startIndex + handsPerPage;
  const currentHands = useMemo(() => hands.slice(startIndex, endIndex), [hands, startIndex, endIndex]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const hasActiveFilters = useMemo(() =>
    Object.keys(filters).some(key => {
      const value = filters[key as keyof typeof filters];
      return value && value !== 'all';
    }),
    [filters]
  );

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/20 animate-pulse" />
          ))}
        </div>
        <GameCardSkeletonList count={4} />
      </div>
    );
  }

  const filterFieldsGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Hero Name</label>
        <Select
          value={filters.heroName || 'all'}
          onValueChange={(value) =>
            updateFilters({ heroName: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder="Global View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Heros</SelectItem>
            {uniqueHeroNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Hero Position</label>
        <Select
          value={filters.heroPosition || 'all'}
          onValueChange={(value) =>
            updateFilters({ heroPosition: value === 'all' ? undefined : value })
          }
          disabled={uniquePositions.length === 0}
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder={uniquePositions.length === 0 ? "No Positions" : "All Positions"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {uniquePositions.map(pos => (
              <SelectItem key={pos} value={pos}>{pos}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Game</label>
        <Select
          value={filters.gameId || 'all'}
          onValueChange={(value) =>
            updateFilters({ gameId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder="All Games" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {uniqueGames.map(game => (
              <SelectItem key={game.id} value={game.id}>
                {formatDate(game.date)} - {formatCurrency(game.buy_in)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Result</label>
        <Select
          value={filters.result || 'all'}
          onValueChange={(value) =>
            updateFilters({ result: value as 'win' | 'loss' | 'split' | 'all' })
          }
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder="All Results" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="win">Wins</SelectItem>
            <SelectItem value="loss">Losses</SelectItem>
            <SelectItem value="split">Split Pots</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Showdown</label>
        <Select
          value={filters.showdown || 'all'}
          onValueChange={(value) =>
            updateFilters({ showdown: value as 'yes' | 'no' | 'all' })
          }
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Final Stage</label>
        <Select
          value={filters.finalStage || 'all'}
          onValueChange={(value) =>
            updateFilters({ finalStage: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="Preflop">Preflop</SelectItem>
            <SelectItem value="Flop">Flop</SelectItem>
            <SelectItem value="Turn">Turn</SelectItem>
            <SelectItem value="River">River</SelectItem>
            <SelectItem value="Showdown">Showdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Villain Name</label>
        <Select
          value={filters.villainName || 'all'}
          onValueChange={(value) =>
            updateFilters({ villainName: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder="All Villains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Villains</SelectItem>
            {uniqueVillainNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Villain Position</label>
        <Select
          value={filters.villainPosition || 'all'}
          onValueChange={(value) =>
            updateFilters({ villainPosition: value === 'all' ? undefined : value })
          }
          disabled={!filters.villainName}
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder={!filters.villainName ? "Select Villain First" : "All Positions"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {uniqueVillainPositions.map(pos => (
              <SelectItem key={pos} value={pos}>{pos}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Hero's Hole Cards</label>
        <Select
          value={filters.heroHoleCards || 'all'}
          onValueChange={(value) =>
            updateFilters({ heroHoleCards: value === 'all' ? undefined : value as HoleCardFilterType })
          }
          disabled={!filters.heroName}
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder={!filters.heroName ? "Select Hero First" : "All Cards"} />
          </SelectTrigger>
          <SelectContent>
            {HOLE_CARD_FILTER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-label text-muted-foreground mb-1.5 block">Villain's Hole Cards</label>
        <Select
          value={filters.villainHoleCards || 'all'}
          onValueChange={(value) =>
            updateFilters({ villainHoleCards: value === 'all' ? undefined : value as HoleCardFilterType })
          }
          disabled={!filters.villainName}
        >
          <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
            <SelectValue placeholder={!filters.villainName ? "Select Villain First" : "All Cards"} />
          </SelectTrigger>
          <SelectContent>
            {HOLE_CARD_FILTER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatTile label="Total Hands" value={stats.totalHands} />
        <StatTile
          label="Win Rate"
          value={`${stats.winRate}%`}
          valueClassName="text-state-success"
          caption={`${stats.handsWon}W / ${stats.handsLost}L`}
        />
        <StatTile label="Total Won" value={formatCurrency(stats.totalPotWon)} valueClassName="text-primary" />
        <StatTile
          label="Showdown Rate"
          value={`${stats.showdownRate}%`}
          caption={`${stats.showdownHands} hands`}
        />
      </div>

      {/* Filters Section — desktop, inline, compact and collapsed by default */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="hidden lg:block">
        <div className="rounded-xl border border-border bg-accent/5">
          <CollapsibleTrigger asChild>
            <div className="p-4 sm:p-5 cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-label text-muted-foreground group-hover:text-foreground transition-colors">Filter Hands</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-3xs font-numbers text-primary border-primary/40">{Object.keys(filters).length} active</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                    className="h-6 px-2 text-label text-muted-foreground hover:text-foreground gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear All
                  </Button>
                )}
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", filtersOpen && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              {filterFieldsGrid}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Filters Section — mobile/tablet, on-demand sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="font-luxury uppercase tracking-widest text-tiny">{Object.keys(filters).length} active</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="font-luxury tracking-wider uppercase">Filters</SheetTitle>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </SheetHeader>
            <div className="py-4">
              {filterFieldsGrid}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Hands List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Hands History</CardTitle>
                <CardDescription>Every hand you've tracked</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-numbers text-tiny">
              {hands.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentHands.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No Hands Found"
              description={
                hasActiveFilters
                  ? "No hands match your current filters. Try adjusting or clearing them."
                  : "No hands have been recorded yet. Track a hand during a live game to see it here."
              }
              action={
                hasActiveFilters
                  ? { label: "Clear Filters", onClick: clearFilters }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {currentHands.map((hand) => (
                <MemoizedHandCard
                  key={hand.id}
                  hand={hand}
                  formatDate={formatDate}
                  onDelete={deleteHand}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HandsHistory;
