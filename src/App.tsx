import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import GameDetail from "./pages/GameDetail";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import SharedView from "./pages/SharedView";
import SharedGameDetail from "./pages/SharedGameDetail";
import SharedPlayerDetail from "./pages/SharedPlayerDetail";
import ShortLinkRedirect from "./pages/ShortLinkRedirect";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

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
        <Route path="/shared/:token" element={<SharedView />} />
        <Route path="/shared/:token/game/:gameId" element={<SharedGameDetail />} />
        <Route path="/shared/:token/player/:playerId" element={<SharedPlayerDetail />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
