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
import { formatCurrency } from '@/utils/currencyUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PlayerFormDialog, PlayerFormData } from '@/components/PlayerFormDialog';
import OptimizedAvatar from '@/components/OptimizedAvatar';
import { ResponsiveName } from '@/components/ResponsiveName';
import { ResponsiveCurrency } from '@/components/ResponsiveCurrency';

interface PlayerSelectorProps {
  allPlayers: Player[];
  selectedPlayers: Player[];
  onAddPlayer: (player: Player) => void;
  onRemovePlayer: (playerId: string) => void;
  onCreateNewPlayer: (name: string) => Promise<Player>;
  onCreateNewPlayerWithDetails?: (playerData: import('@/components/PlayerFormDialog').PlayerFormData) => Promise<Player>;
  disabled?: boolean;
}

export const PlayerSelector = ({
  allPlayers,
  selectedPlayers,
  onAddPlayer,
  onRemovePlayer,
  onCreateNewPlayer,
  onCreateNewPlayerWithDetails,
  disabled = false,
}: PlayerSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const availablePlayers = useMemo(() => {
    return allPlayers
      .filter(p => !selectedPlayers.find(sp => sp.id === p.id))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
  }, [allPlayers, selectedPlayers, searchQuery]);

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

  const handleCreatePlayerWithDetails = async (playerData: PlayerFormData) => {
    if (onCreateNewPlayerWithDetails) {
      const player = await onCreateNewPlayerWithDetails(playerData);
      onAddPlayer(player);
      setShowDetailedForm(false);
      setOpen(false);
    } else {
      // Fallback to simple creation
      const player = await onCreateNewPlayer(playerData.name);
      onAddPlayer(player);
      setShowDetailedForm(false);
      setOpen(false);
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
                    <OptimizedAvatar
                      name={player.name}
                      size="sm"
                    />

                    {/* Player Info */}
                    <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <ResponsiveName name={player.name} className="font-medium text-sm" />
                        {player.total_games && player.total_games > 10 && (
                          <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-nowrap shrink-0">
                        <Badge variant="outline" className="text-tiny h-5 px-1.5 whitespace-nowrap">
                          <Users className="h-3 w-3 mr-1" />
                          {player.total_games || 0}
                        </Badge>
                        {player.total_profit !== undefined && (
                          <Badge
                            variant={player.total_profit >= 0 ? 'profit' : 'loss'}
                            className="text-tiny h-5 px-1.5 whitespace-nowrap"
                          >
                            {player.total_profit >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {player.total_profit >= 0 ? '+' : ''}
                            <ResponsiveCurrency amount={Math.abs(player.total_profit)} className="ml-0.5" />
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
                      aria-label={`Remove ${player.name} from selection`}
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
        <DialogContent className="max-w-2xl max-h-[90vh] glass-panel border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-luxury-primary">Add Players to Game</DialogTitle>
            <DialogDescription className="text-muted-foreground uppercase tracking-widest text-[10px]">
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

              {/* All Players - Alphabetically Sorted */}
              {availablePlayers.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {searchQuery ? `Search Results (${availablePlayers.length})` : `All Players (${availablePlayers.length})`}
                  </h4>
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

                <div className="grid grid-cols-2 gap-2">
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
                        Quick Add
                      </>
                    )}
                  </Button>

                  {onCreateNewPlayerWithDetails && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailedForm(true);
                        setOpen(false);
                      }}
                      className="w-full"
                      size="lg"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add with Details
                    </Button>
                  )}
                </div>

                {onCreateNewPlayerWithDetails && (
                  <p className="text-xs text-muted-foreground text-center">
                    Use "Add with Details" to include WhatsApp number and UPI ID
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Detailed Player Form Dialog */}
      {onCreateNewPlayerWithDetails && (
        <PlayerFormDialog
          open={showDetailedForm}
          onOpenChange={setShowDetailedForm}
          onSave={handleCreatePlayerWithDetails}
          title="Add Player with Details"
          description="Add player with WhatsApp number and UPI ID for notifications and settlements."
        />
      )}
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
        "w-full text-left p-0 px-3 h-14 flex items-center rounded-2xl glass-panel hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(212,184,60,0.2)] transition-all group border-0",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <OptimizedAvatar
          name={player.name}
          size="md"
        />

        {/* Info */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <ResponsiveName name={player.name} className="font-medium text-base" />
            {player.total_games && player.total_games > 10 && (
              <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            <Badge variant="outline" className="text-tiny h-5 px-1.5 whitespace-nowrap">
              <Users className="h-3 w-3 mr-1" />
              {player.total_games || 0}
            </Badge>
            {player.total_profit !== undefined && (
              <Badge
                variant={player.total_profit >= 0 ? 'profit' : 'loss'}
                className="text-tiny h-5 px-1.5 whitespace-nowrap"
              >
                {player.total_profit >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {player.total_profit >= 0 ? '+' : ''}
                <ResponsiveCurrency amount={Math.abs(player.total_profit)} className="ml-0.5" />
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
