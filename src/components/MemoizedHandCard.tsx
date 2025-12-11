import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import PokerCard from '@/components/PokerCard';
import { HandWithDetails } from '@/hooks/useHandsHistory';
import { PlayerAction } from '@/types/poker';

interface MemoizedHandCardProps {
  hand: HandWithDetails;
  formatDate: (dateString: string) => string;
}

const MemoizedHandCard = memo(({ hand, formatDate }: MemoizedHandCardProps) => {
  const navigate = useNavigate();

  const communityCards = hand.street_cards
    .sort((a, b) => {
      const order = { Flop: 1, Turn: 2, River: 3 };
      return order[a.street_type as keyof typeof order] - order[b.street_type as keyof typeof order];
    })
    .map(c => c.cards_notation)
    .join('');

  const playersInHand = Array.from(new Map(
    hand.actions
      .filter(a => {
        const action = a as PlayerAction & { player?: { name: string } };
        return action.player?.name && a.position;
      })
      .map(a => {
        const action = a as PlayerAction & { player: { name: string } };
        return [
          action.player.name,
          { name: action.player.name, position: a.position }
        ] as const;
      })
  ).values());

  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(`/hands/${hand.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">Hand #{hand.hand_number}</span>
                <Badge variant="outline" className="text-xs">
                  {hand.hero_position}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {hand.final_stage}
                </Badge>
                {hand.is_split ? (
                  <Badge className="bg-yellow-600 text-xs">
                    Split
                  </Badge>
                ) : hand.is_hero_win === true ? (
                  <Badge className="bg-green-600 text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    Won
                  </Badge>
                ) : hand.is_hero_win === false ? (
                  <Badge variant="destructive" className="text-xs">
                    Lost
                  </Badge>
                ) : null}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(hand.game_date)} • Button: {hand.button_player_name}
                {hand.winner_player_name && ` • Winner: ${hand.winner_player_name}`}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {communityCards && (
                <div className="hidden md:flex gap-1">
                  {communityCards.match(/.{1,2}/g)?.slice(0, 5).map((card, idx) => (
                    <PokerCard key={idx} card={card} size="sm" />
                  ))}
                </div>
              )}
              <div className="text-right">
                <div className="text-lg font-bold text-poker-gold">
                  Rs. {hand.pot_size?.toLocaleString('en-IN') || 0}
                </div>
                <div className="text-xs text-muted-foreground">Pot</div>
              </div>
            </div>
          </div>
          
          {/* Players in Hand */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Players in Hand:</p>
            <div className="flex flex-wrap gap-2">
              {playersInHand.map((player, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {player.name} ({player.position})
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return prevProps.hand.id === nextProps.hand.id &&
         prevProps.hand.pot_size === nextProps.hand.pot_size &&
         prevProps.hand.is_hero_win === nextProps.hand.is_hero_win &&
         prevProps.hand.is_split === nextProps.hand.is_split;
});

MemoizedHandCard.displayName = 'MemoizedHandCard';

export default MemoizedHandCard;
