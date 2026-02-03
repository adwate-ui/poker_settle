import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // Tailwind's sm breakpoint
    };

    checkMobile();

    const handleOnline = () => {
      setIsOnline(true);
      // Don't show toast notifications on mobile
      if (window.innerWidth >= 640) {
        toast.success('Sequence Synchronized', {
          description: 'Archives are back online. All protocol changes have been persisted.',
          icon: <Wifi className="h-4 w-4 text-green-500" />,
          duration: 4000,
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Don't show toast notifications on mobile
      if (window.innerWidth >= 640) {
        toast.info('Protocol Interrupted', {
          description: 'You are currently in offline mode. Local archives will sync upon restoration.',
          icon: <WifiOff className="h-4 w-4 text-gold-500" />,
          duration: 6000,
        });
      }
    };

    window.addEventListener('resize', checkMobile);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency array - only run once on mount

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom duration-500">
      <Badge
        className="bg-red-500/10 border-red-500/30 text-red-500 shadow-xl shadow-red-900/10 px-4 py-2 h-auto flex items-center gap-3 backdrop-blur-xl rounded-full"
      >
        <div className="relative">
          <WifiOff className="h-4 w-4" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75" />
        </div>
        <span className="font-luxury uppercase tracking-[0.2em] text-[10px] font-bold">Offline Protocol Active</span>
      </Badge>
    </div>
  );
};
