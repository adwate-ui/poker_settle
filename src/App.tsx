import * as React from "react";
import { useEffect, useState, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChipProvider } from "@/contexts/ChipContext";
import { useAuth } from "@/hooks/useAuth";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import LuxuryLayout from "@/components/layout/LuxuryLayout";
import { GlobalCardDefs } from "@/components/PokerAssets/GlobalCardDefs";
import RootErrorBoundary from "@/components/RootErrorBoundary";

// Lazy load all pages for optimal bundle size
const Index = lazy(() => import("./pages/Index"));
const NewGame = lazy(() => import("./pages/NewGame"));
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

const queryClient = new QueryClient();

import { Outlet, Navigate } from "react-router-dom";

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
            <Route path="/games" element={<Index />} />
            <Route path="/games/:gameId" element={<GameDetail />} />
            <Route path="/players" element={<Index />} />
            <Route path="/players/:playerId" element={<Index />} />
            <Route path="/hands" element={<Index />} />
            <Route path="/hands/:handId" element={<Index />} />
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
