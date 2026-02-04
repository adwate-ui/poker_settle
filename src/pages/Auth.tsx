import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Gamepad2, Coins } from "lucide-react";

const Auth = () => {
  const { signInWithGoogle, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-gold-500" />
          <div className="absolute inset-0 blur-xl bg-gold-500/20 rounded-full animate-pulse" />
        </div>
        <p className="text-label tracking-[0.3em] text-gold-200/40 animate-pulse">Authenticating Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/5 blur-[120px] rounded-full" />

      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

        <CardHeader className="pt-12 pb-8 text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 border border-gold-500/20 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="relative flex flex-col items-center">
              <Coins className="h-10 w-10 text-gold-400" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-4xl font-luxury tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-gold-100 to-gold-500">
              Noble Ledger
            </CardTitle>
            <CardDescription className="text-label tracking-[0.4em] text-gold-500/40">
              The Sovereign Poker Suite
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-10 pb-12 space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
              Please sign in to access your games and performance analytics.
            </p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full h-14 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-luxury tracking-[0.2em] uppercase text-xs shadow-[0_10px_30px_rgba(212,184,60,0.2)] hover:shadow-[0_15px_40px_rgba(212,184,60,0.3)] active:scale-95 transition-all duration-300 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-3">
              {isSigningIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Negotiating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>Enter the Vault</span>
                </>
              )}
            </div>
          </Button>

          <div className="pt-4 flex items-center justify-center gap-6 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default">
            <div className="flex items-center gap-2 group/icon">
              <Gamepad2 className="h-4 w-4 group-hover/icon:text-gold-500 transition-colors" />
              <span className="text-label hidden sm:inline">Fair Play</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-2 group/icon">
              <ShieldCheck className="h-4 w-4 group-hover/icon:text-gold-500 transition-colors" />
              <span className="text-label hidden sm:inline">Secure Node</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-8 text-center w-full pointer-events-none">
        <p className="text-label tracking-[0.5em] text-white/10">Reserved for Elite Strategists</p>
      </div>
    </div>
  );
};

export default Auth;