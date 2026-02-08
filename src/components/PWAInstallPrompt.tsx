import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || dismissed || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom duration-500">
      <Card className="border-gold-500/30 bg-black/60 backdrop-blur-2xl shadow-2xl shadow-gold-900/10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-gold-600 via-gold-400 to-transparent" />
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0 animate-bounce">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold uppercase tracking-widest text-sm mb-1">Install App</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] leading-relaxed">
                  Install for better experience
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/5 rounded-full text-white/20 hover:text-white/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 h-10 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black text-label shadow-lg shadow-gold-900/10 transition-all"
            >
              {installing ? 'Synchronizing...' : 'Authorize Installation'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="h-10 px-6 border border-border/50 bg-white/2 hover:bg-white/5 text-white/30 text-label transition-colors"
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
