import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PokerCard from '@/components/PokerCard';
import CardSelector from '@/components/CardSelector';
import HandReplay from '@/components/HandReplay';
import { useHandTracking } from '@/hooks/useHandTracking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeatPosition } from '@/types/poker';
import { formatCurrency } from '@/utils/currencyUtils';

interface HandDetail {
  id: string;
  hand_number: number;
  hero_position: string;
  final_stage: string;
  pot_size: number;
  is_hero_win: boolean | null;
  created_at: string;
  game_id: string;
  button_player_id: string;
  button_player_name: string;
  winner_player_id: string | null;
  winner_player_name: string | null;
  winner_player_names: string[];
  game_date: string;
  big_blind: number;
  actions: Array<{
    id: string;
    action_type: string;
    bet_size: number;
    street_type: string;
    action_sequence: number;
    is_hero: boolean;
    position: string | null;
    player_id: string;
    hole_cards: string | null;
  }>;
  street_cards: Array<{
    street_type: string;
    cards_notation: string;
  }>;
  player_names: Record<string, string>;
}

const HandDetail = () => {
  const { handId } = useParams();
  const navigate = useNavigate();
  const [hand, setHand] = useState<HandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHoleCardInput, setShowHoleCardInput] = useState(false);
  const [selectedPlayerForHole, setSelectedPlayerForHole] = useState<{ playerId: string; actionId: string } | null>(null);
  const { updateHoleCards } = useHandTracking();
  const [seatPositions, setSeatPositions] = useState<Record<string, number>>({});

  const loadTablePositions = useCallback(async () => {
    if (!handId) return;

    try {
      // Get positions directly from the hand record
      const { data: handData, error: handError } = await supabase
        .from('poker_hands')
        .select('positions')
        .eq('id', handId)
        .single();

      if (handError) throw handError;

      if (handData && handData.positions) {
        const positions: Record<string, number> = {};
        const posArray = handData.positions as unknown as SeatPosition[];
        posArray.forEach((pos: SeatPosition) => {
          positions[pos.player_id] = pos.seat;
        });
        setSeatPositions(positions);
      }
    } catch (error) {
      console.error('Error loading table positions:', error);
    }
  }, [handId]);

  const fetchHandDetail = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch hand details
      const { data: handData, error: handError } = await supabase
        .from('poker_hands')
        .select(`
          *,
          games!inner (
            date,
            big_blind
          )
        `)
        .eq('id', handId)
        .single();

      if (handError) throw handError;

      // Fetch button player name
      const { data: buttonPlayer } = await supabase
        .from('players')
        .select('name')
        .eq('id', handData.button_player_id)
        .single();

      // Fetch winner player name if exists
      let winnerPlayerName = null;
      if (handData.winner_player_id) {
        const { data: winnerPlayer } = await supabase
          .from('players')
          .select('name')
          .eq('id', handData.winner_player_id)
          .single();
        winnerPlayerName = winnerPlayer?.name;
      }

      // Fetch actions with player names
      const { data: actionsData, error: actionsError } = await supabase
        .from('player_actions')
        .select('*')
        .eq('hand_id', handId)
        .order('action_sequence', { ascending: true });

      if (actionsError) throw actionsError;

      // Get unique player IDs from actions
      const playerIds = [...new Set(actionsData.map(a => a.player_id))];

      // Fetch player names
      const { data: playersData } = await supabase
        .from('players')
        .select('id, name')
        .in('id', playerIds);

      const playerNamesMap = (playersData || []).reduce((acc, p) => {
        acc[p.id] = p.name;
        return acc;
      }, {} as Record<string, string>);

      // Fetch street cards
      const { data: streetCardsData, error: streetCardsError } = await supabase
        .from('street_cards')
        .select('*')
        .eq('hand_id', handId)
        .order('created_at', { ascending: true });

      if (streetCardsError) throw streetCardsError;

      setHand({
        ...handData,
        button_player_id: handData.button_player_id,
        button_player_name: buttonPlayer?.name || 'Unknown',
        winner_player_id: handData.winner_player_id,
        winner_player_name: winnerPlayerName,
        winner_player_names: [],
        game_date: handData.games.date,
        big_blind: handData.games.big_blind || 100,
        actions: actionsData,
        street_cards: streetCardsData || [],
        player_names: playerNamesMap,
      });
    } catch (error) {
      console.error('Error fetching hand details:', error);
    } finally {
      setLoading(false);
    }
  }, [handId]);

  useEffect(() => {
    if (handId) {
      fetchHandDetail();
      loadTablePositions();
    }
  }, [handId, fetchHandDetail, loadTablePositions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleHoleCardSubmit = async (cards: string) => {
    if (!selectedPlayerForHole) return;

    const success = await updateHoleCards(selectedPlayerForHole.actionId, cards);
    if (success) {
      setShowHoleCardInput(false);
      setSelectedPlayerForHole(null);
      // Refresh hand data
      fetchHandDetail();
    }
  };

  // Get unique players who participated in the hand - memoized
  const playersInHand = useMemo(() => {
    if (!hand) return [];

    const playerMap = new Map<string, {
      playerId: string;
      playerName: string;
      isHero: boolean;
      holeCards: string | null;
      actionId: string;
    }>();

    hand.actions.forEach(action => {
      if (!playerMap.has(action.player_id)) {
        playerMap.set(action.player_id, {
          playerId: action.player_id,
          playerName: hand.player_names[action.player_id] || 'Unknown',
          isHero: action.is_hero,
          holeCards: action.hole_cards,
          actionId: action.id,
        });
      } else {
        // Update if this action has hole cards and current doesn't
        const current = playerMap.get(action.player_id)!;
        if (action.hole_cards && !current.holeCards) {
          current.holeCards = action.hole_cards;
          current.actionId = action.id;
        }
      }
    });

    return Array.from(playerMap.values());
  }, [hand]);

  // Build community cards string, avoiding duplicates (must be defined before usedCards)
  const communityCards = useMemo(() => {
    if (!hand) return '';
    return hand.street_cards
      .sort((a, b) => {
        const order = { Flop: 1, Turn: 2, River: 3 };
        return order[a.street_type as keyof typeof order] - order[b.street_type as keyof typeof order];
      })
      .reduce((acc, streetCard) => {
        // Split current cards into individual cards (2 characters each)
        const existingCards = (acc.match(/.{1,2}/g) || []) as string[];
        const newCardsStr = streetCard.cards_notation;
        const newCards = newCardsStr.match(/.{1,2}/g) || [];

        // Only add cards that aren't already in the accumulator
        const cardsToAdd = newCards.filter(card => !existingCards.includes(card));
        return acc + cardsToAdd.join('');
      }, '');
  }, [hand]);

  // Get community cards for greying out
  const communityCardsArray = useMemo(() => {
    if (!hand) return [];
    const cards: string[] = [];

    // Add community cards only
    if (communityCards) {
      const communityCardArray = communityCards.match(/.{1,2}/g) || [];
      cards.push(...communityCardArray);
    }

    return cards;
  }, [hand, communityCards]);

  // Get known hole cards for greying out (excludes currently selected player)
  const knownHoleCards = useMemo(() => {
    if (!hand) return [];
    const cards: string[] = [];

    playersInHand.forEach(player => {
      // Exclude the currently selected player's hole cards
      if (player.holeCards && (!selectedPlayerForHole || player.playerId !== selectedPlayerForHole.playerId)) {
        const holeCardArray = player.holeCards.match(/.{1,2}/g) || [];
        cards.push(...holeCardArray);
      }
    });

    return cards;
  }, [hand, selectedPlayerForHole, playersInHand]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Hand not found</p>
        <Button onClick={() => navigate('/hands')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Hands
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button
        onClick={() => navigate('/hands')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Hands History
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap">
            <span>Hand #{hand.hand_number}</span>
            <Badge variant="outline">{hand.hero_position}</Badge>
            <Badge variant="outline">{hand.final_stage}</Badge>
            {hand.is_hero_win === true && (
              <Badge variant="success">
                <Trophy className="h-3 w-3 mr-1" />
                Won
              </Badge>
            )}
            {hand.is_hero_win === false && (
              <Badge variant="destructive">Lost</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hand Info */}
          <div>
            <h3 className="font-semibold mb-3">Hand Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-label text-muted-foreground">Game Date:</span>
                <span>{formatDate(hand.game_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label text-muted-foreground">Hero Position:</span>
                <Badge variant="outline">{hand.hero_position}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-label text-muted-foreground">Button:</span>
                <span>{hand.button_player_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label text-muted-foreground">Final Stage:</span>
                <Badge>{hand.final_stage}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-label text-muted-foreground">Pot Size:</span>
                <span className="font-bold text-poker-gold">
                  {formatCurrency(hand.pot_size || 0)} ({(hand.pot_size / hand.big_blind).toFixed(1)} BB)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-label text-muted-foreground">Winner:</span>
                <span className="font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  {hand.winner_player_name}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Hand Replay and Details Tabs */}
          <Tabs defaultValue="replay" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="replay">Hand Replay</TabsTrigger>
              <TabsTrigger value="details">Hand Details</TabsTrigger>
            </TabsList>

            <TabsContent value="replay" className="space-y-4">
              <HandReplay
                actions={hand.actions}
                streetCards={hand.street_cards}
                playerNames={hand.player_names}
                buttonPlayerId={hand.button_player_id}
                seatPositions={seatPositions}
                initialPot={hand.big_blind + (hand.big_blind / 2)}
                winnerPlayerId={hand.winner_player_id || undefined}
                winnerPlayerName={hand.winner_player_name || undefined}
              />
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              {/* Community Cards Section */}
              {hand.street_cards.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Community Cards</h3>
                  <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 p-3 sm:p-4 rounded-xl border border-green-700/30">
                    <div className="flex gap-2 sm:gap-3 md:gap-4 items-center flex-wrap">
                      {/* Flop */}
                      {(() => {
                        const flopCard = hand.street_cards.find(sc => sc.street_type === 'Flop');
                        return flopCard && (
                          <div className="flex flex-col gap-1 sm:gap-2">
                            <span className="text-label text-muted-foreground">FLOP</span>
                            <div className="flex gap-0.5">
                              {flopCard.cards_notation.match(/.{1,2}/g)?.map((card, idx) => (
                                <PokerCard key={idx} card={card} size="sm" className="sm:hidden" />
                              ))}
                              {flopCard.cards_notation.match(/.{1,2}/g)?.map((card, idx) => (
                                <PokerCard key={`desktop-${idx}`} card={card} size="md" className="hidden sm:block" />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Turn */}
                      {(() => {
                        const turnCard = hand.street_cards.find(sc => sc.street_type === 'Turn');
                        return turnCard && (
                          <>
                            <div className="h-10 sm:h-12 md:h-16 w-px bg-green-700/50"></div>
                            <div className="flex flex-col gap-1 sm:gap-2">
                              <span className="text-label text-muted-foreground">TURN</span>
                              <div className="flex gap-0.5">
                                {turnCard.cards_notation.match(/.{1,2}/g)?.map((card, idx) => (
                                  <PokerCard key={idx} card={card} size="sm" className="sm:hidden" />
                                ))}
                                {turnCard.cards_notation.match(/.{1,2}/g)?.map((card, idx) => (
                                  <PokerCard key={`desktop-${idx}`} card={card} size="md" className="hidden sm:block" />
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* River */}
                      {(() => {
                        const riverCard = hand.street_cards.find(sc => sc.street_type === 'River');
                        return riverCard && (
                          <>
                            <div className="h-10 sm:h-12 md:h-16 w-px bg-green-700/50"></div>
                            <div className="flex flex-col gap-1 sm:gap-2">
                              <span className="text-label text-muted-foreground">RIVER</span>
                              <div className="flex gap-0.5">
                                {riverCard.cards_notation.match(/.{1,2}/g)?.map((card, idx) => (
                                  <PokerCard key={idx} card={card} size="sm" className="sm:hidden" />
                                ))}
                                {riverCard.cards_notation.match(/.{1,2}/g)?.map((card, idx) => (
                                  <PokerCard key={`desktop-${idx}`} card={card} size="md" className="hidden sm:block" />
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {hand.street_cards.length > 0 && <Separator />}

              {/* Hole Cards Section */}
              <div>
                <h3 className="font-semibold mb-3">Hole Cards</h3>
                <div className="space-y-2">
                  {playersInHand.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.playerName}</span>
                        {player.isHero && (
                          <Badge variant="secondary" className="text-xs">Hero</Badge>
                        )}
                      </div>

                      {player.holeCards ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {player.holeCards.match(/.{1,2}/g)?.map((card, idx) => (
                              <PokerCard key={idx} card={card} size="xs" />
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPlayerForHole({ playerId: player.playerId, actionId: player.actionId });
                              setShowHoleCardInput(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlayerForHole({ playerId: player.playerId, actionId: player.actionId });
                            setShowHoleCardInput(true);
                          }}
                        >
                          Add Hole Cards
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Action History */}
              <div>
                <h3 className="font-semibold mb-3">Action History</h3>
                <div className="space-y-3">
                  {['Preflop', 'Flop', 'Turn', 'River'].map(street => {
                    const streetActions = hand.actions.filter(a => a.street_type === street);
                    if (streetActions.length === 0) return null;

                    return (
                      <div key={street}>
                        <div className="text-label text-muted-foreground mb-2">
                          {street}:
                        </div>
                        <div className="space-y-1 pl-4 border-l-2 border-muted">
                          {streetActions
                            .sort((a, b) => a.action_sequence - b.action_sequence)
                            .map((action, idx) => (
                              <div key={idx} className="text-sm flex justify-between items-center py-1">
                                <div className="flex items-center gap-2">
                                  {action.is_hero && (
                                    <Badge variant="secondary" className="text-xs">
                                      Hero
                                    </Badge>
                                  )}
                                  <span className="font-medium">
                                    {hand.player_names[action.player_id] || 'Unknown'}
                                  </span>
                                  {action.position && (
                                    <span className="text-xs text-muted-foreground">
                                      ({action.position})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {action.action_type}
                                  </span>
                                  {action.bet_size > 0 && (
                                    <span className="font-semibold text-poker-gold">
                                      {formatCurrency(action.bet_size)} ({(action.bet_size / hand.big_blind).toFixed(1)} BB)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Hole Card Selector - Direct Card Grid */}
      <CardSelector
        open={showHoleCardInput && !!selectedPlayerForHole}
        onOpenChange={(isOpen) => {
          setShowHoleCardInput(isOpen);
          if (!isOpen) {
            setSelectedPlayerForHole(null);
          }
        }}
        maxCards={2}
        usedCards={communityCardsArray}
        knownHoleCards={knownHoleCards}
        selectedCards={[]}
        onSelect={handleHoleCardSubmit}
        label={selectedPlayerForHole && hand ? `Select Hole Cards for ${hand.player_names[selectedPlayerForHole.playerId]}` : 'Select Hole Cards'}
      />
    </div>
  );
};

export default HandDetail;
