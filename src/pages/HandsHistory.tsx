import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useHandsHistory } from '@/hooks/useHandsHistory';
import { Loader2, Trophy, TrendingUp, Target, Filter, X } from 'lucide-react';
import PokerCard from '@/components/PokerCard';
import { HOLE_CARD_FILTER_OPTIONS } from '@/utils/holeCardFilter';

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
  } = useHandsHistory();

  const [currentPage, setCurrentPage] = useState(1);
  const handsPerPage = 20;

  const stats = getStatistics();
  const uniqueGames = getUniqueGames();
  const uniquePositions = getUniqueHeroPositions();
  const uniqueVillainNames = getUniqueVillainNames();
  const uniqueVillainPositions = getUniqueVillainPositions();

  // Pagination
  const totalPages = Math.ceil(hands.length / handsPerPage);
  const startIndex = (currentPage - 1) * handsPerPage;
  const endIndex = startIndex + handsPerPage;
  const currentHands = hands.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof typeof filters];
    return value && value !== 'all';
  });

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
                  updateFilters({ result: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="win">Wins</SelectItem>
                  <SelectItem value="loss">Losses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Showdown</label>
              <Select
                value={filters.showdown || 'all'}
                onValueChange={(value) =>
                  updateFilters({ showdown: value as any })
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
                  updateFilters({ heroHoleCards: value === 'all' ? undefined : value as any })
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
                  updateFilters({ villainHoleCards: value === 'all' ? undefined : value as any })
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

      {/* Hands List */}
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
            <div className="space-y-3">
              {currentHands.map((hand) => {
                const communityCards = hand.street_cards
                  .sort((a, b) => {
                    const order = { Flop: 1, Turn: 2, River: 3 };
                    return order[a.street_type as keyof typeof order] - order[b.street_type as keyof typeof order];
                  })
                  .map(c => c.cards_notation)
                  .join('');

                return (
                  <Card 
                    key={hand.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/hands/${hand.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">Hand #{hand.hand_number}</span>
                              <Badge variant="outline" className="text-xs">
                                {hand.hero_position}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {hand.final_stage}
                              </Badge>
                              {hand.is_hero_win === true && (
                                <Badge className="bg-green-600 text-xs">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Won
                                </Badge>
                              )}
                              {hand.is_hero_win === false && (
                                <Badge variant="destructive" className="text-xs">
                                  Lost
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(hand.game_date)} • Button: {hand.button_player_name}
                              {hand.winner_player_name && ` • Winner: ${hand.winner_player_name}`}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {communityCards && (
                              <div className="hidden md:flex gap-1">
                                {communityCards.match(/.{1,2}/g)?.slice(0, 5).map((card, idx) => (
                                  <PokerCard key={idx} card={card} size="sm" />
                                ))}
                              </div>
                            )}
                            <div className="text-right">
                              <div className="text-lg font-bold text-poker-gold">
                                Rs. {hand.pot_size?.toLocaleString('en-IN') || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Pot</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Players in Hand */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Players in Hand:</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Map(
                              hand.actions
                                .filter(a => (a as any).player?.name && a.position)
                                .map(a => [
                                  (a as any).player.name,
                                  { name: (a as any).player.name, position: a.position }
                                ])
                            ).values()).map((player, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {player.name} ({player.position})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
