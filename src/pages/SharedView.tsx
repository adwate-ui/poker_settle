import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import SharedGamesHistory from '@/components/SharedGamesHistory';
import SharedPlayersHistory from '@/components/SharedPlayersHistory';

const SharedView = () => {
  const { token } = useParams<{ token: string }>();
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValid(false);
        setValidating(false);
        return;
      }

      try {
        const sharedClient = createSharedClient(token);
        // Try to fetch a single game to validate the token
        const { data, error } = await sharedClient
          .from('games')
          .select('id')
          .limit(1);

        if (error) {
          console.error('Token validation error:', error);
          setIsValid(false);
        } else {
          setIsValid(true);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        setIsValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  if (validating) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!isValid || !token) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Invalid or expired share link. Please contact the owner for a valid link.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Poker Game Stats</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Read-only view</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="games">Games History</TabsTrigger>
            <TabsTrigger value="players">Players History</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-6">
            <SharedGamesHistory token={token} />
          </TabsContent>

          <TabsContent value="players" className="space-y-6">
            <SharedPlayersHistory token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SharedView;
