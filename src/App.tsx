import * as React from "react";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChipProvider } from "@/contexts/ChipContext";
import { useAuth } from "@/hooks/useAuth";
import { OfflineIndicator } from "@/components/feedback/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/feedback/PWAInstallPrompt";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import LuxuryLayout from "@/components/layout/LuxuryLayout";
import { GlobalCardDefs } from "@/components/poker/PokerAssets/GlobalCardDefs";
import RootErrorBoundary from "@/components/feedback/RootErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
// NewGame moved to Index.tsx
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const SharedLayout = lazy(() => import("./pages/SharedLayout"));
const SharedGameDetail = lazy(() => import("./pages/SharedGameDetail"));
const SharedPlayerDetail = lazy(() => import("./pages/SharedPlayerDetail"));
const ShortLinkRedirect = lazy(() => import("./pages/ShortLinkRedirect"));
const UpiPaymentBouncer = lazy(() => import("./pages/UpiPaymentBouncer"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const GamesList = lazy(() => import("./pages/GamesHistory"));
const PlayersList = lazy(() => import("./pages/PlayersHistory"));
const PlayerDetail = lazy(() => import("./pages/PlayerDetail"));
const HandsList = lazy(() => import("./pages/HandsHistory"));
const HandDetail = lazy(() => import("./pages/HandDetail"));

const queryClient = new QueryClient();

import { Outlet, Navigate } from "react-router-dom";
import TabLayout from "@/components/layout/TabLayout";

const AppLayout = () => (
  <LuxuryLayout>
    <Outlet />
  </LuxuryLayout>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary shadow-[0_0_15px_rgba(212,184,60,0.5)]" />
          <p className="text-sm sm:text-base text-gold-200/60 font-medium tracking-widest uppercase">Starting up...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary shadow-[0_0_15px_rgba(212,184,60,0.5)]" />
            <p className="text-sm sm:text-base text-gold-200/60 font-medium tracking-widest uppercase">Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={user ? <AppLayout /> : <Navigate to="/auth" />}>
            <Route path="/" element={<Index />} />

            <Route path="/games" element={
              <TabLayout defaultTab="games-history">
                <GamesList />
              </TabLayout>
            } />
            <Route path="/games/:gameId" element={<GameDetail />} />

            <Route path="/players" element={
              <TabLayout defaultTab="players-history">
                <PlayersList />
              </TabLayout>
            } />
            <Route path="/players/:playerId" element={
              <TabLayout defaultTab="players-history">
                <PlayerDetail />
              </TabLayout>
            } />

            <Route path="/hands" element={
              <TabLayout defaultTab="hands-history">
                <HandsList />
              </TabLayout>
            } />
            <Route path="/hands/:handId" element={
              <TabLayout defaultTab="hands-history">
                <HandDetail />
              </TabLayout>
            } />

            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Public Routes */}
          <Route path="/s/:shortCode" element={<ShortLinkRedirect />} />
          <Route path="/upi-pay" element={<UpiPaymentBouncer />} />
          <Route path="/shared/:token" element={<SharedLayout />} />
          <Route path="/shared/:token/game/:gameId" element={<SharedGameDetail />} />
          <Route path="/shared/:token/player/:playerId" element={<SharedPlayerDetail />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <RootErrorBoundary>
            <GlobalCardDefs />
            <ChipProvider>
              <OfflineIndicator />
              <PWAInstallPrompt />
              <Toaster />
              <AppContent />
            </ChipProvider>
          </RootErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
