import React, { useEffect, useState, lazy, Suspense } from "react";
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

// Lazy load all pages for optimal bundle size
const Index = lazy(() => import("./pages/Index"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const SharedView = lazy(() => import("./pages/SharedView"));
const SharedGameDetail = lazy(() => import("./pages/SharedGameDetail"));
const SharedPlayerDetail = lazy(() => import("./pages/SharedPlayerDetail"));
const ShortLinkRedirect = lazy(() => import("./pages/ShortLinkRedirect"));
const UpiPaymentBouncer = lazy(() => import("./pages/UpiPaymentBouncer"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary shadow-[0_0_15px_rgba(212,184,60,0.5)]" />
          <p className="text-sm sm:text-base text-gold-200/60 font-medium tracking-widest uppercase">Initializing Poker Settle...</p>
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
            <p className="text-sm sm:text-base text-gold-200/60 font-medium tracking-widest uppercase">Loading Luxury Experience...</p>
          </div>
        </div>
      }>
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
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ChipProvider>
            <OfflineIndicator />
            <PWAInstallPrompt />
            <Toaster />
            <LuxuryLayout>
              <AppContent />
            </LuxuryLayout>
          </ChipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
