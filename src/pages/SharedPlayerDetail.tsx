import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SharedProvider, useSharedContext } from '@/contexts/SharedContext';
import PlayerDetail from './PlayerDetail';
import { Loader2, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button'; // Assuming Button is available

const SharedPlayerDetailContent = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { scope, sharedClient, isLoading, isValid } = useSharedContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValid || !scope || scope.type !== 'player') {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {isValid ? "This link does not grant access to player details." : "Invalid or expired share link."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      {/* Ensure we can go back to the main shared view (Games List) */}
      {/* Actually SharedLayout has tabs. If we are here, we might be separate. 
           But if we want to mimic the tabs behavior or navigation, we can add a back button.
       */}
      <div className="max-w-6xl mx-auto mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/shared/${encodeURIComponent(token!)}`)}
        >
          Back to Overview
        </Button>
      </div>

      <PlayerDetail
        playerId={scope.resourceId}
        userId={scope.ownerId}
        client={sharedClient}
        readOnly={true}
      />
    </div>
  );
};

const SharedPlayerDetail = () => {
  return (
    <SharedProvider>
      <SharedPlayerDetailContent />
    </SharedProvider>
  );
};

export default SharedPlayerDetail;
