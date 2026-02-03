import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/notifications";
import { Game, Player } from "@/types/poker";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Play, Info } from "lucide-react";
import GameDashboard from "@/components/GameDashboard";
import PlayerSelector from "@/components/PlayerSelector";
import { formatIndianNumber, parseIndianNumber } from "@/lib/utils";
import { usePlayerManagement } from "@/hooks/usePlayerManagement";
import { cn } from "@/lib/utils";

const NewGame = () => {
  const { user } = useAuth();
  const { createPlayer, createOrFindPlayerByName } = usePlayerManagement();
  const [buyInAmount, setBuyInAmount] = useState("2,000");
  const [smallBlind, setSmallBlind] = useState("20");
  const [bigBlind, setBigBlind] = useState("40");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showActiveGame, setShowActiveGame] = useState(false);

  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("user_id", user?.id)
      .order("name");

    if (error) {
      toast.error("Failed to load players");
      return;
    }
    setPlayers(data || []);
  }, [user]);

  const checkActiveGame = useCallback(async () => {
    const { data, error } = await supabase
      .from("games")
      .select(`
        *,
        game_players (
          *,
          player:players (*)
        )
      `)
      .eq("user_id", user?.id)
      .eq("is_complete", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setActiveGame(data as Game);
    } else {
      setActiveGame(null);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlayers();
      checkActiveGame();
    }
  }, [user, fetchPlayers, checkActiveGame]);

  const addNewPlayer = async (name: string): Promise<Player> => {
    const player = await createOrFindPlayerByName(name);

    if (!players.find(p => p.id === player.id)) {
      setPlayers([...players, player]);
    }
    return player;
  };

  const addNewPlayerWithDetails = async (playerData: import('@/components/PlayerFormDialog').PlayerFormData): Promise<Player> => {
    const player = await createPlayer(playerData);
    setPlayers([...players, player]);
    return player;
  };

  const addPlayerToGame = (player: Player) => {
    setGamePlayers([...gamePlayers, player]);
  };

  const removePlayerFromGame = (playerId: string) => {
    setGamePlayers(gamePlayers.filter(p => p.id !== playerId));
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

    setLoading(true);
    try {
      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          buy_in_amount: parsedAmount,
          small_blind: parseIndianNumber(smallBlind),
          big_blind: parseIndianNumber(bigBlind),
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
      }));

      const { error: playersError } = await supabase
        .from("game_players")
        .insert(gamePlayersData);

      if (playersError) throw playersError;

      const { data: completeGame, error: fetchError } = await supabase
        .from("games")
        .select(`
          *,
          game_players (
            *,
            player:players (*)
          )
        `)
        .eq("id", game.id)
        .single();

      if (fetchError) throw fetchError;

      toast.success("Game started!");
      setActiveGame(completeGame as Game);
      setShowActiveGame(true);
    } catch (error) {
      toast.error("Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromGame = () => {
    setShowActiveGame(false);
    checkActiveGame();
  };

  const continueGame = () => {
    setShowActiveGame(true);
  };

  if (activeGame && showActiveGame) {
    return <GameDashboard game={activeGame} onBackToSetup={handleBackFromGame} />;
  }

  const hasActiveGame = activeGame !== null;

  return (
    <Card className="max-w-4xl mx-auto relative overflow-hidden border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/40 backdrop-blur-xl">
      {hasActiveGame && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white/90 dark:bg-[#0a0a0a]/90 border-black/20 dark:border-gold-500/30 shadow-[0_0_50px_rgba(212,184,60,0.15)] animate-in fade-in zoom-in duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-gold-500/10 border border-gold-500/20">
                  <Play className="h-5 w-5 text-gold-500" />
                </div>
                <CardTitle className="text-2xl font-luxury text-gold-900 dark:text-gold-100">
                  Active Game
                </CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                You have a game in progress. Please complete the current game before starting a new one.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button onClick={continueGame} className="w-full h-12 text-base font-luxury tracking-widest uppercase hover:scale-[1.02] transition-transform shadow-lg shadow-gold-500/10" variant="default">
                Resume Active Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-luxury text-gold-900 dark:text-gold-100 uppercase tracking-widest">
          Start New Game
        </CardTitle>
        <CardDescription className="text-gray-400">
          Configure game settings and add players.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-10">
        <div className="space-y-8">
          {/* Buy-in Section */}
          <div className="space-y-3">
            <Label htmlFor="buyin" className="text-sm font-luxury uppercase tracking-[0.2em] text-gold-500/60 ml-1">
              Initial Buy-in (Rs.)
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
                    const formatted = value === '' ? '' : formatIndianNumber(Number(value));
                    setBuyInAmount(formatted);
                  }
                }}
                disabled={hasActiveGame}
                className="h-12 bg-black/5 dark:bg-white/5 border-0 border-b border-black/10 dark:border-white/20 px-0 rounded-none text-xl font-numbers text-black dark:text-white placeholder:text-black/10 dark:placeholder:text-white/10 focus:border-gold-500 focus:bg-black/10 dark:focus:bg-white/10 transition-all duration-300 ease-out"
              />
              <div className="absolute right-0 bottom-3 text-gold-500/30 group-focus-within:text-gold-500 transition-colors">
                <Info className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Blinds Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="smallblind" className="text-sm font-luxury uppercase tracking-[0.2em] text-gold-500/60 ml-1">
                Small Blind (Rs.)
              </Label>
              <Input
                id="smallblind"
                type="text"
                placeholder="20"
                value={smallBlind}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value === '' || !isNaN(Number(value))) {
                    const formatted = value === '' ? '' : formatIndianNumber(Number(value));
                    setSmallBlind(formatted);
                  }
                }}
                disabled={hasActiveGame}
                className="h-12 bg-black/5 dark:bg-white/5 border-0 border-b border-black/10 dark:border-white/20 px-0 rounded-none text-xl font-numbers text-black dark:text-white placeholder:text-black/10 dark:placeholder:text-white/10 focus:border-gold-500 focus:bg-black/10 dark:focus:bg-white/10 transition-all duration-300 ease-out"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="bigblind" className="text-sm font-luxury uppercase tracking-[0.2em] text-gold-500/60 ml-1">
                Big Blind (Rs.)
              </Label>
              <Input
                id="bigblind"
                type="text"
                placeholder="40"
                value={bigBlind}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value === '' || !isNaN(Number(value))) {
                    const formatted = value === '' ? '' : formatIndianNumber(Number(value));
                    setBigBlind(formatted);
                  }
                }}
                disabled={hasActiveGame}
                className="h-12 bg-black/5 dark:bg-white/5 border-0 border-b border-black/10 dark:border-white/20 px-0 rounded-none text-xl font-numbers text-black dark:text-white placeholder:text-black/10 dark:placeholder:text-white/10 focus:border-gold-500 focus:bg-black/10 dark:focus:bg-white/10 transition-all duration-300 ease-out"
              />
            </div>
          </div>

          {/* Add Players Section */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-base font-luxury uppercase tracking-widest text-gold-400">Add Players</h3>
            <PlayerSelector
              allPlayers={players}
              selectedPlayers={gamePlayers}
              onAddPlayer={addPlayerToGame}
              onRemovePlayer={removePlayerFromGame}
              onCreateNewPlayer={addNewPlayer}
              onCreateNewPlayerWithDetails={addNewPlayerWithDetails}
              disabled={hasActiveGame}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 pb-8 px-8 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/2">
        <Button
          onClick={startGame}
          disabled={loading || gamePlayers.length < 2 || !buyInAmount || hasActiveGame}
          className="w-full h-14 text-lg font-luxury tracking-[0.2em] uppercase shadow-[0_4px_20px_rgba(212,184,60,0.15)] group relative overflow-hidden active:scale-95 transition-all duration-300"
          variant="default"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-gold-200" />
              <span>Starting Game...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Play className="h-6 w-6 translate-y-[-1px] group-hover:text-gold-200 transition-colors" />
              <span>Start Game</span>
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewGame;
