import { memo, useMemo } from "react";
import { Card, Group, Text, Badge, Stack } from '@mantine/core';
import { GamePlayer } from "@/types/poker";
import { formatIndianNumber, getProfitLossColor, formatProfitLoss } from "@/lib/utils";
import OptimizedAvatar from "./OptimizedAvatar";

interface PlayerCardMantineProps {
  gamePlayer: GamePlayer;
  buyInAmount: number;
  isLiveGame?: boolean;
}

const PlayerCardMantine = memo(({ gamePlayer, buyInAmount, isLiveGame = false }: PlayerCardMantineProps) => {
  const netAmount = useMemo(() => 
    (gamePlayer.final_stack || 0) - (gamePlayer.buy_ins * buyInAmount),
    [gamePlayer.final_stack, gamePlayer.buy_ins, buyInAmount]
  );
  const totalBuyIns = gamePlayer.buy_ins * buyInAmount;
  const finalStack = gamePlayer.final_stack || 0;

  return (
    <Card 
      shadow="sm" 
      padding="md" 
      radius="md" 
      withBorder
      style={{ 
        borderColor: 'var(--mantine-color-gray-4)',
        borderWidth: 2,
        height: '100%'
      }}
    >
      <Stack gap="sm">
        {/* Player Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ flexShrink: 0 }}>
              <OptimizedAvatar 
                name={gamePlayer.player.name}
                size="sm"
              />
            </div>
            <Text 
              fw={700} 
              size="md" 
              style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {gamePlayer.player.name}
            </Text>
          </Group>
        </Group>

        {/* Buy-ins Info */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Total Buy-ins</Text>
          <Group gap="xs">
            <Badge color="gray" variant="filled">{gamePlayer.buy_ins}</Badge>
            <Text fw={600} size="sm">Rs. {formatIndianNumber(totalBuyIns)}</Text>
          </Group>
        </Group>

        {/* Final Stack */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Total Stack</Text>
          <Text fw={600} size="sm">Rs. {formatIndianNumber(finalStack)}</Text>
        </Group>

        {/* Net P&L */}
        <Group justify="space-between" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Text size="sm" fw={600}>Final P&L</Text>
          <Badge 
            color={getProfitLossColor(netAmount)} 
            variant="filled" 
            size="lg"
            style={{ 
              fontSize: '0.875rem',
              backgroundColor: netAmount < 0 ? 'var(--mantine-color-red-filled)' : 'var(--mantine-color-green-filled)',
              color: 'white'
            }}
          >
            {formatProfitLoss(netAmount)}
          </Badge>
        </Group>
      </Stack>
    </Card>
  );
});

PlayerCardMantine.displayName = 'PlayerCardMantine';

export default PlayerCardMantine;
