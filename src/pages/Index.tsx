import { useLocation } from "react-router-dom";
import { TabsContent } from "@/components/ui/tabs";
import TabLayout from "@/components/TabLayout";
import NewGame from "./NewGame";
import GamesHistory from "./GamesHistory";
import GameDetail from "./GameDetail";
import PlayersHistory from "./PlayersHistory";
import PlayerDetail from "./PlayerDetail";
import HandsHistory from "./HandsHistory";
import HandDetail from "./HandDetail";
import Analytics from "./Analytics";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const Index = () => {
  const location = useLocation();
  const isGameDetail = location.pathname.startsWith("/games/") && location.pathname !== "/games";
  const isPlayerDetail = location.pathname.startsWith("/players/") && location.pathname !== "/players";
  const isHandDetail = location.pathname.startsWith("/hands/") && location.pathname !== "/hands";

  return (
    <TabLayout>
      {/* Onboarding wizard for new users */}
      <OnboardingWizard />

      <TabsContent value="new-game" className="mt-0">
        <NewGame />
      </TabsContent>
      <TabsContent value="games-history" className="mt-0">
        {isGameDetail ? <GameDetail /> : <GamesHistory />}
      </TabsContent>
      <TabsContent value="players-history" className="mt-0">
        {isPlayerDetail ? <PlayerDetail /> : <PlayersHistory />}
      </TabsContent>
      <TabsContent value="hands-history" className="mt-0">
        {isHandDetail ? <HandDetail /> : <HandsHistory />}
      </TabsContent>
      <TabsContent value="analytics" className="mt-0">
        <Analytics />
      </TabsContent>
    </TabLayout>
  );
};

export default Index;
