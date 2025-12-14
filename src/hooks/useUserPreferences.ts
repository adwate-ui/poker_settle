import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPreferences } from '@/types/poker';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { DEFAULT_PAYMENT_KEYWORDS } from '@/constants/paymentKeywords';

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newPrefs, error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              card_back_design: 'classic',
              tutorial_completed: false,
              payment_keywords: [...DEFAULT_PAYMENT_KEYWORDS],
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating preferences:', insertError);
            toast.error('Failed to create user preferences');
            return;
          }

          setPreferences(newPrefs);
        } else {
          console.error('Error fetching preferences:', error);
          toast.error('Failed to load user preferences');
        }
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update user preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        toast.error('Failed to save preferences');
        return false;
      }

      // Update local state
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Preferences saved successfully');
      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      toast.error('Failed to save preferences');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, preferences]);

  // Update email settings
  const updateEmailSettings = useCallback(async (emailSettings: {
    email_service_id?: string;
    email_template_id?: string;
    email_public_key?: string;
    email_from_address?: string;
    email_from_name?: string;
  }) => {
    return await updatePreferences(emailSettings);
  }, [updatePreferences]);

  // Update payment keywords
  const updatePaymentKeywords = useCallback(async (keywords: string[]) => {
    return await updatePreferences({ payment_keywords: keywords });
  }, [updatePreferences]);

  // Update tutorial completion status
  const completeTutorial = useCallback(async () => {
    return await updatePreferences({ tutorial_completed: true });
  }, [updatePreferences]);

  // Update custom Supabase settings
  const updateSupabaseSettings = useCallback(async (settings: {
    custom_supabase_url?: string | null;
    custom_supabase_key?: string | null;
  }) => {
    return await updatePreferences(settings);
  }, [updatePreferences]);

  // Check if email is configured
  const isEmailConfigured = useCallback(() => {
    if (!preferences) return false;
    return !!(
      preferences.email_service_id &&
      preferences.email_template_id &&
      preferences.email_public_key &&
      preferences.email_from_address
    );
  }, [preferences]);

  // Check if custom Supabase is configured
  const hasCustomSupabase = useCallback(() => {
    if (!preferences) return false;
    return !!(preferences.custom_supabase_url && preferences.custom_supabase_key);
  }, [preferences]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
    updateEmailSettings,
    updatePaymentKeywords,
    completeTutorial,
    updateSupabaseSettings,
    isEmailConfigured,
    hasCustomSupabase,
    refetch: fetchPreferences,
  };
};
