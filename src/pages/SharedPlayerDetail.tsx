import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SharedProvider, useSharedContext } from '@/contexts/SharedContext';
import PlayerDetail from './PlayerDetail';
import { Loader2, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto p-4 sm:p-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold font-luxury">PokerSettle</h1>
          <div className="flex items-center gap-2 text-label text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-primary font-bold">Shared View</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8">
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
