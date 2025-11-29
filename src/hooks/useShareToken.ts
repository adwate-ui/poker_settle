import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ShareToken {
  id: string;
  token: string;
  created_at: string;
}

export const useShareToken = () => {
  const { user } = useAuth();
  const [shareToken, setShareToken] = useState<ShareToken | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShareToken = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('share_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching share token:', error);
        toast.error('Failed to fetch share token');
        return;
      }

      setShareToken(data);
    } catch (error) {
      console.error('Error fetching share token:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createShareToken = async () => {
    if (!user) return;

    try {
      const newToken = generateToken();
      const { data, error } = await supabase
        .from('share_tokens')
        .insert({
          user_id: user.id,
          token: newToken
        })
        .select()
        .single();

      if (error) throw error;

      setShareToken(data);
      toast.success('Share link created successfully');
      return data;
    } catch (error) {
      console.error('Error creating share token:', error);
      toast.error('Failed to create share link');
    }
  };

  const regenerateShareToken = async () => {
    if (!user || !shareToken) return;

    try {
      const newToken = generateToken();
      const { data, error } = await supabase
        .from('share_tokens')
        .update({ token: newToken })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setShareToken(data);
      toast.success('Share link regenerated successfully. Old link is now invalid.');
      return data;
    } catch (error) {
      console.error('Error regenerating share token:', error);
      toast.error('Failed to regenerate share link');
    }
  };

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`;
  };

  const copyShareUrl = async () => {
    if (!shareToken) return;

    try {
      await navigator.clipboard.writeText(getShareUrl(shareToken.token));
      toast.success('Share link copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    fetchShareToken();
  }, [user]);

  return {
    shareToken,
    loading,
    createShareToken,
    regenerateShareToken,
    getShareUrl,
    copyShareUrl,
  };
};
