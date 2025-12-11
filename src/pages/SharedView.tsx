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
  const { token: encodedToken } = useParams<{ token: string }>();
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [resourceType, setResourceType] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<string | null>(null);

  // Decode the token from the URL
  const token = encodedToken ? decodeURIComponent(encodedToken) : '';

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValid(false);
        setValidating(false);
        return;
      }

      try {
        const sharedClient = createSharedClient(token);
        
        // Validate token using secure RPC function (avoids direct table access)
        const { data: linkData, error: linkError } = await sharedClient
          .rpc('validate_share_token', { _token: token })
          .maybeSingle();

        if (linkError) {
          console.error('Token validation error:', linkError);
          setIsValid(false);
        } else if (!linkData) {
          console.error('Token not found');
          setIsValid(false);
        } else {
          setResourceType(linkData.resource_type);
          setResourceId(linkData.resource_id);
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
          <TabsList className={`grid w-full ${resourceType === 'player' ? 'grid-cols-2' : 'grid-cols-1'} mb-8`}>
            <TabsTrigger value="games">Games History</TabsTrigger>
            {resourceType === 'player' && (
              <TabsTrigger value="players">Players History</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="games" className="space-y-6">
            <SharedGamesHistory token={token} />
          </TabsContent>

          {resourceType === 'player' && resourceId && (
            <TabsContent value="players" className="space-y-6">
              <SharedPlayersHistory token={token} playerId={resourceId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default SharedView;
