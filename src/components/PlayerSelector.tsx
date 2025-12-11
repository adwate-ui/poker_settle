import { useState, useMemo, useEffect } from 'react';
import { Player } from '@/types/poker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, Users, X, Check, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { formatIndianNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PlayerSelectorProps {
  allPlayers: Player[];
  selectedPlayers: Player[];
  onAddPlayer: (player: Player) => void;
  onRemovePlayer: (playerId: string) => void;
  onCreateNewPlayer: (name: string) => Promise<Player>;
  disabled?: boolean;
}

export const PlayerSelector = ({
  allPlayers,
  selectedPlayers,
  onAddPlayer,
  onRemovePlayer,
  onCreateNewPlayer,
  disabled = false,
}: PlayerSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const availablePlayers = useMemo(() => {
    return allPlayers
      .filter(p => !selectedPlayers.find(sp => sp.id === p.id))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        // Sort by total games (most active first), then by name
        const gamesCompare = (b.total_games || 0) - (a.total_games || 0);
        return gamesCompare !== 0 ? gamesCompare : a.name.localeCompare(b.name);
      });
  }, [allPlayers, selectedPlayers, searchQuery]);

  const recentPlayers = useMemo(() => {
    return availablePlayers.slice(0, 5);
  }, [availablePlayers]);

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) {
      toast.error('Please enter a player name');
      return;
    }

    setIsCreating(true);
    try {
      const player = await onCreateNewPlayer(newPlayerName.trim());
      onAddPlayer(player);
      setNewPlayerName('');
      toast.success(`${player.name} added!`);
      setOpen(false);
    } catch (error) {
      toast.error('Failed to create player');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectPlayer = (player: Player) => {
    onAddPlayer(player);
    toast.success(`${player.name} added!`);
    setSearchQuery('');
    setOpen(false);
  };

  // Reset search query when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <div className="space-y-3">
      {/* Selected Players */}
      {selectedPlayers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Selected Players ({selectedPlayers.length})
          </h4>
          <div className="grid gap-2">
            {selectedPlayers.map((player) => (
              <Card key={player.id} className="group hover:shadow-md transition-all">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{player.name}</span>
                        {player.total_games && player.total_games > 10 && (
                          <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          <Users className="h-3 w-3 mr-1" />
                          {player.total_games || 0} games
                        </Badge>
                        {player.total_profit !== undefined && (
                          <Badge
                            variant={player.total_profit >= 0 ? 'success' : 'destructive'}
                            className="text-[10px] h-5 px-1.5"
                          >
                            {player.total_profit >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {player.total_profit >= 0 ? '+' : ''}
                            Rs. {formatIndianNumber(Math.abs(player.total_profit))}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemovePlayer(player.id)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Player Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            disabled={disabled}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Players to Game</DialogTitle>
            <DialogDescription>
              Select from existing players or create a new one
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing Players</TabsTrigger>
              <TabsTrigger value="new">New Player</TabsTrigger>
            </TabsList>

            {/* Existing Players Tab */}
            <TabsContent value="existing" className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Recent/Top Players */}
              {!searchQuery && recentPlayers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Top Players</h4>
                  <div className="grid gap-2">
                    {recentPlayers.map((player) => (
                      <PlayerListItem
                        key={player.id}
                        player={player}
                        onSelect={handleSelectPlayer}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Players */}
              {availablePlayers.length > 0 ? (
                <div className="space-y-2">
                  {searchQuery && (
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Search Results ({availablePlayers.length})
                    </h4>
                  )}
                  <ScrollArea key={`scroll-${open}`} className="h-[300px] pr-4">
                    <div className="grid gap-2">
                      {availablePlayers.map((player) => (
                        <PlayerListItem
                          key={player.id}
                          player={player}
                          onSelect={handleSelectPlayer}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? (
                    <div className="space-y-4">
                      <p>No players found matching "{searchQuery}"</p>
                      <Button
                        onClick={async () => {
                          try {
                            const player = await onCreateNewPlayer(searchQuery.trim());
                            onAddPlayer(player);
                            toast.success(`${player.name} created and added!`);
                            setSearchQuery('');
                            setOpen(false);
                          } catch (error) {
                            toast.error('Failed to create player');
                          }
                        }}
                        className="mx-auto"
                        disabled={disabled}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create "{searchQuery}"
                      </Button>
                    </div>
                  ) : (
                    <p>All players have been added</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* New Player Tab */}
            <TabsContent value="new" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newPlayerName" className="text-sm font-medium">
                    Player Name
                  </label>
                  <Input
                    id="newPlayerName"
                    placeholder="Enter player name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isCreating) {
                        handleCreatePlayer();
                      }
                    }}
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleCreatePlayer}
                  disabled={!newPlayerName.trim() || isCreating}
                  className="w-full"
                  size="lg"
                >
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create and Add Player
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PlayerListItemProps {
  player: Player;
  onSelect: (player: Player) => void;
}

const PlayerListItem = ({ player, onSelect }: PlayerListItemProps) => {
  return (
    <button
      onClick={() => onSelect(player)}
      className={cn(
        "group w-full text-left p-3 rounded-lg border bg-card hover:bg-accent hover:shadow-md transition-all",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{player.name}</span>
            {player.total_games && player.total_games > 10 && (
              <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              <Users className="h-3 w-3 mr-1" />
              {player.total_games || 0} games
            </Badge>
            {player.total_profit !== undefined && (
              <Badge
                variant={player.total_profit >= 0 ? 'success' : 'destructive'}
                className="text-[10px] h-5 px-1.5"
              >
                {player.total_profit >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {player.total_profit >= 0 ? '+' : ''}
                Rs. {formatIndianNumber(Math.abs(player.total_profit))}
              </Badge>
            )}
          </div>
        </div>

        {/* Select Icon */}
        <Check className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
};

export default PlayerSelector;
