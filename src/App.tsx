import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChipProvider } from "@/contexts/ChipContext";
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useAuth } from "@/hooks/useAuth";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
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

// Mantine theme configuration that syncs with app's dark mode and color system
const mantineTheme = createTheme({
  primaryColor: 'green',
  fontFamily: 'inherit',
  defaultRadius: 'md',
  colors: {
    // Define a custom green palette that will sync with our CSS variables
    green: [
      'var(--mantine-color-green-0)',
      'var(--mantine-color-green-1)',
      'var(--mantine-color-green-2)',
      'var(--mantine-color-green-3)',
      'var(--mantine-color-green-4)',
      'var(--mantine-color-green-5)',
      'var(--mantine-color-green-6)',
      'var(--mantine-color-green-7)',
      'var(--mantine-color-green-8)',
      'var(--mantine-color-green-9)',
    ],
    // Define red palette for negative amounts/losses
    red: [
      'var(--mantine-color-red-0)',
      'var(--mantine-color-red-1)',
      'var(--mantine-color-red-2)',
      'var(--mantine-color-red-3)',
      'var(--mantine-color-red-4)',
      'var(--mantine-color-red-5)',
      'var(--mantine-color-red-6)',
      'var(--mantine-color-red-7)',
      'var(--mantine-color-red-8)',
      'var(--mantine-color-red-9)',
    ],
    // Define semantic profit/loss colors (using standard green/red for light, darker for dark mode)
    profit: [
      '#d3f9d8', // lightest
      '#b2f2bb',
      '#8ce99a',
      '#69db7c',
      '#51cf66',
      '#40c057', // base
      '#37b24d',
      '#2f9e44',
      '#2b8a3e',
      '#247a31', // darkest
    ],
    loss: [
      '#ffe3e3', // lightest
      '#ffc9c9',
      '#ffa8a8',
      '#ff8787',
      '#ff6b6b',
      '#fa5252', // base
      '#f03e3e',
      '#e03131',
      '#c92a2a',
      '#b02525', // darkest
    ],
  },
  other: {
    // Pass through our color variables for custom usage
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    muted: 'hsl(var(--muted))',
    accent: 'hsl(var(--accent))',
  },
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
          <ChipProvider>
            <MantineProvider theme={mantineTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
              <Notifications position="top-right" />
              <OfflineIndicator />
              <PWAInstallPrompt />
              <AppContent />
            </MantineProvider>
          </ChipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
