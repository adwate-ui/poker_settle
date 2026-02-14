import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useHandTracking } from '@/hooks/useHandTracking';
import { Game, GamePlayer } from '@/types/poker';
import { HandStage, ActionType } from '@/utils/handStateMachine';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Play, TrendingUp, Trophy, X } from 'lucide-react';
import CardSelector from './CardSelector';
import PokerCard from './PokerCard';
import PokerTableView from './PokerTableView';
import { determineWinner, parseCardNotationString } from '@/utils/pokerHandEvaluator';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { SeatPosition } from '@/types/poker';
import { useHandPersistence } from '@/hooks/useHandPersistence';
import { usePokerEngine } from '@/hooks/usePokerEngine';
import { formatCurrency } from '@/utils/currencyUtils';
import ActionControls from './ActionControls';
import CommunityCards from './CommunityCards';

interface HandTrackingProps {
  game: Game;
  positionsJustChanged?: boolean;
  onHandComplete?: () => void;
  initialSeatPositions?: SeatPosition[];
}

const MOBILE_BREAKPOINT_PX = 640;

const HandTracking = ({ game, positionsJustChanged = false, onHandComplete, initialSeatPositions = [] }: HandTrackingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const handTracking = useHandTracking();
  const persistence = useHandPersistence(game.id);

  // Seat positions state
  const [seatPositions, setSeatPositions] = useState<Record<string, number>>({});
  const [positionsChanged, setPositionsChanged] = useState(false);

  // Hero Player
  const heroPlayer = useMemo(() => game.game_players.find(gp =>
    gp.player.name.toLowerCase() === user?.email?.split('@')[0]?.toLowerCase()
  ), [game.game_players, user]);

  // Engine
  const engine = usePokerEngine(game, heroPlayer, seatPositions, handTracking, persistence);

  // UI State
  const [betAmount, setBetAmount] = useState('');
  const [showHoleCardInput, setShowHoleCardInput] = useState(false);
  const [selectedPlayerForHole, setSelectedPlayerForHole] = useState<string>('');
  const [showPlayerActionDialog, setShowPlayerActionDialog] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [cardSelectorType, setCardSelectorType] = useState<'flop' | 'turn' | 'river'>('flop');
  const [cardsJustAdded, setCardsJustAdded] = useState(false);
  const [tempCommunityCards, setTempCommunityCards] = useState<string>('');
  const [showMobileHandTracking, setShowMobileHandTracking] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT_PX : false);
  const [showDesktopCardSelector, setShowDesktopCardSelector] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Load table positions
  useEffect(() => {
    const loadTablePositions = async () => {
      if (initialSeatPositions.length > 0) {
        const positions: Record<string, number> = {};
        initialSeatPositions.forEach(pos => { positions[pos.player_id] = pos.seat; });
        setSeatPositions(positions);
        return;
      }

      const { data } = await supabase
        .from('table_positions')
        .select('*')
        .eq('game_id', game.id)
        .order('snapshot_timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.positions) {
        const positions: Record<string, number> = {};
        (data.positions as unknown as SeatPosition[]).forEach(pos => {
          positions[pos.player_id] = pos.seat;
        });
        setSeatPositions(positions);
      }
    };
    loadTablePositions();
  }, [game.id, positionsJustChanged, initialSeatPositions]);

  useEffect(() => { setPositionsChanged(positionsJustChanged); }, [positionsJustChanged]);

  // Window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Restore state
  useEffect(() => {
    const savedState = persistence.loadHandState();
    if (savedState && savedState.stage !== 'setup') {
      engine.restoreState(savedState);
      setShowMobileHandTracking(true);
      toast({ title: 'Hand Restored', description: `Continuing Hand #${savedState.currentHand.hand_number}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open mobile hand tracking when hand starts or stage changes
  useEffect(() => {
    if (isMobile && engine.stage !== 'setup' && engine.stage !== 'showdown') {
      setShowMobileHandTracking(true);
    }
  }, [engine.stage, isMobile]);

  // Card selector logic
  const openCardSelector = useCallback((type: 'flop' | 'turn' | 'river') => {
    setCardSelectorType(type);
    setTempCommunityCards('');
    if (isMobile) setShowCardSelector(true);
    else setShowDesktopCardSelector(true);
  }, [isMobile]);

  useEffect(() => {
    if (!engine.currentHand || engine.stage === 'setup' || engine.stage === 'showdown') return;
    const shouldOpen = (engine.stage === 'flop' && !engine.flopCards) ||
      (engine.stage === 'turn' && !engine.turnCard && engine.flopCards) ||
      (engine.stage === 'river' && !engine.riverCard && engine.turnCard);
    if (shouldOpen) openCardSelector(engine.stage as 'flop' | 'turn' | 'river');
  }, [engine.stage, engine.flopCards, engine.turnCard, engine.riverCard, engine.currentHand, isMobile, openCardSelector]);

  // Swipe logic
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchStart - touchEnd < -50) { // Right swipe
      if (cardsJustAdded) handleEditCards();
      else if (engine.actionHistory.length > 0) engine.undoLastAction();
    }
  };

  const handleEditCards = () => {
    const cards = engine.stage === 'flop' ? engine.flopCards : engine.stage === 'turn' ? engine.turnCard : engine.riverCard;
    if (cards) {
      setCardSelectorType(engine.stage as 'flop' | 'turn' | 'river');
      setTempCommunityCards(cards);
      if (isMobile) setShowCardSelector(true);
      else setShowDesktopCardSelector(true);
    }
  };

  const formatWithBB = (amount: number) => `${formatCurrency(amount)} (${(amount / (game.big_blind || 100)).toFixed(1)} BB)`;

  const handleAction = async (type: ActionType, amount?: number) => {
    await engine.recordAction(type, amount);
    setBetAmount('');
    setCardsJustAdded(false);
  };

  const handleFinishHand = async (winnerIds: string[], stageOverride?: HandStage) => {
    setShowMobileHandTracking(false);
    await engine.finishHand(winnerIds, stageOverride);
    if (onHandComplete) onHandComplete();
  };

  const getUsedCards = (exclude: string[] = []) => {
    const cards: string[] = [];
    Object.values(engine.playerHoleCards).forEach(h => cards.push(...parseCardNotationString(h)));
    cards.push(...parseCardNotationString(engine.flopCards));
    if (engine.turnCard) cards.push(engine.turnCard);
    if (engine.riverCard) cards.push(engine.riverCard);
    return cards.filter(c => !exclude.includes(c));
  };

  const handleHoleCardSubmit = (cards: string) => {
    const used = getUsedCards(parseCardNotationString(engine.playerHoleCards[selectedPlayerForHole] || ''));
    if (parseCardNotationString(cards).some(c => used.includes(c))) {
      toast({ title: 'Duplicate Card', description: 'This card is already used.', variant: 'destructive' });
      return;
    }
    engine.setPlayerHoleCards(prev => ({ ...prev, [selectedPlayerForHole]: cards }));
    setShowHoleCardInput(false);
  };

  // Pre-calculate derived values unconditionally
  const getTablePositions = (players: GamePlayer[]) => {
    return players.map(p => ({
      seat: seatPositions[p.player_id] ?? 0,
      player_id: p.player_id,
      player_name: p.player?.name || 'Unknown'
    }));
  };

  const isStreetCardMissing = useMemo(() => {
    if (engine.stage === 'flop' && !engine.flopCards) return true;
    if (engine.stage === 'turn' && !engine.turnCard && engine.flopCards) return true;
    if (engine.stage === 'river' && !engine.riverCard && engine.turnCard) return true;
    return false;
  }, [engine.stage, engine.flopCards, engine.turnCard, engine.riverCard]);

  const winnerResult = useMemo(() => {
    if (engine.stage !== 'showdown') return null;
    const remaining = engine.activePlayers.filter(p => engine.playersInHand.includes(p.player_id));
    if (!remaining.every(p => engine.playerHoleCards[p.player_id])) return null;
    const community = engine.flopCards + engine.turnCard + engine.riverCard;
    if (community.length < 10) return null;
    return determineWinner(remaining.map(p => ({ playerId: p.player_id, playerName: p.player.name, holeCards: engine.playerHoleCards[p.player_id] })), community);
  }, [engine.stage, engine.activePlayers, engine.playersInHand, engine.playerHoleCards, engine.flopCards, engine.turnCard, engine.riverCard]);


  const commonTableProps = {
    positions: getTablePositions(engine.activePlayers),
    buttonPlayerId: engine.buttonPlayerId,
    seatPositions: seatPositions,
    playerBets: engine.streetPlayerBets,
    potSize: engine.visualPotSize,
    activePlayerId: engine.currentPlayer?.player_id,
    foldedPlayers: engine.activePlayers.filter(p => !engine.playersInHand.includes(p.player_id)).map(p => p.player_id)
  };

  const actionControlsProps = {
    currentPlayerId: engine.currentPlayer?.player_id,
    playersInHand: engine.playersInHand,
    currentBet: engine.currentBet,
    betAmount,
    setBetAmount,
    onAction: handleAction,
    onUndo: engine.undoLastAction,
    onNextStreet: engine.moveToNextStreet,
    canUndo: engine.actionHistory.length > 0,
    canMoveToNextStreet: engine.canMoveToNextStreet(),
    stage: engine.stage,
    isStreetCardMissing,
    onOpenCardSelector: () => openCardSelector(engine.stage as 'flop' | 'turn' | 'river')
  };

  const communityCardsProps = {
    flopCards: engine.flopCards,
    turnCard: engine.turnCard,
    riverCard: engine.riverCard,
    onEdit: handleEditCards
  };

  // Determine content based on stage
  let content = null;

  if (engine.stage === 'setup') {
    const selectedPlayer = selectedPlayerId ? game.game_players.find(gp => gp.player_id === selectedPlayerId) : null;
    content = (
      <>
        <Card className="mt-6 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="p-2 bg-primary/20 rounded-lg"><Play className="h-5 w-5 sm:h-6 sm:w-6" /></div>
              Start New Hand
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 p-4 rounded-xl border border-green-700/30">
              <PokerTableView
                positions={getTablePositions([...game.game_players].sort((a, b) => (seatPositions[a.player_id] ?? 999) - (seatPositions[b.player_id] ?? 999)))}
                buttonPlayerId={engine.buttonPlayerId}
                seatPositions={seatPositions}
                foldedPlayers={engine.dealtOutPlayers}
                onPlayerClick={(pid) => {
                  setSelectedPlayerId(pid);
                  if (isMobile) setShowPlayerActionDialog(true);
                }}
                communityCards=""
              />
            </div>

            {selectedPlayer && !isMobile && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{selectedPlayer.player.name.substring(0, 2).toUpperCase()}</div>
                  <span className="font-semibold">{selectedPlayer.player.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant={engine.dealtOutPlayers.includes(selectedPlayerId) ? "default" : "outline"} size="sm" onClick={() => engine.setDealtOutPlayers(prev => prev.includes(selectedPlayerId) ? prev.filter(id => id !== selectedPlayerId) : [...prev, selectedPlayerId])}>
                    {engine.dealtOutPlayers.includes(selectedPlayerId) ? "Dealt In" : "Dealt Out"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPlayerId('')}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Dealer</Label>
              <Select value={engine.buttonPlayerId} onValueChange={engine.setButtonPlayerId}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Choose dealer..." /></SelectTrigger>
                <SelectContent>
                  {game.game_players.filter(p => !engine.dealtOutPlayers.includes(p.player_id)).sort((a, b) => (seatPositions[a.player_id] ?? 999) - (seatPositions[b.player_id] ?? 999)).map(gp => (
                    <SelectItem key={gp.player_id} value={gp.player_id}>
                      {gp.player.name} (Seat {seatPositions[gp.player_id] ?? '?'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={engine.resetHandState} variant="outline" className="h-12 px-6">Cancel</Button>
              <Button onClick={() => engine.startNewHand(engine.buttonPlayerId, engine.dealtOutPlayers)} disabled={!engine.buttonPlayerId || handTracking.loading || positionsChanged} className="flex-1 h-12">
                {positionsChanged ? 'Positions Changed' : 'Deal Cards'}
              </Button>
            </div>
          </CardContent>
        </Card>
        {isMobile && (
          <Dialog open={showPlayerActionDialog} onOpenChange={setShowPlayerActionDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>{selectedPlayer?.player.name}</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-4">
                <Button className="w-full h-14" variant={engine.dealtOutPlayers.includes(selectedPlayerId) ? "default" : "outline"} onClick={() => { engine.setDealtOutPlayers(prev => prev.includes(selectedPlayerId) ? prev.filter(id => id !== selectedPlayerId) : [...prev, selectedPlayerId]); setShowPlayerActionDialog(false); }}>
                  {engine.dealtOutPlayers.includes(selectedPlayerId) ? "Mark as Playing" : "Mark as Not Playing"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  } else if (engine.stage === 'showdown') {
    const remaining = engine.activePlayers.filter(p => engine.playersInHand.includes(p.player_id));
    const showdownContent = (
      <Card className="border-2 border-poker-gold/50 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 py-3">
          <CardTitle className="flex justify-between items-center">
            <span className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Showdown</span>
            {winnerResult && <Badge className="bg-state-success">Winner Detected!</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex justify-center gap-2 bg-green-900/50 p-3 rounded-lg">
            {parseCardNotationString(engine.flopCards).map((c, i) => <PokerCard key={i} card={c} size="xs" />)}
            {engine.turnCard && <div className="w-px bg-white/20" />}
            {engine.turnCard && <PokerCard card={engine.turnCard} size="xs" />}
            {engine.riverCard && <div className="w-px bg-white/20" />}
            {engine.riverCard && <PokerCard card={engine.riverCard} size="xs" />}
          </div>
          <div className="text-xl font-bold text-center text-poker-gold">Pot: {formatCurrency(engine.potSize)}</div>
          <div className="space-y-2">
            {remaining.map(p => (
              <div key={p.player_id} className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                <span className="font-semibold">{p.player.name} {p.player_id === heroPlayer?.player_id && '(Hero)'}</span>
                <div className="flex gap-2 items-center">
                  {engine.playerHoleCards[p.player_id] ? (
                    <>
                      <div className="flex gap-1">{parseCardNotationString(engine.playerHoleCards[p.player_id]).map((c, i) => <PokerCard key={i} card={c} size="xs" />)}</div>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedPlayerForHole(p.player_id); setShowHoleCardInput(true); }}>Edit</Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => { setSelectedPlayerForHole(p.player_id); setShowHoleCardInput(true); }}>Add Cards</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {winnerResult && (
            <div className="bg-state-success/20 border border-state-success p-4 rounded-lg text-center space-y-3">
              <div className="text-xl font-bold text-state-success">🏆 {winnerResult.winners.map(w => w.playerName).join(' & ')} Wins!</div>
              <div className="text-poker-gold font-semibold">{winnerResult.winners[0].handName}</div>
              <Button variant="success" className="w-full" onClick={() => handleFinishHand(winnerResult.winners.map(w => w.playerId), 'showdown')}>Confirm & Complete</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );

    content = (
      <div className="mt-6">
        {isMobile ? (
          <Drawer open={true}><DrawerContent className="h-[90vh] p-4 overflow-y-auto">{showdownContent}</DrawerContent></Drawer>
        ) : showdownContent}
        <CardSelector
          open={showHoleCardInput} onOpenChange={setShowHoleCardInput} maxCards={2}
          usedCards={getUsedCards(parseCardNotationString(engine.playerHoleCards[selectedPlayerForHole] || ''))}
          onSelect={handleHoleCardSubmit} label={`Hole Cards: ${remaining.find(p => p.player_id === selectedPlayerForHole)?.player.name}`}
        />
      </div>
    );
  } else {
    // Default active hand stage
    content = (
      <>
        {isMobile ? (
          <>
            {!showMobileHandTracking && (
              <div className="mt-8 flex justify-center px-4">
                <Button
                  onClick={() => setShowMobileHandTracking(true)}
                  className="w-full max-w-xs bg-primary hover:bg-primary/90 text-white font-bold py-8 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 animate-in fade-in zoom-in duration-300"
                >
                  <div className="p-3 bg-white/20 rounded-full">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs opacity-80 uppercase tracking-widest font-luxury">Hand #{engine.currentHand?.hand_number}</div>
                    <div className="text-lg">Resume Tracking</div>
                  </div>
                </Button>
              </div>
            )}
            <Drawer open={showMobileHandTracking} onOpenChange={setShowMobileHandTracking} dismissible={true}>
              <DrawerContent className="h-[95vh] focus:outline-none" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <div className="p-4 flex flex-col h-full space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-bold">Hand #{engine.currentHand?.hand_number}</span>
                      <Badge>{engine.stage?.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">💰 {formatCurrency(engine.potSize)}</Badge>
                      <Button variant="ghost" size="sm" onClick={engine.resetHandState}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-[2] overflow-hidden rounded-xl border bg-green-900/10">
                    <PokerTableView {...commonTableProps} />
                  </div>
                  <CommunityCards {...communityCardsProps} />
                  <div className="pb-safe">
                    <ActionControls {...actionControlsProps} />
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <Card className="mt-6 border-2 border-primary/50 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl"><TrendingUp className="w-6 h-6 text-primary" /></div>
                  <div><h2 className="text-xl font-bold">Hand #{engine.currentHand?.hand_number}</h2><Badge variant="outline" className="mt-1">{engine.stage?.toUpperCase()}</Badge></div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="text-xl py-3 px-6 bg-amber-500/20 text-amber-600 border-amber-500/20">💰 {formatWithBB(engine.potSize)}</Badge>
                  <Button variant="ghost" onClick={engine.resetHandState} className="hover:bg-destructive/10"><X className="w-5 h-5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="rounded-2xl border-2 border-border/50 bg-green-950/5 overflow-hidden">
                <PokerTableView {...commonTableProps} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <CommunityCards {...communityCardsProps} />
                  <ActionControls {...actionControlsProps} />
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Action History</span><Badge>{engine.allHandActions.length}</Badge></div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {engine.actionsByStreet.map(street => (
                      <div key={street.street} className="space-y-1">
                        <div className="text-[10px] font-bold text-primary/50 text-center py-1 border-y border-primary/5">{street.street}</div>
                        {street.actions.map((a, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-background/50 rounded-lg border text-xs">
                            <div className="flex items-center gap-2"><span className="font-bold">{engine.activePlayers.find(p => p.player_id === a.player_id)?.player.name}</span><Badge variant="outline">{a.position}</Badge></div>
                            <div className="flex items-center gap-2"><Badge variant={a.action_type === 'Fold' ? 'destructive' : 'secondary'}>{a.action_type}</Badge>{a.bet_size > 0 && <span className="font-bold text-amber-600">{a.bet_size}</span>}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card Selector Dialogs */}
        <Dialog open={showCardSelector} onOpenChange={setShowCardSelector}>
          <DialogContent className="max-w-2xl">
            <CardSelector
              maxCards={cardSelectorType === 'flop' ? 3 : 1}
              usedCards={getUsedCards(parseCardNotationString(tempCommunityCards))}
              selectedCards={parseCardNotationString(tempCommunityCards)}
              onSelect={cards => {
                if (cardSelectorType === 'flop') engine.setFlopCards(cards);
                else if (cardSelectorType === 'turn') engine.setTurnCard(cards);
                else engine.setRiverCard(cards);
                setCardsJustAdded(true);
                setShowCardSelector(false);
              }}
              label={`Select ${cardSelectorType}`}
              open={true}
              onOpenChange={setShowCardSelector}
            />
          </DialogContent>
        </Dialog>

        <CardSelector
          maxCards={engine.stage === 'flop' ? 3 : 1}
          open={showDesktopCardSelector}
          onOpenChange={setShowDesktopCardSelector}
          usedCards={getUsedCards(parseCardNotationString(tempCommunityCards))}
          selectedCards={parseCardNotationString(tempCommunityCards)}
          onSelect={cards => {
            if (engine.stage === 'flop') engine.setFlopCards(cards);
            else if (engine.stage === 'turn') engine.setTurnCard(cards);
            else engine.setRiverCard(cards);
            setCardsJustAdded(true);
            setShowDesktopCardSelector(false);
          }}
          label={`Select ${engine.stage}`}
        />
      </>
    );
  }

  return content;
};

export default HandTracking;
