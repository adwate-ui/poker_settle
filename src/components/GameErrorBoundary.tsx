import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="max-w-6xl mx-auto mt-8">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Unable to load game details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Something went wrong while rendering this game. Please refresh the
                page or return to the games list.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;
