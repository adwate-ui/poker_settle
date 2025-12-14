import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useHandsHistory } from '@/hooks/useHandsHistory';
import { Loader2, Trophy, TrendingUp, Target, Filter, X } from 'lucide-react';
import MemoizedHandCard from '@/components/MemoizedHandCard';
import { HOLE_CARD_FILTER_OPTIONS, HoleCardFilterType } from '@/utils/holeCardFilter';

const HandsHistory = () => {
  const navigate = useNavigate();
  const {
    hands,
    loading,
    filters,
    updateFilters,
    clearFilters,
    getUniqueGames,
    getUniqueHeroPositions,
    getUniqueVillainNames,
    getUniqueVillainPositions,
    getStatistics,
    loadMore,
    hasMore,
  } = useHandsHistory();

  const [currentPage, setCurrentPage] = useState(1);
  const handsPerPage = 20;

  // Get memoized values from hook
  const stats = getStatistics;
  const uniqueGames = getUniqueGames;
  const uniquePositions = getUniqueHeroPositions;
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHands}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.winRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.handsWon}W / {stats.handsLost}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-poker-gold">
              Rs. {stats.totalPotWon.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Showdown Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.showdownRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.showdownHands} hands
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary">{Object.keys(filters).length} active</Badge>
              )}
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Hero Position</label>
              <Select
                value={filters.heroPosition || 'all'}
                onValueChange={(value) =>
                  updateFilters({ heroPosition: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Positions" />
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
              <label className="text-sm font-medium mb-2 block">Game</label>
              <Select
                value={filters.gameId || 'all'}
                onValueChange={(value) =>
                  updateFilters({ gameId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {uniqueGames.map(game => (
                    <SelectItem key={game.id} value={game.id}>
                      {formatDate(game.date)} - Rs. {game.buy_in}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Result</label>
              <Select
                value={filters.result || 'all'}
                onValueChange={(value) =>
                  updateFilters({ result: value as 'win' | 'loss' | 'split' | 'all' })
                }
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium mb-2 block">Showdown</label>
              <Select
                value={filters.showdown || 'all'}
                onValueChange={(value) =>
                  updateFilters({ showdown: value as 'yes' | 'no' | 'all' })
                }
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium mb-2 block">Final Stage</label>
              <Select
                value={filters.finalStage || 'all'}
                onValueChange={(value) =>
                  updateFilters({ finalStage: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium mb-2 block">Villain Name</label>
              <Select
                value={filters.villainName || 'all'}
                onValueChange={(value) =>
                  updateFilters({ villainName: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium mb-2 block">Villain Position</label>
              <Select
                value={filters.villainPosition || 'all'}
                onValueChange={(value) =>
                  updateFilters({ villainPosition: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Positions" />
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
              <label className="text-sm font-medium mb-2 block">Hero's Hole Cards (Adwate)</label>
              <Select
                value={filters.heroHoleCards || 'all'}
                onValueChange={(value) =>
                  updateFilters({ heroHoleCards: value === 'all' ? undefined : value as HoleCardFilterType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Cards" />
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
              <label className="text-sm font-medium mb-2 block">Villain's Hole Cards</label>
              <Select
                value={filters.villainHoleCards || 'all'}
                onValueChange={(value) =>
                  updateFilters({ villainHoleCards: value === 'all' ? undefined : value as HoleCardFilterType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Cards" />
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
        </CardContent>
      </Card>

      {/* Hands List - Grouped by Game */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hands History
            <Badge variant="outline" className="ml-auto">
              {hands.length} hands
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentHands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hands found matching your filters</p>
            </div>
          ) : (
            <>
              {/* Group hands by game */}
              {(() => {
                // Group hands by game_id
                const handsByGame = currentHands.reduce((acc, hand) => {
                  const gameKey = hand.game_id;
                  if (!acc[gameKey]) {
                    acc[gameKey] = {
                      game_id: hand.game_id,
                      game_date: hand.game_date,
                      game_buy_in: hand.game_buy_in,
                      hands: []
                    };
                  }
                  acc[gameKey].hands.push(hand);
                  return acc;
                }, {} as Record<string, { game_id: string; game_date: string; game_buy_in: number; hands: typeof currentHands }>);

                return Object.values(handsByGame).map((gameGroup) => (
                  <div key={gameGroup.game_id} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">
                          Game: {formatDate(gameGroup.game_date)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Buy-in: Rs. {gameGroup.game_buy_in} • {gameGroup.hands.length} hands
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {gameGroup.hands.map((hand) => (
                        <MemoizedHandCard 
                          key={hand.id}
                          hand={hand}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </>
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
