import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type ResourceType = 'game' | 'player';

export const useSharedLink = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const generateShortCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createOrGetSharedLink = async (
    resourceType: ResourceType,
    resourceId: string
  ): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to create a shared link');
      return null;
    }

    setLoading(true);
    try {
      // Check if a shared link already exists for this resource
      const { data: existingLink, error: fetchError } = await supabase
        .from('shared_links')
        .select('short_code')
        .eq('user_id', user.id)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingLink) {
        return existingLink.short_code;
      }

      // Create a new shared link with a unique short code
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const shortCode = generateShortCode();
        
        const { data, error } = await supabase
          .from('shared_links')
          .insert({
            user_id: user.id,
            resource_type: resourceType,
            resource_id: resourceId,
            short_code: shortCode,
          })
          .select('short_code')
          .single();

        if (!error) {
          return data.short_code;
        }

        // If unique constraint violation, try again with a new code
        if (error.code === '23505') {
          attempts++;
          continue;
        }

        throw error;
      }

      throw new Error('Failed to generate unique short code');
    } catch (error) {
      console.error('Error creating shared link:', error);
      toast.error('Failed to create shared link');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getShortUrl = (shortCode: string) => {
    return `${window.location.origin}/s/${shortCode}`;
  };

  const copySharedLink = async (resourceType: ResourceType, resourceId: string) => {
    const shortCode = await createOrGetSharedLink(resourceType, resourceId);
    if (!shortCode) return;

    try {
      await navigator.clipboard.writeText(getShortUrl(shortCode));
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  return {
    loading,
    createOrGetSharedLink,
    copySharedLink,
    getShortUrl,
  };
};
