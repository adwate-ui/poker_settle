import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/lib/notifications';
import {
  ShareResourceType,
  ShareLinkData,
  generateShortCode,
  buildShortUrl,
  copyToClipboard,
} from '@/lib/shareUtils';

interface UseSharedLinkReturn {
  loading: boolean;
  createOrGetSharedLink: (
    resourceType: ShareResourceType,
    resourceId: string
  ) => Promise<ShareLinkData | null>;
  copyShareLink: (
    resourceType: ShareResourceType,
    resourceId: string
  ) => Promise<boolean>;
  getShortUrl: (shortCode: string) => string;
}

const MAX_SHORT_CODE_ATTEMPTS = 5;

export const useSharedLink = (): UseSharedLinkReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Fetch existing shared link for a resource
   */
  const fetchExistingLink = useCallback(
    async (
      resourceType: ShareResourceType,
      resourceId: string
    ): Promise<ShareLinkData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('shared_links')
        .select('short_code, access_token, resource_type, resource_id')
        .eq('user_id', user.id)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .maybeSingle();

      if (error) {
        console.error('[useSharedLink] Error fetching existing link:', error);
        throw error;
      }

      if (data) {
        return {
          shortCode: data.short_code,
          accessToken: data.access_token,
          resourceType: data.resource_type as ShareResourceType,
          resourceId: data.resource_id,
        };
      }

      return null;
    },
    [user]
  );

  /**
   * Create a new shared link with unique short code
   */
  const createNewLink = useCallback(
    async (
      resourceType: ShareResourceType,
      resourceId: string
    ): Promise<ShareLinkData | null> => {
      if (!user) return null;

      let attempts = 0;

      while (attempts < MAX_SHORT_CODE_ATTEMPTS) {
        const shortCode = generateShortCode();

        const { data, error } = await supabase
          .from('shared_links')
          .insert({
            user_id: user.id,
            resource_type: resourceType,
            resource_id: resourceId,
            short_code: shortCode,
          })
          .select('short_code, access_token, resource_type, resource_id')
          .single();

        if (!error && data) {
          return {
            shortCode: data.short_code,
            accessToken: data.access_token,
            resourceType: data.resource_type as ShareResourceType,
            resourceId: data.resource_id,
          };
        }

        // Unique constraint violation - try again
        if (error?.code === '23505') {
          // It might be a collision on (user_id, resource_type, resource_id) instead of short_code.
          // In that case, another request just created it. Let's try to fetch it.
          const existing = await fetchExistingLink(resourceType, resourceId);
          if (existing) {
            return existing;
          }
          // If not found, it was a short_code collision. Retry with new code.
          attempts++;
          continue;
        }

        // Other error - throw
        console.error('[useSharedLink] Error creating link:', error);
        throw error;
      }

      throw new Error('Failed to generate unique short code after max attempts');
    },
    [user, fetchExistingLink]
  );

  /**
   * Create or retrieve an existing shared link for a resource
   */
  const createOrGetSharedLink = useCallback(
    async (
      resourceType: ShareResourceType,
      resourceId: string
    ): Promise<ShareLinkData | null> => {
      if (!user) {
        toast.error('You must be logged in to create a share link');
        return null;
      }

      setLoading(true);

      try {
        // Check for existing link first
        const existingLink = await fetchExistingLink(resourceType, resourceId);
        if (existingLink) {
          return existingLink;
        }

        // Create new link
        return await createNewLink(resourceType, resourceId);
      } catch (error) {
        console.error('[useSharedLink] Error:', error);
        toast.error('Failed to create share link');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, fetchExistingLink, createNewLink]
  );

  /**
   * Create/get share link and copy short URL to clipboard
   */
  const copyShareLink = useCallback(
    async (
      resourceType: ShareResourceType,
      resourceId: string
    ): Promise<boolean> => {
      const linkData = await createOrGetSharedLink(resourceType, resourceId);
      if (!linkData) return false;

      const shortUrl = buildShortUrl(linkData.shortCode);
      const success = await copyToClipboard(shortUrl);

      if (success) {
        toast.success('Share link copied to clipboard');
      } else {
        toast.error('Failed to copy link to clipboard');
      }

      return success;
    },
    [createOrGetSharedLink]
  );

  return {
    loading,
    createOrGetSharedLink,
    copyShareLink,
    getShortUrl: buildShortUrl,
  };
};
