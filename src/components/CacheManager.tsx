import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Trash2, RefreshCw, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCacheStats,
  clearAllCaches,
  getStorageInfo,
  formatBytes,
  isServiceWorkerActive,
  CacheStats,
} from '@/utils/cacheManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const CacheManager = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number; percentUsed: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [stats, storage] = await Promise.all([
        getCacheStats(),
        getStorageInfo(),
      ]);
      setCacheStats(stats);
      setStorageInfo(storage);
    } catch (error) {
      console.error('Error loading cache stats:', error);
      toast.error('Failed to load cache statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const success = await clearAllCaches();
      if (success) {
        toast.success('Cache cleared successfully');
        await loadStats();
        // Reload the page to ensure fresh data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  const swActive = isServiceWorkerActive();

  if (!swActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Storage
          </CardTitle>
          <CardDescription>Service worker not active</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The app needs to be installed or the service worker activated to enable offline features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Offline Storage
            </CardTitle>
            <CardDescription>Manage cached data and storage</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage */}
        {storageInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Total Storage Used
              </span>
              <span className="font-medium">
                {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
              </span>
            </div>
            <Progress value={storageInfo.percentUsed} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {storageInfo.percentUsed.toFixed(1)}% of available storage
            </p>
          </div>
        )}

        {/* Cache Breakdown */}
        {cacheStats && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Cache Breakdown</h4>
            <div className="space-y-2">
              <CacheItem label="API Responses" size={cacheStats.apiCache} />
              <CacheItem label="Images & Assets" size={cacheStats.storageCache} />
              <CacheItem label="Avatars" size={cacheStats.avatarCache} />
              <CacheItem label="Other Images" size={cacheStats.imageCache} />
              <CacheItem label="Static Files" size={cacheStats.staticCache} />
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Cache</span>
                <Badge variant="secondary">{formatBytes(cacheStats.totalSize)}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Clear Cache */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={clearing || !cacheStats || cacheStats.totalSize === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all cached data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all offline data. The app will reload and fetch fresh data from the server.
                You'll need an internet connection after clearing the cache.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearCache} className="bg-destructive text-destructive-foreground">
                Clear Cache
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-muted-foreground text-center">
          Cached data allows the app to work offline and load faster
        </p>
      </CardContent>
    </Card>
  );
};

interface CacheItemProps {
  label: string;
  size: number;
}

const CacheItem = ({ label, size }: CacheItemProps) => {
  if (size === 0) return null;
  
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{formatBytes(size)}</span>
    </div>
  );
};
