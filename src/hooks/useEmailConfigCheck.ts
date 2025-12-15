import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to check if the user has configured email notifications.
 * Shows the email configuration modal on first login if not configured.
 * 
 * @returns {Object} Object containing:
 *   - showEmailConfig: boolean - whether to show the email config modal
 *   - setShowEmailConfig: function - setter to control modal visibility
 *   - loading: boolean - whether the check is in progress
 */
export const useEmailConfigCheck = () => {
  const { user } = useAuth();
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEmailConfig = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email_configured')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking email config:', error);
          setLoading(false);
          return;
        }

        // Show modal if email is not configured
        setShowEmailConfig(!data?.email_configured);
      } catch (error) {
        console.error('Error in email config check:', error);
      } finally {
        setLoading(false);
      }
    };

    checkEmailConfig();
  }, [user]);

  return {
    showEmailConfig,
    setShowEmailConfig,
    loading,
  };
};
