import { useState, memo, useCallback, useMemo } from "react";
import { Card, Button, TextInput, Text, Badge, Stack, Group, Box, Divider } from "@mantine/core";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { Check } from "lucide-react";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay } from "@/lib/utils";
import { BuyInHistoryDialog } from "./BuyInHistoryDialog";
import OptimizedAvatar from "./OptimizedAvatar";

interface PlayerCardProps {
  gamePlayer: GamePlayer;
  buyInAmount: number;
  onUpdatePlayer: (gamePlayerId: string, updates: Partial<GamePlayer>, logBuyIn?: boolean) => void;
  fetchBuyInHistory: (gamePlayerId: string) => Promise<BuyInHistory[]>;
}

const PlayerCard = memo(({ gamePlayer, buyInAmount, onUpdatePlayer, fetchBuyInHistory }: PlayerCardProps) => {
  const [localFinalStack, setLocalFinalStack] = useState(gamePlayer.final_stack || 0);
  const [addBuyInsAmount, setAddBuyInsAmount] = useState<string>('');
  const [hasFinalStackChanges, setHasFinalStackChanges] = useState(false);
  
  const netAmount = useMemo(() => 
    (gamePlayer.final_stack || 0) - (gamePlayer.buy_ins * buyInAmount),
    [gamePlayer.final_stack, gamePlayer.buy_ins, buyInAmount]
  );
  const isProfit = netAmount > 0;

  const handleAddBuyIns = useCallback(() => {
    const numToAdd = parseInt(addBuyInsAmount) || 0;
    if (numToAdd === 0) {
      return;
    }
    const newTotal = gamePlayer.buy_ins + numToAdd;
    if (newTotal < 1) {
      return; // Prevent going below 1 buy-in total
    }
    if (Math.abs(numToAdd) > 50) {
      return;
    }
    
    onUpdatePlayer(gamePlayer.id, { 
      buy_ins: newTotal,
      net_amount: (gamePlayer.final_stack || 0) - (newTotal * buyInAmount)
    }, true); // Log this change
    setAddBuyInsAmount('');
  }, [addBuyInsAmount, gamePlayer.id, gamePlayer.buy_ins, gamePlayer.final_stack, buyInAmount, onUpdatePlayer]);

  const handleFinalStackChange = useCallback((value: number) => {
    setLocalFinalStack(value);
    setHasFinalStackChanges(value !== (gamePlayer.final_stack || 0));
  }, [gamePlayer.final_stack]);

  const confirmFinalStack = useCallback(() => {
    onUpdatePlayer(gamePlayer.id, { 
      final_stack: localFinalStack,
      net_amount: localFinalStack - (gamePlayer.buy_ins * buyInAmount)
    });
    setHasFinalStackChanges(false);
  }, [gamePlayer.id, gamePlayer.buy_ins, localFinalStack, buyInAmount, onUpdatePlayer]);

  return (
    <Card shadow="sm" padding="xs" radius="md" withBorder className="hover:border-primary/50 transition-colors touch-manipulation">
      <Stack gap="xs">
        {/* Header: Avatar, Player Name, Buy-ins Badge, and History Button */}
        <Group justify="space-between" gap="xs" wrap="nowrap">
          <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <OptimizedAvatar 
              name={gamePlayer.player.name}
              size="sm"
              className="flex-shrink-0"
            />
            <Text size="sm" fw={700} truncate style={{ flex: 1 }}>
              {gamePlayer.player.name}
            </Text>
          </Group>
          
          <Group gap={4} wrap="nowrap">
            <Badge size="xs" variant="light">
              {gamePlayer.buy_ins} buy-in{gamePlayer.buy_ins !== 1 ? 's' : ''}
            </Badge>
            <BuyInHistoryDialog 
              gamePlayerId={gamePlayer.id}
              playerName={gamePlayer.player.name}
              fetchHistory={fetchBuyInHistory}
            />
          </Group>
        </Group>

        {/* Buy-ins and Final Stack Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Buy-ins Input */}
          <Stack gap={4}>
            <Text size="10px" fw={600} c="dimmed">
              Add Buy-ins
            </Text>
            <Group gap={4} wrap="nowrap">
              <TextInput
                type="number"
                value={addBuyInsAmount}
                onChange={(e) => setAddBuyInsAmount(e.target.value)}
                size="xs"
                placeholder="0"
                styles={{
                  input: {
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }
                }}
              />
              {addBuyInsAmount && Number(addBuyInsAmount) > 0 && (
                <Button 
                  size="xs" 
                  onClick={handleAddBuyIns}
                  style={{ minWidth: '28px', height: '28px', padding: '0 8px' }}
                >
                  +
                </Button>
              )}
            </Group>
          </Stack>

          {/* Final Stack Input */}
          <Stack gap={4}>
            <Text size="10px" fw={600} c="dimmed">
              Final Stack (Rs.)
            </Text>
            <Group gap={4} wrap="nowrap">
              <TextInput
                type="text"
                value={formatInputDisplay(localFinalStack)}
                onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
                size="xs"
                placeholder="0"
                styles={{
                  input: {
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }
                }}
              />
              {hasFinalStackChanges && (
                <Button 
                  size="xs" 
                  onClick={confirmFinalStack}
                  style={{ minWidth: '28px', width: '28px', height: '28px', padding: 0 }}
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
            </Group>
          </Stack>
        </div>

        {/* Summary Row */}
        <Box pt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <Stack gap={4}>
            <Group justify="space-between">
              <Text size="xs" c="dimmed" fw={500}>Total Buy-ins:</Text>
              <Text size="xs" fw={600}>Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed" fw={500}>Net P&L:</Text>
              <Box 
                className={`font-bold px-2 py-0.5 rounded ${
                  isProfit 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}
              >
                <Text size="xs" fw={700} span>
                  {isProfit ? '+' : '-'}Rs. {formatIndianNumber(Math.abs(netAmount))}
                </Text>
              </Box>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;