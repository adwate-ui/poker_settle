import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GameDetailView } from '@/components/game/GameDetailView';
import { useAuth } from '@/hooks/useAuth';
import GameDashboard from '@/components/game/GameDashboard';
import { Game } from '@/types/poker';
import { Loader2 } from 'lucide-react';
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
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground">Invalid share link</p>
        </div>
      </div>
    );
  }

  // If user is owner and game is active, render the dashboard
  if (activeGame) {
    return <GameDashboard game={activeGame} onBackToSetup={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <GameDetailView
        gameId={gameId}
        client={sharedClient}
        token={token}
        showOwnerControls={false}
        onBack={() => navigate(`/shared/${encodeURIComponent(token)}`)}
        backLabel="Back to Games History"
      />
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
