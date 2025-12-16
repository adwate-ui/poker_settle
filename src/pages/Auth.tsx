import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, Text, Stack } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ width: '100%', maxWidth: '28rem' }}>
        <Stack gap="md" align="center">
          <Text size="xl" fw={700} ta="center">Welcome to Poker Tracker</Text>
          <Text size="sm" c="dimmed" ta="center">
            Sign in to track your poker games and manage your player statistics
          </Text>
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full bg-gradient-poker text-primary-foreground hover:opacity-90"
          >
            {isSigningIn && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </Stack>
      </Card>
    </div>
  );
};

export default Auth;