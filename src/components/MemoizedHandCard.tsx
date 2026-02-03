import * as React from 'react';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, User, Wallet, History, ChevronRight, Layers } from 'lucide-react';
import PokerCard from '@/components/PokerCard';
import { HandWithDetails } from '@/hooks/useHandsHistory';
import { PlayerAction } from '@/types/poker';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatIndianNumber } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';

interface MemoizedHandCardProps {
  hand: HandWithDetails;
  formatDate: (dateString: string) => string;
}

const MemoizedHandCard = memo(({ hand, formatDate }: MemoizedHandCardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const communityCards = hand.street_cards
    .sort((a, b) => {
      const order = { Flop: 1, Turn: 2, River: 3 };
      return order[a.street_type as keyof typeof order] - order[b.street_type as keyof typeof order];
    })
    .map(c => c.cards_notation)
    .join('');

  const communityCardArray = communityCards ? communityCards.match(/.{1,2}/g)?.slice(0, 5) : undefined;

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

  const resultStatus = hand.is_split ? 'split' : hand.is_hero_win === true ? 'win' : hand.is_hero_win === false ? 'loss' : 'neutral';

  return (
    <Card
      onClick={() => navigate(`/hands/${hand.id}`)}
      className="group cursor-pointer border-white/5 bg-black/40 backdrop-blur-xl hover:bg-white/5 transition-all duration-300 overflow-hidden relative"
    >
      {/* Status indicator line */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-[1px] opacity-50",
        resultStatus === 'win' ? 'bg-gradient-to-r from-green-500 to-transparent' :
          resultStatus === 'loss' ? 'bg-gradient-to-r from-red-500 to-transparent' :
            resultStatus === 'split' ? 'bg-gradient-to-r from-gold-500 to-transparent' : 'bg-white/10'
      )} />

      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          {/* Primary Info */}
          <div className="p-5 lg:p-6 flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-luxury text-gold-100 font-bold tracking-widest text-[11px] uppercase">Sequence #{hand.hand_number}</span>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="bg-black/40 border-white/10 text-[9px] font-luxury tracking-widest h-5 px-1.5 text-white/40">{hand.hero_position}</Badge>
                    <Badge variant="outline" className="bg-black/40 border-white/10 text-[9px] font-luxury tracking-widest h-5 px-1.5 text-white/40">{hand.final_stage}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase font-luxury tracking-[0.2em] text-white/20">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatDate(hand.game_date)}</span>
                  <span className="h-1 w-1 bg-white/10 rounded-full" />
                  <span>BTN: {hand.button_player_name}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 font-numbers text-[11px] border-0 border-b-2 rounded-none h-auto",
                    resultStatus === 'win' ? 'text-green-400 border-green-500/30 bg-green-500/5' :
                      resultStatus === 'loss' ? 'text-red-400 border-red-500/30 bg-red-500/5' :
                        resultStatus === 'split' ? 'text-gold-400 border-gold-500/30 bg-gold-500/5' :
                          'text-white/20 border-white/10'
                  )}
                >
                  {resultStatus === 'win' && <Trophy className="h-3 w-3 mr-1.5" />}
                  {resultStatus === 'win' ? 'VICTORY' : resultStatus === 'loss' ? 'DEFEAT' : resultStatus === 'split' ? 'SPLIT' : 'PROTOCOL'}
                </Badge>
              </div>
            </div>

            {communityCardArray && (
              <div className="flex items-center gap-0.5 animate-in fade-in duration-500">
                {communityCardArray.map((card, idx) => (
                  <div key={idx} className="scale-90 origin-left hover:scale-100 transition-transform duration-300">
                    <PokerCard card={card} size={isMobile ? "xs" : "sm"} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secondary Metadata */}
          <div className="p-5 lg:p-6 lg:w-72 bg-white/2 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <p className="text-[9px] font-luxury uppercase tracking-[0.3em] text-white/20 ml-0.5">Participating Identities</p>
              <div className="flex flex-wrap gap-1.5">
                {playersInHand.map((player, idx) => (
                  <Badge key={idx} variant="outline" className="bg-black/20 text-white/40 text-[9px] font-luxury tracking-widest px-2 h-5 border border-white/5 group-hover:border-gold-500/20 transition-colors">
                    {player.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-luxury uppercase tracking-[0.2em] text-gold-500/40">Aggregated Pot</p>
                <p className="font-numbers text-xl text-gold-100">₹{formatIndianNumber(hand.pot_size || 0)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,184,60,0.1)]">
                <ChevronRight className="h-4 w-4 text-gold-500" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return prevProps.hand.id === nextProps.hand.id &&
    prevProps.hand.pot_size === nextProps.hand.pot_size &&
    prevProps.hand.is_hero_win === nextProps.hand.is_hero_win &&
    prevProps.hand.is_split === nextProps.hand.is_split;
});

MemoizedHandCard.displayName = 'MemoizedHandCard';

export default MemoizedHandCard;
