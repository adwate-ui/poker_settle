import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/notifications';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils/currencyUtils';
import { parseIndianNumber } from '@/lib/utils';
import { CurrencyConfig } from '@/config/localization';

const toNum = (s: string) => (s === '' ? null : parseIndianNumber(s));

const GameDefaultsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [buyIn, setBuyIn] = useState('');
  const [smallBlind, setSmallBlind] = useState('');
  const [bigBlind, setBigBlind] = useState('');
  const [rake, setRake] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchDefaults = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('default_buy_in, default_small_blind, default_big_blind, default_rake')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        if (data.default_buy_in != null) setBuyIn(formatCurrency(data.default_buy_in, false));
        if (data.default_small_blind != null) setSmallBlind(formatCurrency(data.default_small_blind, false));
        if (data.default_big_blind != null) setBigBlind(formatCurrency(data.default_big_blind, false));
        if (data.default_rake != null) setRake(formatCurrency(data.default_rake, false));
      }
    };
    fetchDefaults();
  }, [user]);

  const makeChangeHandler = (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '');
      if (raw === '' || !isNaN(Number(raw))) {
        setter(raw === '' ? '' : formatCurrency(Number(raw), false));
      }
    };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          default_buy_in: toNum(buyIn),
          default_small_blind: toNum(smallBlind),
          default_big_blind: toNum(bigBlind),
          default_rake: toNum(rake),
        },
        { onConflict: 'id' }
      );
    setLoading(false);
    if (error) {
      toast.error('Failed to save game defaults');
    } else {
      toast.success('Game defaults saved');
      queryClient.invalidateQueries({ queryKey: ['gameDefaults', user.id] });
    }
  };

  const fields: { label: string; value: string; setter: (v: string) => void; placeholder: string }[] = [
    { label: `Buy-in (${CurrencyConfig.symbol})`, value: buyIn, setter: setBuyIn, placeholder: '2,000' },
    { label: `Small Blind (${CurrencyConfig.symbol})`, value: smallBlind, setter: setSmallBlind, placeholder: '20' },
    { label: `Big Blind (${CurrencyConfig.symbol})`, value: bigBlind, setter: setBigBlind, placeholder: '40' },
    { label: `Rake (${CurrencyConfig.symbol})`, value: rake, setter: setRake, placeholder: '200' },
  ];

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle>Game Defaults</CardTitle>
        <CardDescription>Pre-fill values when starting a new game. Leave blank to use app defaults.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, value, setter, placeholder }) => (
            <div key={label} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{label}</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder={placeholder}
                value={value}
                onChange={makeChangeHandler(setter)}
                className="h-12 md:h-10 font-numbers"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={loading} className="h-12 md:h-10">
            {loading ? 'Saving...' : 'Save Defaults'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameDefaultsTab;
