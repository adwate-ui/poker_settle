import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Group, Stack, Text } from '@mantine/core';
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

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/hands/${hand.id}`)}>
      <Stack gap="sm">
        <div className="flex items-center justify-between gap-4">
          <Stack gap="xs" className="flex-1">
            <Group gap="xs" wrap="wrap">
              <Text fw={600}>Hand #{hand.hand_number}</Text>
              <Badge variant="outline" size="sm">
                {hand.hero_position}
              </Badge>
              <Badge variant="outline" size="sm">
                {hand.final_stage}
              </Badge>
              {hand.is_split ? (
                <Badge color="yellow" size="sm">
                  Split
                </Badge>
              ) : hand.is_hero_win === true ? (
                <Badge color="green" size="sm" leftSection={<Trophy className="h-3 w-3" />}>
                  Won
                </Badge>
              ) : hand.is_hero_win === false ? (
                <Badge color="red" size="sm">
                  Lost
                </Badge>
              ) : null}
            </Group>
            <Text size="sm" c="dimmed">
              {formatDate(hand.game_date)} • Button: {hand.button_player_name}
              {hand.winner_player_name && ` • Winner: ${hand.winner_player_name}`}
            </Text>
          </Stack>

          <Group gap="md">
            {communityCardArray && (
              <Group gap="xs">
                {communityCardArray.map((card, idx) => (
                  <PokerCard key={`desktop-${idx}`} card={card} size="sm" className="hidden md:block" />
                ))}
                {communityCardArray.map((card, idx) => (
                  <PokerCard key={`mobile-${idx}`} card={card} size="xs" className="md:hidden" />
                ))}
              </Group>
            )}
            <Stack gap={0} align="flex-end">
              <Text size="lg" fw={700} className="text-poker-gold">
                Rs. {hand.pot_size?.toLocaleString('en-IN') || 0}
              </Text>
              <Text size="xs" c="dimmed">Pot</Text>
            </Stack>
          </Group>
        </div>
        
        {/* Players in Hand */}
        <div className="pt-2 border-t">
          <Text size="xs" c="dimmed" mb="xs">Players in Hand:</Text>
          <Group gap="xs">
            {playersInHand.map((player, idx) => (
              <Badge key={idx} variant="outline" size="sm">
                {player.name} ({player.position})
              </Badge>
            ))}
          </Group>
        </div>
      </Stack>
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
