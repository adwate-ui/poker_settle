import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GameDetailView } from '@/components/game/GameDetailView';
import { useAuth } from '@/hooks/useAuth';
import GameDashboard from '@/components/game/GameDashboard';
import { Game } from '@/types/poker';
import { Loader2, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SharedProvider, useSharedContext } from '@/contexts/SharedContext';

const SharedGameDetailContent = () => {
  const { token, gameId } = useParams<{ token: string; gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sharedClient, isValid, isLoading } = useSharedContext();
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(true);

  // Check if current user is the owner of this game and it's active
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (!user || !gameId) {
        setCheckingOwner(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("games")
          .select(`
            *,
            game_players (
              *,
              player:players (*)
            )
          `)
          .eq("id", gameId)
          .eq("user_id", user.id)
          .single();

        if (!error && data && !data.is_complete) {
          setActiveGame(data as Game);
        }
      } catch (error) {
        console.error("Error checking owner status:", error);
      } finally {
        setCheckingOwner(false);
      }
    };

    checkOwnerStatus();
  }, [user, gameId]);

  if (isLoading || checkingOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !gameId || !isValid) {
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

  // If user is owner and game is active, render the dashboard
  if (activeGame) {
    return <GameDashboard game={activeGame} onBackToSetup={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto p-4 sm:p-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold font-luxury">Poker Stats</h1>
          <div className="flex items-center gap-2 text-label text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-primary font-bold">Shared View</span>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-8 space-y-6">
        <GameDetailView
          gameId={gameId}
          client={sharedClient}
          token={token}
          showOwnerControls={false}
          onBack={() => navigate(`/shared/${encodeURIComponent(token)}`)}
          backLabel="Back to Games History"
          publicOnly={true}
        />
      </div>
    </div>
  );
};

const SharedGameDetail = () => {
  return (
    <SharedProvider>
      <SharedGameDetailContent />
    </SharedProvider>
  );
};

export default SharedGameDetail;
