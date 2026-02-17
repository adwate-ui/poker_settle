import { useEffect, useState } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { useGameRealtime } from '@/features/game/hooks/useGameRealtime';
import { useGameDetail } from '@/features/game/hooks/useGameDetail';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Card } from "@/components/ui/card";
import { Loader2, Trophy, Clock, Search, UserPlus, Users as UsersIcon, ChevronDown, CheckCircle2, History as HistoryIcon, ShieldCheck, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/currencyUtils";
import { UniversalPlayerManager } from '@/components/player/UniversalPlayerManager';
import SeatingSlide from '@/components/game/dashboard-slides/SeatingSlide';
import BuyInSlide from '@/components/game/dashboard-slides/BuyInSlide';
import StackSlide from '@/components/game/dashboard-slides/StackSlide';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import { useDashboardStore } from "@/features/game/stores/dashboardStore";
import { useGameDashboardActions } from "@/features/game/hooks/useGameDashboardActions";
import { useGameStats } from "@/features/game/hooks/useGameStats";
import PokerTableView from "@/components/poker/PokerTableView";
import { BuyInManagementTable } from "@/components/game/BuyInManagementTable";
import { FinalStackManagement } from "@/components/game/FinalStackManagement";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardPlayerCard from "@/components/game/DashboardPlayerCard";
import { cn } from "@/lib/utils";
import { CurrencyConfig } from '@/config/localization';
import { supabase } from '@/integrations/supabase/client';

interface GameDashboardProps {
  gameId: string;
}

const GameDashboard = ({ gameId }: GameDashboardProps) => {
  const isMobile = useIsMobile();
  const {
    game,
    gamePlayers,
    setGame,
    setGamePlayers,
    setCurrentTablePosition,
    showAddPlayer,
    setShowAddPlayer,
    searchQuery,
    setSearchQuery,
    newPlayerName,
    setNewPlayerName,
    isCreatingPlayer,
    showManualTransfer,
    setShowManualTransfer,
    newTransferFrom,
    setNewTransferFrom,
    newTransferTo,
    setNewTransferTo,
    newTransferAmount,
    setNewTransferAmount,
    isCompletingGame
  } = useDashboardStore();

  const {
    addNewPlayer,
    addExistingPlayer,
    addManualTransfer,
    handleDeleteManualTransfer,
    handleCompleteGame,
    handleUpdateFinalStack,
    handleAddBuyIn
  } = useGameDashboardActions();

  // Use useGameDetail for fetching the specific game data
  const { data: gameDetail, isLoading: detailLoading, refetch: refetchGameDetail } = useGameDetail(supabase, gameId);

  // Use useGameData for auxiliary functions and lists
  const {
    players: allPlayers,
    fetchBuyInHistory,
  } = useGameData();

  // Sync state with fetched data
  useEffect(() => {
    if (gameDetail?.game) {
      setGame(gameDetail.game);
    }
    if (gameDetail?.gamePlayers) {
      setGamePlayers(gameDetail.gamePlayers);
    }
    // Sync table position if available from detail
    // Note: useGameDetail returns tablePositions array. 
    // We should pick the latest position
    if (gameDetail?.tablePositions && gameDetail.tablePositions.length > 0) {
      // Assuming sorted by snapshot_timestamp in API
      const latestPosition = gameDetail.tablePositions[gameDetail.tablePositions.length - 1]; // or index 0 depending on sort order
      // api check: .order("snapshot_timestamp", { ascending: true }) -> so last is latest
      setCurrentTablePosition(latestPosition);
    }
  }, [gameDetail, setGame, setGamePlayers, setCurrentTablePosition]);

  // Realtime updates
  // Realtime updates
  useGameRealtime(gameId);

  // Calculate detailed stats using the hook
  const {
    totalBuyIns,
    totalFinalStack,
    isBalanced,
    isStackBalanced,
    canCompleteGame,
    hasDiscrepancies,
    finalSettlements
  } = useGameStats(game, gamePlayers);

  // Filter available players for searching
  const availablePlayers = (allPlayers || []).filter(p => !gamePlayers.some(gp => gp.player_id === p.id));

  // Local state for UI sections (Desktop only mostly)
  const [playersOpen, setPlayersOpen] = useState(true);
  const [settlementsOpen, setSettlementsOpen] = useState(true);

  if (detailLoading || !game) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mobile View
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-safe">
        {/* Simplified Header */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between shadow-sm">
          <div className="flex flex-col items-start">
            <span className="text-label text-muted-foreground">Players</span>
            <span className="text-sm font-bold font-numbers text-foreground flex items-center gap-1">
              {gamePlayers.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-label text-muted-foreground">Pot</span>
              <span className="text-sm font-bold font-numbers text-foreground">{formatCurrency(totalBuyIns)}</span>
            </div>
          </div>
        </div>

        {/* Carousel Content */}
        <div className="pt-2">
          <Carousel className="w-full" opts={{ loop: false }}>
            <CarouselContent>
              {/* Slide 1: Seating/Table */}
              <CarouselItem>
                <SeatingSlide />
              </CarouselItem>

              {/* Slide 2: Buy-ins */}
              <CarouselItem>
                <BuyInSlide />
              </CarouselItem>

              {/* Slide 3: Stacks & End Game */}
              <CarouselItem>
                <StackSlide />
              </CarouselItem>
            </CarouselContent>

            {/* Carousel Indicators */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
              <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border pointer-events-auto shadow-lg">
                <CarouselDots count={3} />
              </div>
            </div>
          </Carousel>
        </div>

        <UniversalPlayerManager
          allPlayers={availablePlayers}
          selectedPlayers={gamePlayers.map(gp => gp.player)}
          onSelectPlayer={addExistingPlayer}
          onCreatePlayer={async (name) => {
            setNewPlayerName(name);
            await addNewPlayer();
          }}
          mode="dialog"
          open={showAddPlayer}
          onOpenChange={setShowAddPlayer}
          triggerButtonText="Add Player"
          className="hidden"
        />
      </div>
    );
  }

  // Desktop View
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-background via-accent/5 to-accent/10 border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-luxury text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Total Buy-ins</span>
            <span className="text-2xl font-bold font-numbers text-foreground">{formatCurrency(totalBuyIns)}</span>
          </div>
          <Trophy className="absolute right-4 top-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
        </Card>

        <Card className="p-4 bg-gradient-to-br from-background via-accent/5 to-accent/10 border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-luxury text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Stakes</span>
            <span className="text-2xl font-bold font-numbers text-foreground">
              {formatCurrency(game.buy_in_amount)}
              {game.small_blind && <span className="text-sm font-normal text-muted-foreground ml-1">({game.small_blind}/{game.big_blind})</span>}
            </span>
          </div>
          <Clock className="absolute right-4 top-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
        </Card>

        {/* Status Indicator */}
        <Card className="col-span-2 p-4 bg-gradient-to-br from-background via-accent/5 to-accent/10 border-border/50 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-state-success animate-pulse shadow-lg shadow-state-success/50" />
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase tracking-widest text-foreground">Live Game</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{gamePlayers.length} Active Players</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-accent/10 px-3 py-1 rounded-full border border-border/50 text-muted-foreground">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Table & Game Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Poker Table View */}
          <SeatingSlide />

          {/* Buy-in Management */}
          <BuyInManagementTable
            gamePlayers={gamePlayers}
            buyInAmount={game.buy_in_amount}
            onAddBuyIn={handleAddBuyIn}
            fetchBuyInHistory={fetchBuyInHistory}
          />

          {/* Stack Management */}
          <FinalStackManagement
            gamePlayers={gamePlayers}
            onUpdateFinalStack={handleUpdateFinalStack}
            smallBlind={game.small_blind}
          />
        </div>

        {/* Right Column: Players & Actions */}
        <div className="space-y-6">
          {/* Players List */}
          <Card className="p-0 overflow-hidden">
            <Collapsible open={playersOpen} onOpenChange={setPlayersOpen}>
              <CollapsibleTrigger asChild>
                <div className="p-6 border-b border-border/50 cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <UsersIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <h3 className="text-sm font-luxury text-foreground uppercase tracking-widest">Players ({gamePlayers.length})</h3>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", playersOpen && "rotate-180")} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="section-content space-y-6">
                  <Button
                    onClick={() => setShowAddPlayer(true)}
                    className="w-full h-12 bg-accent/5 border border-border hover:bg-primary/10 text-foreground text-label rounded-xl transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-2.5 text-gold-500" />
                    Add Player
                  </Button>

                  <div className="space-y-4">
                    {[...gamePlayers].sort((a, b) => a.player.name.localeCompare(b.player.name)).map((gamePlayer) => (
                      <DashboardPlayerCard
                        key={gamePlayer.id}
                        gamePlayer={gamePlayer}
                        buyInAmount={game.buy_in_amount}
                        isLiveGame={true}
                      />
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Manual Transfers Logic (Desktop) */}

          {(game.settlements && game.settlements.length > 0) && (
            <Card className="p-0 overflow-hidden border-gold-500/40 shadow-glow-gold-subtle">
              <Collapsible open={settlementsOpen} onOpenChange={setSettlementsOpen}>
                <CollapsibleTrigger asChild>
                  <div className="p-6 border-b border-border/50 bg-accent/5 cursor-pointer flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <HistoryIcon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-luxury text-foreground uppercase tracking-widest">Adjustments</h3>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", settlementsOpen && "rotate-180")} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="section-content space-y-0 text-foreground">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead className="text-right">Amt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {game.settlements.map((transfer, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-xs">{transfer.from}</TableCell>
                            <TableCell className="font-medium text-xs text-muted-foreground">{transfer.to}</TableCell>
                            <TableCell className="text-right font-numbers text-xs">
                              <div className="flex items-center justify-end gap-2">
                                {formatCurrency(transfer.amount)}
                                <button
                                  onClick={() => handleDeleteManualTransfer(index)}
                                  className="p-1 hover:bg-destructive/10 rounded text-destructive/50 hover:text-destructive transition-colors"
                                  aria-label="Delete transfer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Manual Transfer Form */}
          {showManualTransfer ? (
            <Card className="p-6 space-y-4 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 border-b pb-2 border-border/40">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-luxury uppercase tracking-widest">New Adjustment</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {gamePlayers.map(gp => (
                        <SelectItem key={`from-${gp.id}`} value={gp.player.name}>{gp.player.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {gamePlayers.map(gp => (
                        <SelectItem key={`to-${gp.id}`} value={gp.player.name}>{gp.player.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="0.00"
                  value={newTransferAmount}
                  onChange={(e) => setNewTransferAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowManualTransfer(false)} className="flex-1 h-8 text-xs">Cancel</Button>
                <Button size="sm" onClick={addManualTransfer} className="flex-1 h-8 text-xs">Save</Button>
              </div>
            </Card>
          ) : (
            <Button
              onClick={() => setShowManualTransfer(true)}
              className="w-full h-12 font-bold text-lg tracking-[0.2em] uppercase rounded-xl bg-gradient-to-r from-primary via-accent to-primary animate-shimmer text-primary-foreground shadow-lg hover:shadow-primary/30 transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Manual Adjustment
            </Button>
          )}

          {/* Validation & Completion */}
          {hasDiscrepancies ? (
            <Card className="bg-state-error/10 border-state-error/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-state-error">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Mismatch Detected</span>
              </div>
              {!isStackBalanced && (
                <div className="text-[10px] text-state-error/80 leading-tight">
                  Chips ({formatCurrency(totalFinalStack)}) ≠ Buy-ins ({formatCurrency(totalBuyIns)})
                </div>
              )}
              {!isBalanced && (
                <div className="text-[10px] text-state-error/80 leading-tight">
                  Winnings ≠ Losses
                </div>
              )}
            </Card>
          ) : (
            <Button
              onClick={() => handleCompleteGame(finalSettlements)}
              disabled={!canCompleteGame || isCompletingGame}
              className={cn(
                "w-full h-12 text-black font-bold text-lg tracking-[0.2em] rounded-xl transition-all relative overflow-hidden group",
                canCompleteGame && !isCompletingGame
                  ? 'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer hover:shadow-lg hover:shadow-primary/30 active:scale-95'
                  : 'bg-black/5 dark:bg-white/5 text-black/10 dark:text-white/10 opacity-50'
              )}
            >
              {isCompletingGame ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 fill-current" />
                  <span className="font-luxury uppercase text-lg">END GAME</span>
                </div>
              )}
            </Button>
          )}

        </div>
      </div>

      <UniversalPlayerManager
        allPlayers={allPlayers || []}
        selectedPlayers={gamePlayers.map(gp => gp.player)} // Filter out players already in game
        onSelectPlayer={addExistingPlayer}
        onCreatePlayer={async (name) => {
          setNewPlayerName(name);
          await addNewPlayer();
        }}
        mode="dialog"
        open={showAddPlayer}
        onOpenChange={setShowAddPlayer}
        triggerButtonText="Add Player"
        className="hidden"
      />
    </div>
  );
};

export default GameDashboard;
