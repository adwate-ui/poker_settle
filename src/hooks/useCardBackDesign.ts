import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type CardBackDesign = 'classic' | 'geometric' | 'diamond' | 'hexagon' | 'wave' | 'radial';

const VALID_CARD_BACK_DESIGNS: CardBackDesign[] = ['classic', 'geometric', 'diamond', 'hexagon', 'wave', 'radial'];

const isValidCardBackDesign = (value: string): value is CardBackDesign => {
  return VALID_CARD_BACK_DESIGNS.includes(value as CardBackDesign);
};

export const useCardBackDesign = () => {
  const { user } = useAuth();
  const [design, setDesign] = useState<CardBackDesign>('classic');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDesign('classic');
      setLoading(false);
      return;
    }

    const loadDesign = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('card_back_design')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.card_back_design) {
          // Validate the value from database
          if (isValidCardBackDesign(data.card_back_design)) {
            setDesign(data.card_back_design);
          } else {
            console.warn('Invalid card back design in database:', data.card_back_design);
            // Fall back to classic if invalid value
            setDesign('classic');
          }
        }
      } catch (error) {
        console.error('Error loading card back design:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDesign();
  }, [user]);

  const updateDesign = async (newDesign: CardBackDesign) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          card_back_design: newDesign,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setDesign(newDesign);
    } catch (error) {
      console.error('Error updating card back design:', error);
      throw error;
    }
  };

  return { design, setDesign: updateDesign, loading };
};
