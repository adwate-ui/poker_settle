import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, RefreshCw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameErrorBoundaryProps {
  children: React.ReactNode;
}

interface GameErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class GameErrorBoundary extends React.Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GameErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[GameDetail] Error boundary caught", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto mt-16 px-6">
          <Card className="border-red-500/30 bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent opacity-50" />
            <CardHeader className="pt-10 pb-6 border-b border-white/5 bg-red-500/5">
              <div className="flex items-center gap-5">
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-luxury text-red-100 uppercase tracking-widest leading-tight">Archive Integrity Breach</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-[0.3em] text-red-500/40 font-luxury mt-1">System level exception caught in ledger view</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-10 space-y-8">
              <div className="space-y-4">
                <p className="text-sm font-luxury text-white/50 leading-relaxed uppercase tracking-wider">
                  The protocol encountered a critical anomaly while decrypting game archives. Data persistence remains intact, but visual rendering has been suspended for security.
                </p>
                {this.state.error && (
                  <div className="p-4 bg-white/2 border border-white/5 rounded-xl font-mono text-[11px] text-red-400/60 break-words opacity-50">
                    {this.state.error.toString()}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => window.location.reload()}
                  className="flex-1 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-luxury uppercase tracking-widest text-[10px] transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Attempt Re-Scan
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  className="flex-1 h-12 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-luxury uppercase tracking-widest text-[10px] transition-all"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-2" />
                  Back to Terminal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;
