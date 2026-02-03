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
              <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 mt-0.5">
                <Smartphone className="h-5 w-5 text-gold-500" />
              </div>
              <div className="space-y-1">
                <h4 className="font-luxury text-sm font-bold text-gold-100 uppercase tracking-widest leading-none">Luxury Suite Key</h4>
                <p className="text-[10px] font-luxury text-gold-500/40 uppercase tracking-[0.2em] leading-relaxed">
                  Install for instant access and premium offline experience.
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
              className="flex-1 h-10 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-luxury uppercase tracking-widest text-[10px] shadow-lg shadow-gold-900/10 transition-all"
            >
              {installing ? 'Synchronizing...' : 'Authorize Installation'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="h-10 px-6 border border-white/5 bg-white/2 hover:bg-white/5 text-white/30 font-luxury uppercase tracking-widest text-[10px] transition-colors"
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
