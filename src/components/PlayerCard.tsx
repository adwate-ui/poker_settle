import { useState, memo, useCallback, useMemo } from "react";
import { TextInput, Text, Badge, Stack, Group, Divider } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { Check } from "lucide-react";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay, getProfitLossColor, formatProfitLoss, getProfitLossBadgeStyle } from "@/lib/utils";
import { BuyInHistoryDialog } from "./BuyInHistoryDialog";
import OptimizedAvatar from "./OptimizedAvatar";
import { GlassCard } from "./ui/GlassCard";

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

  const profitLossBadgeColor = netAmount > 0
    ? "bg-green-500/20 text-[#00ff88] border-[#00ff88]/30"
    : netAmount < 0
      ? "bg-red-500/20 text-[#ff4d4d] border-[#ff4d4d]/30"
      : "bg-gray-500/20 text-gray-400 border-gray-500/30";

  return (
    <GlassCard className="p-3 transition-all duration-300 hover:scale-[1.01] touch-manipulation border-white/5">
      <Stack gap="xs">
        {/* Header: Avatar, Player Name, Buy-ins Badge, and History Button */}
        <Group justify="space-between" gap="xs" wrap="nowrap">
          <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <OptimizedAvatar
              name={gamePlayer.player.name}
              size="sm"
              className="flex-shrink-0"
            />
            <Text className="font-luxury tracking-wide" size="sm" fw={700} truncate style={{ flex: 1 }}>
              {gamePlayer.player.name}
            </Text>
          </Group>

          <Group gap={4} wrap="nowrap">
            <Badge size="xs" variant="filled" className="bg-gold-500/20 text-gold-400 font-numbers border border-gold-500/30">
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
        <div className="grid grid-cols-2 gap-3">
          {/* Buy-ins Input */}
          <Stack gap={4}>
            <Text size="xs" fw={700} className="text-gold-200/60 uppercase tracking-tighter" style={{ fontSize: '9px' }}>
              Add Buy-ins
            </Text>
            <Group gap={4} wrap="nowrap">
              <TextInput
                type="number"
                value={addBuyInsAmount}
                onChange={(e) => setAddBuyInsAmount(e.target.value)}
                size="xs"
                placeholder="0"
                className="flex-1"
                styles={{
                  input: {
                    textAlign: 'center',
                    fontFamily: 'var(--font-numbers)',
                    fontSize: '13px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'white',
                    height: '32px'
                  }
                }}
              />
              {addBuyInsAmount && Number(addBuyInsAmount) > 0 && (
                <Button
                  size="sm"
                  onClick={handleAddBuyIns}
                  className="min-w-[32px] h-8 px-0 bg-gold-600 hover:bg-gold-500 text-black font-bold"
                >
                  +
                </Button>
              )}
            </Group>
          </Stack>

          {/* Final Stack Input */}
          <Stack gap={4}>
            <Text size="xs" fw={700} className="text-gold-200/60 uppercase tracking-tighter" style={{ fontSize: '9px' }}>
              Final Stack
            </Text>
            <Group gap={4} wrap="nowrap">
              <TextInput
                type="text"
                value={formatInputDisplay(localFinalStack)}
                onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
                size="xs"
                placeholder="0"
                className="flex-1"
                styles={{
                  input: {
                    textAlign: 'center',
                    fontFamily: 'var(--font-numbers)',
                    fontSize: '13px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'white',
                    height: '32px'
                  }
                }}
              />
              {hasFinalStackChanges && (
                <Button
                  size="sm"
                  onClick={confirmFinalStack}
                  className="min-w-[32px] w-8 h-8 p-0 bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </Group>
          </Stack>
        </div>

        {/* Summary Row */}
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <Group justify="space-between">
            <Text size="xs" className="text-white/40 font-medium">Total Buy-ins:</Text>
            <Text size="xs" className="font-numbers text-white/80">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" className="text-white/40 font-medium">Net P&L:</Text>
            <Badge
              className={`font-numbers px-2 py-0.5 border h-auto ${profitLossBadgeColor}`}
              variant="outline"
              size="sm"
            >
              {formatProfitLoss(netAmount)}
            </Badge>
          </Group>
        </div>
      </Stack>
    </GlassCard>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;