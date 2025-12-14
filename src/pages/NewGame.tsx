import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/notifications";
import { Game, Player } from "@/types/poker";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Play } from "lucide-react";
import GameDashboard from "@/components/GameDashboard";
import PlayerSelector from "@/components/PlayerSelector";
import { formatIndianNumber, parseIndianNumber } from "@/lib/utils";
import { usePlayerManagement } from "@/hooks/usePlayerManagement";

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
    
    // Add to players list if not already there
    if (!players.find(p => p.id === player.id)) {
      setPlayers([...players, player]);
    }
    return player;
  };

  const addNewPlayerWithDetails = async (playerData: import('@/components/PlayerFormDialog').PlayerFormData): Promise<Player> => {
    const player = await createPlayer(playerData);
    
    // Add to players list
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

      const gameWithPlayers: Game = {
        ...game,
        game_players: []
      };

      const gamePlayersData = gamePlayers.map((player, index) => ({
        game_id: game.id,
        player_id: player.id,
        buy_ins: 1,
        final_stack: 0,
        net_amount: -buyInAmount, // Final stack (0) - total buy-in (1 * buyInAmount) = -buyInAmount
      }));

      const { error: playersError } = await supabase
        .from("game_players")
        .insert(gamePlayersData);

      if (playersError) throw playersError;

      // Fetch the complete game with players
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
    <Card className="max-w-4xl mx-auto relative">
      {hasActiveGame && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg p-3">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Active Game in Progress</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                You have an ongoing game. Complete it before starting a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={continueGame} className="w-full" size="lg">
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Continue Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Start New Game</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Set up your poker game with buy-in and players</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buy-in Section */}
        <div className="space-y-1.5">
          <Label htmlFor="buyin" className="text-xs sm:text-sm">Buy-in Amount (Rs.)</Label>
          <Input
            id="buyin"
            type="text"
            placeholder="Enter buy-in amount"
            value={buyInAmount}
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, '');
              if (value === '' || !isNaN(Number(value))) {
                const formatted = value === '' ? '' : formatIndianNumber(Number(value));
                setBuyInAmount(formatted);
              }
            }}
            disabled={hasActiveGame}
          />
        </div>

        {/* Blinds Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="smallblind" className="text-xs sm:text-sm">Small Blind (Rs.)</Label>
            <Input
              id="smallblind"
              type="text"
              placeholder="Small blind"
              value={smallBlind}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                if (value === '' || !isNaN(Number(value))) {
                  const formatted = value === '' ? '' : formatIndianNumber(Number(value));
                  setSmallBlind(formatted);
                }
              }}
              disabled={hasActiveGame}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bigblind" className="text-xs sm:text-sm">Big Blind (Rs.)</Label>
            <Input
              id="bigblind"
              type="text"
              placeholder="Big blind"
              value={bigBlind}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                if (value === '' || !isNaN(Number(value))) {
                  const formatted = value === '' ? '' : formatIndianNumber(Number(value));
                  setBigBlind(formatted);
                }
              }}
              disabled={hasActiveGame}
            />
          </div>
        </div>

        {/* Add Players Section */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-semibold">Players</h3>
          
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

        {/* Start Game Button */}
        <Button 
          onClick={startGame} 
          disabled={loading || gamePlayers.length < 2 || !buyInAmount || hasActiveGame}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Starting Game...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NewGame;
