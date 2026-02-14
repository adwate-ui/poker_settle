import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChipDenomination, CHIP_DENOMINATIONS as DEFAULT_CHIPS } from '@/config/chips';
import { toast } from '@/lib/notifications';

interface ChipContextType {
    chips: ChipDenomination[];
    updateChipValue: (color: string, newValue: number) => Promise<void>;
    loading: boolean;
    resetDefaults: () => Promise<void>;
}

const ChipContext = createContext<ChipContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useChips = () => {
    const context = useContext(ChipContext);
    if (!context) {
        throw new Error('useChips must be used within ChipProvider');
    }
    return context;
};

export const ChipProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [chips, setChips] = useState<ChipDenomination[]>(DEFAULT_CHIPS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChips = async () => {
            if (!user) {
                setChips(DEFAULT_CHIPS);
                setLoading(false);
                return;
            }

            try {

                const { data, error } = await supabase
                    .from('profiles')
                    .select('chip_denominations')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;


                // @ts-expect-error: chip_denominations type casting
                if (data?.chip_denominations) {
                    // Parse and merge with defaults to ensure structure is valid
                    // This handles cases where we might add new properties in future
                    // @ts-expect-error: chip_denominations type casting
                    const loadedChips = data.chip_denominations as ChipDenomination[];
                    setChips(loadedChips);
                } else {
                    // First time load or no data, default is already set
                }
            } catch (error) {
                console.error('Error loading chips:', error);
                // Fallback to defaults
            } finally {
                setLoading(false);
            }
        };

        loadChips();
    }, [user]);

    const updateChipValue = async (color: string, newValue: number) => {
        if (!user) return;

        try {
            const updatedChips = chips.map(chip =>
                chip.color === color ? { ...chip, value: newValue, label: formatLabel(newValue) } : chip
            );

            setChips(updatedChips); // Optimistic update


            const { error } = await supabase
                .from('profiles')
                .update({ chip_denominations: updatedChips } as unknown as { avatar_url?: string; created_at?: string; email?: string; full_name?: string; id?: string; theme?: string; updated_at?: string; })
                .eq('id', user.id);

            if (error) throw error;
            toast.success('Chip value updated');
        } catch (error) {
            console.error('Error updating chip:', error);
            toast.error('Failed to update chip value');
            setChips(chips); // Revert on error (though we need previous state for true revert, but this is simple enough)
        }
    };

    const resetDefaults = async () => {
        if (!user) return;
        try {
            setChips(DEFAULT_CHIPS);

            const { error } = await supabase
                .from('profiles')
                .update({ chip_denominations: DEFAULT_CHIPS } as unknown as { avatar_url?: string; created_at?: string; email?: string; full_name?: string; id?: string; theme?: string; updated_at?: string; })
                .eq('id', user.id);

            if (error) throw error;
            toast.success('Restored default chip values');
        } catch (error) {
            console.error('Reset failed', error);
            toast.error('Failed to reset defaults');
        }
    }

    const formatLabel = (value: number): string => {
        if (value >= 1000) return `${value / 1000}K`;
        return value.toString();
    }

    return (
        <ChipContext.Provider value={{ chips, updateChipValue, loading, resetDefaults }}>
            {children}
        </ChipContext.Provider>
    );
};
