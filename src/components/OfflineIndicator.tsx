import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';

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
        toast.success('Back online! Your data will sync now.', {
          icon: <Wifi className="h-4 w-4" />,
          position: 'top-center',
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Don't show toast notifications on mobile
      if (window.innerWidth >= 640) {
        toast.info('You are offline. Changes will sync when you reconnect.', {
          icon: <WifiOff className="h-4 w-4" />,
          duration: 5000,
          position: 'top-center',
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
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom">
      <Badge 
        variant="destructive" 
        className="px-3 py-2 text-sm font-medium shadow-lg"
      >
        <WifiOff className="h-4 w-4 mr-2" />
        Offline Mode
      </Badge>
    </div>
  );
};
