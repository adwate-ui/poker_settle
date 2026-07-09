import { useState, useEffect, useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { gameKeys } from "@/features/game/api/queryKeys";
import { useActiveGame } from "@/hooks/useActiveGame";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/notifications";
import { ErrorMessages } from "@/lib/errorUtils";
import { Player } from "@/types/poker";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Play, Info, Crown } from "lucide-react";
import GameDashboard from "@/components/game/GameDashboard";
import { UniversalPlayerManager } from "@/components/player/UniversalPlayerManager";
import LuxurySelectionCard from "@/components/ui-primitives/LuxurySelectionCard";
import { formatCurrency } from "@/utils/currencyUtils";
import { parseIndianNumber } from "@/lib/utils";
import { CurrencyConfig } from "@/config/localization";
import { usePlayerManagement } from "@/hooks/usePlayerManagement";
import { useGameDefaults } from "@/features/game/hooks/useGameDefaults";
const NewGame = () => {
  const { user } = useAuth();
  const { createPlayer, createOrFindPlayerByName } = usePlayerManagement();
  const queryClient = useQueryClient();
  const { data: gameDefaults } = useGameDefaults(user?.id);
  const [buyInAmount, setBuyInAmount] = useState("2,000");
  const [smallBlind, setSmallBlind] = useState("20");
  const [bigBlind, setBigBlind] = useState("40");
  const [rake, setRake] = useState("200");
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [hostPlayerId, setHostPlayerId] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeGame, refetchActiveGame } = useActiveGame(user?.id);
  const [showActiveGame, setShowActiveGame] = useState(false);

  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("user_id", user?.id)
      .order("name");

    if (error) {
      toast.error(ErrorMessages.generic.load(error));
      return;
    }
    setPlayers(data || []);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlayers();
    }
  }, [user, fetchPlayers]);

  useEffect(() => {
    if (gameDefaults && !defaultsApplied) {
      if (gameDefaults.defaultBuyIn != null)
        setBuyInAmount(formatCurrency(gameDefaults.defaultBuyIn, false));
      if (gameDefaults.defaultSmallBlind != null)
        setSmallBlind(formatCurrency(gameDefaults.defaultSmallBlind, false));
      if (gameDefaults.defaultBigBlind != null)
        setBigBlind(formatCurrency(gameDefaults.defaultBigBlind, false));
      if (gameDefaults.defaultRake != null)
        setRake(formatCurrency(gameDefaults.defaultRake, false));
      setDefaultsApplied(true);
    }
  }, [gameDefaults, defaultsApplied]);

  const addNewPlayer = async (name: string): Promise<Player> => {
    const player = await createOrFindPlayerByName(name);

    if (!players.find(p => p.id === player.id)) {
      setPlayers([...players, player]);
    }
    return player;
  };

  const addNewPlayerWithDetails = async (playerData: import('@/components/player/PlayerFormDialog').PlayerFormData): Promise<Player> => {
    const player = await createPlayer(playerData);
    setPlayers([...players, player]);
    return player;
  };

  const addPlayerToGame = (player: Player) => {
    setGamePlayers(prev => {
      if (!hostPlayerId && prev.length === 0) setHostPlayerId(player.id);
      return [...prev, player];
    });
  };

  const removePlayerFromGame = (playerId: string) => {
    setGamePlayers(gamePlayers.filter(p => p.id !== playerId));
    if (hostPlayerId === playerId) setHostPlayerId("");
  };

  const startGame = async () => {
    const parsedAmount = parseIndianNumber(buyInAmount);
    if (!buyInAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid buy-in amount");
      return;
    }

    if (gamePlayers.length < 2) {
      toast.error("Please add at least 2 players");
      return;
    }

    if (!hostPlayerId) {
      toast.error("Please designate a host");
      return;
    }

    setLoading(true);
    try {
      const smallBlindVal = parseIndianNumber(smallBlind);
      const bigBlindVal = parseIndianNumber(bigBlind);
      const rakeVal = parseIndianNumber(rake);

      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          buy_in_amount: parsedAmount,
          small_blind: smallBlindVal,
          big_blind: bigBlindVal,
          ...(rakeVal > 0 ? { rake: rakeVal } : {}),
          user_id: user?.id,
          is_complete: false,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      const gamePlayersData = gamePlayers.map((player) => ({
        game_id: game.id,
        player_id: player.id,
        buy_ins: 1,
        final_stack: 0,
        net_amount: -parsedAmount,
        is_host: player.id === hostPlayerId,
      }));

      const { error: playersError } = await supabase
        .from("game_players")
        .insert(gamePlayersData);

      if (playersError) throw playersError;

      // Invalidate cache to ensure fresh data is fetched when GameDashboard loads
      await queryClient.invalidateQueries({ queryKey: gameKeys.detail(game.id) });

      toast.success("Game started!");
      await refetchActiveGame();
      setShowActiveGame(true);
    } catch (error) {
      toast.error(ErrorMessages.game.create(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromGame = () => {
    setShowActiveGame(false);
    refetchActiveGame();
  };

  const continueGame = () => {
    setShowActiveGame(true);
  };

  if (activeGame && showActiveGame) {
    return <GameDashboard gameId={activeGame.id} />;
  }

  const hasActiveGame = activeGame !== null;

  return (
    <Card className="max-w-4xl mx-auto relative overflow-hidden mb-24 sm:mb-0">
      {hasActiveGame && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-20 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border shadow-2xl animate-in fade-in zoom-in duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl font-luxury text-foreground">
                  Active Game
                </CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                You have a game in progress. Please complete the current game before starting a new one.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button onClick={continueGame} className="w-full h-12 text-base font-luxury shadow-lg shadow-primary/10" variant="default">
                Resume Active Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <CardHeader className="space-y-1">
        <CardTitle className="font-luxury text-foreground">
          Start New Game
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Configure game settings and add players.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-10">
        <div className="space-y-8">
          {/* Buy-in Section */}
          <div className="space-y-3">
            <Label htmlFor="buyin" className="text-label text-muted-foreground ml-1">
              Initial Buy-in ({CurrencyConfig.symbol})
            </Label>
            <div className="relative group">
              <Input
                id="buyin"
                type="text"
                placeholder="2,000"
                value={buyInAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value === '' || !isNaN(Number(value))) {
                    const formatted = value === '' ? '' : formatCurrency(Number(value), false);
                    setBuyInAmount(formatted);
                  }
                }}
                disabled={hasActiveGame}
                className="h-12 bg-background border border-input rounded-md text-base font-numbers text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-300 ease-out"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="What is the buy-in used for?"
                    className="absolute right-0 bottom-3 text-muted-foreground hover:text-primary group-focus-within:text-primary transition-colors"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="text-sm text-muted-foreground max-w-xs">
                  The amount each player pays to join the table. It sets each player's starting stack and is used to calculate buy-ins, cash-outs, and the final settlement.
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Blinds + Rake Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Label htmlFor="smallblind" className="text-label text-muted-foreground ml-1">
                Small Blind ({CurrencyConfig.symbol})
              </Label>
              <Input
                id="smallblind"
                type="text"
                placeholder="20"
                value={smallBlind}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value === '' || !isNaN(Number(value))) {
                    const formatted = value === '' ? '' : formatCurrency(Number(value), false);
                    setSmallBlind(formatted);
                  }
                }}
                disabled={hasActiveGame}
                className="h-12 bg-background border border-input rounded-md text-base font-numbers text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-300 ease-out"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="bigblind" className="text-label text-muted-foreground ml-1">
                Big Blind ({CurrencyConfig.symbol})
              </Label>
              <Input
                id="bigblind"
                type="text"
                placeholder="40"
                value={bigBlind}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value === '' || !isNaN(Number(value))) {
                    const formatted = value === '' ? '' : formatCurrency(Number(value), false);
                    setBigBlind(formatted);
                  }
                }}
                disabled={hasActiveGame}
                className="h-12 bg-background border border-input rounded-md text-base font-numbers text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-300 ease-out"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="rake" className="text-label text-muted-foreground ml-1">
                Rake ({CurrencyConfig.symbol})
              </Label>
              <Input
                id="rake"
                type="text"
                placeholder="0"
                value={rake}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value === '' || !isNaN(Number(value))) {
                    const formatted = value === '' ? '' : formatCurrency(Number(value), false);
                    setRake(formatted);
                  }
                }}
                disabled={hasActiveGame}
                className="h-12 bg-background border border-input rounded-md text-base font-numbers text-foreground placeholder:text-muted-foreground focus:border-primary transition-all duration-300 ease-out"
              />
            </div>
          </div>

          {/* Add Players Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-label text-primary">Add Players</h3>

            {/* Selected Players List - Kept from NewGame/PlayerSelector logic but now explicit here since UniversalPlayerManager handles selection */}
            {gamePlayers.length > 0 && (
              <div className="space-y-4 mb-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Selected Players ({gamePlayers.length})
                </h4>
                <div className="grid gap-2">
                  {gamePlayers.map((player) => (
                    <LuxurySelectionCard
                      key={player.id}
                      player={player}
                      onClick={() => removePlayerFromGame(player.id)}
                      size="sm"
                      variant="remove"
                      className="bg-accent/5 border-primary/20 hover:bg-destructive/10 hover:border-destructive/50"
                    />
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary/70" />
                    <Label className="text-label text-muted-foreground">Designate Host</Label>
                  </div>
                  <Select value={hostPlayerId} onValueChange={setHostPlayerId} disabled={hasActiveGame}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select host" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...gamePlayers].sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <UniversalPlayerManager
              allPlayers={players}
              selectedPlayers={gamePlayers}
              onSelectPlayer={addPlayerToGame}
              onCreatePlayer={async (name) => { await addNewPlayer(name); }}
              mode="dialog"
              triggerButtonText="Add Players"
              className="w-full"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 pb-8 px-8 border-t border-border bg-accent/5">
        <Button
          onClick={startGame}
          disabled={loading || gamePlayers.length < 2 || !buyInAmount || !hostPlayerId || hasActiveGame}
          className="w-full h-12 text-base font-luxury shadow-lg group relative overflow-hidden active:scale-95 transition-all duration-300"
          variant="default"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Starting Game...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Play className="h-6 w-6 translate-y-[-1px] group-hover:scale-110 transition-transform" />
              <span>Start Game</span>
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewGame;
