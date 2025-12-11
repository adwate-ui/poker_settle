/**
 * Share URL utilities - single source of truth for share link patterns
 */

export type ShareResourceType = 'game' | 'player';

export interface ShareLinkData {
  shortCode: string;
  accessToken: string;
  resourceType: ShareResourceType;
  resourceId: string;
}

/**
 * Generate a random short code for share links
 * Uses alphanumeric characters excluding ambiguous ones (0, O, I, l, 1)
 */
export const generateShortCode = (length = 7): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Build the short URL for sharing (user-facing)
 */
export const buildShortUrl = (shortCode: string): string => {
  return `${window.location.origin}/s/${shortCode}`;
};

/**
 * Build the full shared view URL (internal redirect target)
 */
export const buildSharedViewUrl = (
  accessToken: string,
  resourceType: ShareResourceType,
  resourceId: string
): string => {
  return `/shared/${encodeURIComponent(accessToken)}/${resourceType}/${resourceId}`;
};

/**
 * Build base shared view URL (for token validation page)
 */
export const buildBaseSharedUrl = (accessToken: string): string => {
  return `/shared/${encodeURIComponent(accessToken)}`;
};

/**
 * Copy text to clipboard with fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};
