import * as React from 'react';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, User, Wallet, History, ChevronRight, Layers, Trash2 } from 'lucide-react';
import PokerCard from '@/components/PokerCard';
import { HandWithDetails } from '@/hooks/useHandsHistory';
import { PlayerAction } from '@/types/poker';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn, formatIndianNumber } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyUtils';


interface MemoizedHandCardProps {
  hand: HandWithDetails;
  formatDate: (dateString: string) => string;
  onDelete?: (id: string) => void;
}

const MemoizedHandCard = memo(({ hand, formatDate, onDelete }: MemoizedHandCardProps) => {
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
      className="group cursor-pointer border-border bg-card hover:bg-accent/5 transition-all duration-300 overflow-hidden relative mb-2"
    >
      {/* Status indicator line */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-[1px] opacity-50",
        resultStatus === 'win' ? 'bg-gradient-to-r from-emerald-500 to-transparent' :
          resultStatus === 'loss' ? 'bg-gradient-to-r from-rose-500 to-transparent' :
            resultStatus === 'split' ? 'bg-gradient-to-r from-primary to-transparent' : 'bg-border'
      )} />

      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border/50">
          {/* Primary Info */}
          <div className="p-5 lg:p-6 flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-foreground font-bold tracking-widest text-[11px] uppercase">Sequence #{hand.hand_number}</span>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="bg-muted/50 border-border text-[9px] tracking-widest h-5 px-1.5 text-muted-foreground">{hand.hero_position}</Badge>
                    <Badge variant="outline" className="bg-muted/50 border-border text-[9px] tracking-widest h-5 px-1.5 text-muted-foreground">{hand.final_stage}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatDate(hand.game_date)}</span>
                  <span className="h-1 w-1 bg-border/50 rounded-full" />
                  <span>BTN: {hand.button_player_name}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 text-[11px] border-0 border-b-2 rounded-none h-auto",
                    resultStatus === 'win' ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/5' :
                      resultStatus === 'loss' ? 'text-rose-600 border-rose-500/30 bg-rose-500/5' :
                        resultStatus === 'split' ? 'text-primary border-primary/30 bg-primary/5' :
                          'text-muted-foreground/60 border-border'
                  )}
                >
                  {resultStatus === 'win' && <Trophy className="h-3 w-3 mr-1.5" />}
                  {resultStatus === 'win' ? 'VICTORY' : resultStatus === 'loss' ? 'DEFEAT' : resultStatus === 'split' ? 'SPLIT' : 'PROTOCOL'}
                </Badge>
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Hand?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the hand record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(hand.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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
          <div className="p-5 lg:p-6 lg:w-72 bg-muted/30 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 ml-0.5">Participating Identities</p>
              <div className="flex flex-wrap gap-1.5">
                {playersInHand.map((player, idx) => (
                  <Badge key={idx} variant="outline" className="bg-background/20 text-muted-foreground text-[9px] tracking-widest px-2 h-5 border border-border group-hover:border-primary/20 transition-colors">
                    {player.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">Aggregated Pot</p>
                <p className="text-xl text-foreground">{formatCurrency(hand.pot_size || 0)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-accent border border-border group-hover:scale-110 transition-transform">
                <ChevronRight className="h-4 w-4 text-foreground" />
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
