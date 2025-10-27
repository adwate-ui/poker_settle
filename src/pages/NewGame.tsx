import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Game, Player } from "@/types/poker";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Trash2, Play, ArrowLeft } from "lucide-react";
import GameDashboard from "@/components/GameDashboard";
import { formatIndianNumber, parseIndianNumber } from "@/lib/utils";

const NewGame = () => {
  const { user } = useAuth();
  const [buyInAmount, setBuyInAmount] = useState("2,000");
  const [smallBlind, setSmallBlind] = useState("20");
  const [bigBlind, setBigBlind] = useState("40");
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showActiveGame, setShowActiveGame] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPlayers();
      checkActiveGame();
    }
  }, [user]);

  const fetchPlayers = async () => {
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
  };

  const checkActiveGame = async () => {
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
  };

  const addNewPlayer = async () => {
    if (!newPlayerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("players")
        .insert({ name: newPlayerName, user_id: user?.id })
        .select()
        .single();

      if (error) throw error;

      setPlayers([...players, data]);
      setGamePlayers([...gamePlayers, data]);
      setNewPlayerName("");
      toast.success("Player added");
    } catch (error) {
      toast.error("Failed to add player");
    } finally {
      setLoading(false);
    }
  };

  const addExistingPlayer = (playerId?: string) => {
    const player = players.find(p => p.id === (playerId || selectedPlayerId));
    if (!player) return;

    if (gamePlayers.find(p => p.id === player.id)) {
      toast.error("Player already added");
      return;
    }

    setGamePlayers([...gamePlayers, player]);
    setSelectedPlayerId("");
    setOpenCombobox(false);
    toast.success("Player added to game");
  };

  const removePlayer = (playerId: string) => {
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
        net_amount: 0,
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
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Active Game in Progress</CardTitle>
              <CardDescription className="text-sm">
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
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Start New Game</CardTitle>
        <CardDescription className="text-sm">Set up your poker game with buy-in and players</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Buy-in Section */}
        <div className="space-y-2">
          <Label htmlFor="buyin">Buy-in Amount (Rs.)</Label>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smallblind">Small Blind (Rs.)</Label>
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
          <div className="space-y-2">
            <Label htmlFor="bigblind">Big Blind (Rs.)</Label>
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
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold">Players ({gamePlayers.length})</h3>
          
          {/* Current Players List */}
          {gamePlayers.length > 0 && (
            <div className="grid gap-2">
              {[...gamePlayers].sort((a, b) => a.name.localeCompare(b.name)).map((player) => (
                <Card key={player.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{player.name}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="info" className="text-xs">
                            {player.total_games} games
                          </Badge>
                          <Badge variant={player.total_profit >= 0 ? "success" : "destructive"} className="text-xs">
                            {player.total_profit >= 0 ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit))}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(player.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add New Player */}
          <div className="flex gap-2">
            <Input
              placeholder="New player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewPlayer()}
              className="flex-1"
              disabled={hasActiveGame}
            />
            <Button onClick={addNewPlayer} disabled={loading || hasActiveGame} className="w-[140px]">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>

          {/* Add Existing Player */}
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between"
                disabled={hasActiveGame}
              >
                {selectedPlayerId
                  ? players.find((player) => player.id === selectedPlayerId)?.name
                  : "Select existing player..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search players..." />
                <CommandList>
                  <CommandEmpty>No player found.</CommandEmpty>
                  <CommandGroup>
                    {players
                      .filter(p => !gamePlayers.find(gp => gp.id === p.id))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((player) => (
                        <CommandItem
                          key={player.id}
                          value={player.name}
                          onSelect={() => {
                            addExistingPlayer(player.id);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedPlayerId === player.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex items-center gap-2 w-full">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                              <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`}
                                alt={player.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                              <span className="font-medium">{player.name}</span>
                              <div className="flex items-center gap-1">
                                <Badge variant="info" className="text-xs">
                                  {player.total_games} games
                                </Badge>
                                <Badge variant={player.total_profit >= 0 ? "success" : "destructive"} className="text-xs">
                                  {player.total_profit >= 0 ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit))}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
