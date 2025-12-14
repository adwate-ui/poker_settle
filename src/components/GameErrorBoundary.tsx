import React from "react";
import { Card, Text, Stack } from "@mantine/core";

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
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: 'hsl(var(--destructive))' }}>
            <Stack gap="md">
              <Text size="lg" fw={700}>Unable to load game details</Text>
              <Text c="dimmed">
                Something went wrong while rendering this game. Please refresh the
                page or return to the games list.
              </Text>
            </Stack>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;
