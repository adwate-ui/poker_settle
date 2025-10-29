import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import PokerTableView from './PokerTableView';
import { SeatPosition } from '@/types/poker';
import PokerCard from './PokerCard';

interface HandAction {
  id: string;
  action_type: string;
  bet_size: number;
  street_type: string;
  action_sequence: number;
  player_id: string;
  position: string | null;
}

interface StreetCard {
  street_type: string;
  cards_notation: string;
}

interface HandReplayProps {
  actions: HandAction[];
  streetCards: StreetCard[];
  playerNames: Record<string, string>;
  buttonPlayerId: string;
  seatPositions: Record<string, number>;
  initialPot: number;
}

const HandReplay = ({
  actions,
  streetCards,
  playerNames,
  buttonPlayerId,
  seatPositions,
  initialPot,
}: HandReplayProps) => {
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStreet, setCurrentStreet] = useState<'Preflop' | 'Flop' | 'Turn' | 'River'>('Preflop');
  const [potSize, setPotSize] = useState(initialPot);
  const [streetPlayerBets, setStreetPlayerBets] = useState<Record<string, number>>({});
  const [communityCards, setCommunityCards] = useState<string>('');

  // Convert player names to SeatPosition format
  const positions: SeatPosition[] = Object.entries(playerNames).map(([playerId, playerName]) => ({
    seat: seatPositions[playerId] ?? 0,
    player_id: playerId,
    player_name: playerName,
  })).sort((a, b) => a.seat - b.seat);

  // Process action and update state
  const processAction = (actionIndex: number) => {
    if (actionIndex >= actions.length) return;

    const action = actions[actionIndex];
    
    // Check if street changed
    if (action.street_type !== currentStreet) {
      // Reset street bets when moving to new street
      setStreetPlayerBets({});
      setCurrentStreet(action.street_type as any);
      
      // Add community cards for the new street
      const streetCard = streetCards.find(sc => sc.street_type === action.street_type);
      if (streetCard) {
        setCommunityCards(prev => prev + streetCard.cards_notation);
      }
    }

    // Update player bet for current street
    if (action.bet_size > 0 && !['Small Blind', 'Big Blind'].includes(action.action_type)) {
      setStreetPlayerBets(prev => ({
        ...prev,
        [action.player_id]: action.bet_size,
      }));
    }

    // Update pot (bet_size already includes the full bet amount)
    if (action.bet_size > 0) {
      setPotSize(prev => {
        const currentPlayerBet = streetPlayerBets[action.player_id] || 0;
        return prev + (action.bet_size - currentPlayerBet);
      });
    }

    // Handle fold - remove player's chips
    if (action.action_type === 'Fold') {
      setStreetPlayerBets(prev => {
        const newBets = { ...prev };
        delete newBets[action.player_id];
        return newBets;
      });
    }
  };

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying || currentActionIndex >= actions.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      processAction(currentActionIndex);
      setCurrentActionIndex(prev => prev + 1);
    }, 1500); // 1.5 seconds between actions

    return () => clearTimeout(timer);
  }, [isPlaying, currentActionIndex]);

  const handlePlayPause = () => {
    if (currentActionIndex >= actions.length) {
      // Reset if at end
      handleReset();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (currentActionIndex < actions.length) {
      processAction(currentActionIndex);
      setCurrentActionIndex(prev => prev + 1);
    }
  };

  const handleStepBack = () => {
    if (currentActionIndex > 0) {
      // Reset and replay up to previous action
      handleReset();
      for (let i = 0; i < currentActionIndex - 1; i++) {
        processAction(i);
      }
      setCurrentActionIndex(currentActionIndex - 1);
    }
  };

  const handleReset = () => {
    setCurrentActionIndex(0);
    setIsPlaying(false);
    setCurrentStreet('Preflop');
    setPotSize(initialPot);
    setStreetPlayerBets({});
    setCommunityCards('');
  };

  const getCurrentAction = () => {
    if (currentActionIndex === 0) return null;
    return actions[currentActionIndex - 1];
  };

  const currentAction = getCurrentAction();

  return (
    <div className="space-y-4">
      {/* Community Cards */}
      {communityCards && (
        <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-lg p-6">
          <div className="flex gap-2 justify-center flex-wrap">
            {communityCards.match(/.{1,2}/g)?.map((card, idx) => (
              <PokerCard key={idx} card={card} size="lg" />
            ))}
          </div>
        </div>
      )}

      {/* Poker Table */}
      <PokerTableView
        positions={positions}
        buttonPlayerId={buttonPlayerId}
        seatPositions={seatPositions}
        playerBets={streetPlayerBets}
        potSize={potSize}
        showPositionLabels={true}
      />

      {/* Current Action Display */}
      {currentAction && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="font-semibold">
                  {playerNames[currentAction.player_id]}
                </div>
                {currentAction.position && (
                  <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    {currentAction.position}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{currentAction.action_type}</span>
                {currentAction.bet_size > 0 && (
                  <span className="font-bold text-poker-gold">
                    Rs. {currentAction.bet_size.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          disabled={currentActionIndex === 0}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleStepBack}
          disabled={currentActionIndex === 0 || isPlaying}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={handlePlayPause}
          disabled={currentActionIndex >= actions.length && !isPlaying}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleStepForward}
          disabled={currentActionIndex >= actions.length || isPlaying}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="text-center text-sm text-muted-foreground">
        Action {currentActionIndex} of {actions.length} • {currentStreet}
      </div>
    </div>
  );
};

export default HandReplay;
