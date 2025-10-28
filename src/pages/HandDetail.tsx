import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PokerCard from '@/components/PokerCard';
import CardNotationInput from '@/components/CardNotationInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useHandTracking } from '@/hooks/useHandTracking';

interface HandDetail {
  id: string;
  hand_number: number;
  hero_position: string;
  final_stage: string;
  pot_size: number;
  is_hero_win: boolean | null;
  created_at: string;
  game_id: string;
  button_player_name: string;
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

  useEffect(() => {
    fetchHandDetail();
  }, [handId]);

  const fetchHandDetail = async () => {
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
        button_player_name: buttonPlayer?.name || 'Unknown',
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
  };

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

  // Get unique players who participated in the hand
  const getPlayersInHand = () => {
    const playerMap = new Map<string, { 
      playerId: string; 
      playerName: string; 
      isHero: boolean; 
      holeCards: string | null;
      actionId: string;
    }>();
    
    hand?.actions.forEach(action => {
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
  };

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

  const communityCards = hand.street_cards
    .sort((a, b) => {
      const order = { Flop: 1, Turn: 2, River: 3 };
      return order[a.street_type as keyof typeof order] - order[b.street_type as keyof typeof order];
    })
    .map(c => c.cards_notation)
    .join('');

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
              <Badge className="bg-green-600">
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
                <span className="text-muted-foreground">Game Date:</span>
                <span>{formatDate(hand.game_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hero Position:</span>
                <Badge variant="outline">{hand.hero_position}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Button:</span>
                <span>{hand.button_player_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final Stage:</span>
                <Badge>{hand.final_stage}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pot Size:</span>
                <span className="font-bold text-poker-gold">
                  Rs. {hand.pot_size?.toLocaleString('en-IN') || 0} ({(hand.pot_size / hand.big_blind).toFixed(1)} BB)
                </span>
              </div>
              {hand.winner_player_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Winner:</span>
                  <span className="font-semibold">{hand.winner_player_name}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Community Cards */}
          {communityCards && (
            <>
              <div>
                <h3 className="font-semibold mb-3">Community Cards</h3>
                <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-lg p-6">
                  <div className="flex gap-2 justify-center flex-wrap">
                    {communityCards.match(/.{1,2}/g)?.map((card, idx) => (
                      <PokerCard key={idx} card={card} size="lg" />
                    ))}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Hole Cards Section */}
          <div>
            <h3 className="font-semibold mb-3">Hole Cards</h3>
            <div className="space-y-2">
              {getPlayersInHand().map((player) => (
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
                      <div className="flex gap-1">
                        {player.holeCards.match(/.{1,2}/g)?.map((card, idx) => (
                          <PokerCard key={idx} card={card} size="sm" />
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
                    <div className="font-semibold text-sm text-muted-foreground mb-2">
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
                                  Rs. {action.bet_size.toLocaleString('en-IN')} ({(action.bet_size / hand.big_blind).toFixed(1)} BB)
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
        </CardContent>
      </Card>

      {/* Hole Card Input Dialog */}
      <Dialog open={showHoleCardInput} onOpenChange={setShowHoleCardInput}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Enter Hole Cards for{' '}
              {selectedPlayerForHole && hand?.player_names[selectedPlayerForHole.playerId]}
            </DialogTitle>
          </DialogHeader>
          <CardNotationInput
            label="Hole Cards"
            expectedCards={2}
            onSubmit={handleHoleCardSubmit}
            placeholder="AhKd"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HandDetail;
