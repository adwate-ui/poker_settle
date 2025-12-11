import { useParams, useNavigate } from 'react-router-dom';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { GameDetailView } from '@/components/GameDetailView';

const SharedGameDetail = () => {
  const { token: encodedToken, gameId } = useParams<{ token: string; gameId: string }>();
  const navigate = useNavigate();

  if (!encodedToken || !gameId) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground">Invalid share link</p>
        </div>
      </div>
    );
  }

  // Decode the token from the URL
  const token = decodeURIComponent(encodedToken);
  const sharedClient = createSharedClient(token);

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

export default SharedGameDetail;
