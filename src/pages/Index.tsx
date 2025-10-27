import { useLocation } from "react-router-dom";
import TabLayout from "@/components/TabLayout";
import NewGame from "./NewGame";
import GamesHistory from "./GamesHistory";
import GameDetail from "./GameDetail";
import PlayersHistory from "./PlayersHistory";
import ChatBot from "@/components/ChatBot";
import { TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const location = useLocation();
  const isGameDetail = location.pathname.startsWith("/games/");

  return (
    <TabLayout>
      <TabsContent value="new-game">
        <NewGame />
      </TabsContent>
      <TabsContent value="games-history">
        {isGameDetail ? <GameDetail /> : <GamesHistory />}
      </TabsContent>
      <TabsContent value="players-history">
        <PlayersHistory />
      </TabsContent>
      <ChatBot />
    </TabLayout>
  );
};

export default Index;
