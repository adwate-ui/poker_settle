import { useLocation } from "react-router-dom";
import TabLayout from "@/components/TabLayout";
import NewGame from "./NewGame";
import GamesHistory from "./GamesHistory";
import GameDetail from "./GameDetail";
import PlayersHistory from "./PlayersHistory";
import PlayerDetail from "./PlayerDetail";
import HandsHistory from "./HandsHistory";
import ChatBot from "@/components/ChatBot";
import { TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const location = useLocation();
  const isGameDetail = location.pathname.startsWith("/games/") && location.pathname !== "/games";
  const isPlayerDetail = location.pathname.startsWith("/players/") && location.pathname !== "/players";

  return (
    <TabLayout>
      <TabsContent value="new-game">
        <NewGame />
      </TabsContent>
      <TabsContent value="games-history">
        {isGameDetail ? <GameDetail /> : <GamesHistory />}
      </TabsContent>
      <TabsContent value="players-history">
        {isPlayerDetail ? <PlayerDetail /> : <PlayersHistory />}
      </TabsContent>
      <TabsContent value="hands-history">
        <HandsHistory />
      </TabsContent>
      <ChatBot />
    </TabLayout>
  );
};

export default Index;
