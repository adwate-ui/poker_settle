import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

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
