import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MantineProvider, createTheme } from '@mantine/core';
import { useAuth } from "@/hooks/useAuth";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { TutorialManager } from "@/components/TutorialManager";
import Index from "./pages/Index";
import GameDetail from "./pages/GameDetail";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import SharedView from "./pages/SharedView";
import SharedGameDetail from "./pages/SharedGameDetail";
import SharedPlayerDetail from "./pages/SharedPlayerDetail";
import ShortLinkRedirect from "./pages/ShortLinkRedirect";
import UpiPaymentBouncer from "./pages/UpiPaymentBouncer";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

// Mantine theme configuration that syncs with app's dark mode
const mantineTheme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'inherit',
  defaultRadius: 'md',
});

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <TutorialManager />
      <Routes>
        <Route path="/" element={user ? <Index /> : <Auth />} />
        <Route path="/games" element={user ? <Index /> : <Auth />} />
        <Route path="/games/:gameId" element={user ? <Index /> : <Auth />} />
        <Route path="/players" element={user ? <Index /> : <Auth />} />
        <Route path="/players/:playerId" element={user ? <Index /> : <Auth />} />
        <Route path="/hands" element={user ? <Index /> : <Auth />} />
        <Route path="/hands/:handId" element={user ? <Index /> : <Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={user ? <Profile /> : <Auth />} />
        <Route path="/s/:shortCode" element={<ShortLinkRedirect />} />
        <Route path="/upi-pay" element={<UpiPaymentBouncer />} />
        <Route path="/shared/:token" element={<SharedView />} />
        <Route path="/shared/:token/game/:gameId" element={<SharedGameDetail />} />
        <Route path="/shared/:token/player/:playerId" element={<SharedPlayerDetail />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  // Track dark mode for Mantine
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <MantineProvider theme={mantineTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <PWAInstallPrompt />
              <AppContent />
            </TooltipProvider>
          </MantineProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
