import * as React from "react";
import { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry in production
    Sentry.withScope((scope) => {
      scope.setExtra("componentStack", errorInfo.componentStack);
      Sentry.captureException(error);
    });

    // Log error details for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error("[RootErrorBoundary] Application error caught:", error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleClearCache = () => {
    try {
      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Reload after clearing cache
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear cache:", e);
      // Fallback: just reload
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
          <Card className="max-w-2xl w-full border-gold-500/30 bg-background/40 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500 via-gold-400 to-transparent opacity-60" />

            <CardHeader className="pt-8 sm:pt-12 pb-6 border-b border-border/50 bg-gold-500/5">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="p-3 sm:p-4 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-gold-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-widest leading-tight text-foreground">
                    Something Went Wrong
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground mt-2">
                    Application Error • Recovery Options Available
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="py-8 sm:py-10 space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  We encountered an unexpected error. Don't worry - your data is safe, and there are several recovery options available.
                </p>

                {this.state.error && (
                  <details className="group cursor-pointer">
                    <summary className="text-xs uppercase tracking-wider text-gold-400/70 hover:text-gold-400 transition-colors select-none list-none flex items-center gap-2">
                      <span className="inline-block transition-transform group-open:rotate-90">▶</span>
                      <span>Technical Details</span>
                    </summary>
                    <div className="mt-3 p-4 bg-muted/30 border border-border/30 rounded-xl font-mono text-[10px] sm:text-xs text-muted-foreground break-words overflow-auto max-h-40">
                      <div className="space-y-2">
                        <div>
                          <span className="text-gold-400/70">Error:</span>{" "}
                          <span className="text-destructive">{this.state.error.toString()}</span>
                        </div>
                        {this.state.errorInfo && (
                          <div>
                            <span className="text-gold-400/70">Component Stack:</span>
                            <pre className="mt-1 text-[10px] whitespace-pre-wrap opacity-70">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}
              </div>

              <div className="border-t border-border/30 pt-6 sm:pt-8">
                <h3 className="text-xs sm:text-sm uppercase tracking-wider text-foreground/70 mb-4 font-semibold">
                  Recovery Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Button
                    onClick={this.handleReload}
                    className="h-12 sm:h-14 bg-gold-500/10 border border-gold-500/20 hover:bg-gold-500/20 text-gold-300 text-xs sm:text-sm uppercase tracking-wider transition-all group"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Reload App
                  </Button>

                  <Button
                    onClick={this.handleGoHome}
                    className="h-12 sm:h-14 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary-foreground text-xs sm:text-sm uppercase tracking-wider transition-all"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>

                  <Button
                    onClick={this.handleClearCache}
                    variant="ghost"
                    className="h-12 sm:h-14 col-span-1 sm:col-span-2 bg-muted/20 border border-border/30 hover:bg-muted/40 text-muted-foreground hover:text-foreground text-xs sm:text-sm uppercase tracking-wider transition-all"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache & Reload
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border/20">
                <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
                  If this problem persists, try clearing your browser cache or contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
