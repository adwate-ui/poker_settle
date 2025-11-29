/**
 * Cache management utilities for offline gameplay
 */

export interface CacheStats {
  apiCache: number;
  storageCache: number;
  avatarCache: number;
  imageCache: number;
  staticCache: number;
  totalSize: number;
}

/**
 * Get storage estimate and cache sizes
 */
export const getCacheStats = async (): Promise<CacheStats | null> => {
  if (!('caches' in window)) return null;

  try {
    const cacheNames = await caches.keys();
    const stats: CacheStats = {
      apiCache: 0,
      storageCache: 0,
      avatarCache: 0,
      imageCache: 0,
      staticCache: 0,
      totalSize: 0,
    };

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          const size = blob.size;

          if (cacheName.includes('api')) {
            stats.apiCache += size;
          } else if (cacheName.includes('storage')) {
            stats.storageCache += size;
          } else if (cacheName.includes('avatar')) {
            stats.avatarCache += size;
          } else if (cacheName.includes('image')) {
            stats.imageCache += size;
          } else {
            stats.staticCache += size;
          }

          stats.totalSize += size;
        }
      }
    }

    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};

/**
 * Clear all caches
 */
export const clearAllCaches = async (): Promise<boolean> => {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
};

/**
 * Clear specific cache by name pattern
 */
export const clearCacheByPattern = async (pattern: string): Promise<boolean> => {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    const matchingCaches = cacheNames.filter(name => name.includes(pattern));
    await Promise.all(matchingCaches.map(cacheName => caches.delete(cacheName)));
    return true;
  } catch (error) {
    console.error(`Error clearing cache pattern ${pattern}:`, error);
    return false;
  }
};

/**
 * Prefetch critical game data for offline use
 */
export const prefetchGameData = async (userId: string): Promise<void> => {
  if (!('caches' in window)) return;

  try {
    const cache = await caches.open('game-data-cache');
    
    // List of critical endpoints to prefetch
    const endpoints = [
      `/rest/v1/games?user_id=eq.${userId}`,
      `/rest/v1/players?user_id=eq.${userId}`,
      `/rest/v1/game_players?user_id=eq.${userId}`,
    ];

    // Prefetch each endpoint
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response.clone());
        }
      } catch (err) {
        console.warn(`Failed to prefetch ${endpoint}:`, err);
      }
    }
  } catch (error) {
    console.error('Error prefetching game data:', error);
  }
};

/**
 * Check if app is running in offline mode
 */
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

/**
 * Get storage quota information
 */
export const getStorageInfo = async (): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> => {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      percentUsed,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if service worker is active
 */
export const isServiceWorkerActive = (): boolean => {
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
};
