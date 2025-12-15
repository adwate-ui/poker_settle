import { useLocation } from "react-router-dom";
import { Tabs } from "@mantine/core";
import TabLayout from "@/components/TabLayout";
import { EmailConfigModal } from "@/components/EmailConfigModal";
import { useEmailConfigCheck } from "@/hooks/useEmailConfigCheck";
import NewGame from "./NewGame";
import GamesHistory from "./GamesHistory";
import GameDetail from "./GameDetail";
import PlayersHistory from "./PlayersHistory";
import PlayerDetail from "./PlayerDetail";
import HandsHistory from "./HandsHistory";
import HandDetail from "./HandDetail";

const Index = () => {
  const location = useLocation();
  const { showEmailConfig, setShowEmailConfig } = useEmailConfigCheck();
  const isGameDetail = location.pathname.startsWith("/games/") && location.pathname !== "/games";
  const isPlayerDetail = location.pathname.startsWith("/players/") && location.pathname !== "/players";
  const isHandDetail = location.pathname.startsWith("/hands/") && location.pathname !== "/hands";

  return (
    <>
      <EmailConfigModal 
        open={showEmailConfig} 
        onClose={() => setShowEmailConfig(false)} 
      />
      <TabLayout>
        <Tabs.Panel value="new-game">
          <NewGame />
        </Tabs.Panel>
        <Tabs.Panel value="games-history">
          {isGameDetail ? <GameDetail /> : <GamesHistory />}
        </Tabs.Panel>
        <Tabs.Panel value="players-history">
          {isPlayerDetail ? <PlayerDetail /> : <PlayersHistory />}
        </Tabs.Panel>
        <Tabs.Panel value="hands-history">
          {isHandDetail ? <HandDetail /> : <HandsHistory />}
        </Tabs.Panel>
      </TabLayout>
    </>
  );
};

export default Index;
