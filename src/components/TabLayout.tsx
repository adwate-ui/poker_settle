import { Tabs } from "@mantine/core";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { UserProfile } from "./UserProfile";

interface TabLayoutProps {
  children: React.ReactNode;
  defaultTab?: string;
}

const TabLayout = ({ children, defaultTab = "new-game" }: TabLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname === "/" ? "new-game" 
    : location.pathname.startsWith("/games") ? "games-history"
    : location.pathname.startsWith("/players") ? "players-history"
    : location.pathname.startsWith("/hands") ? "hands-history"
    : defaultTab;

  const handleTabChange = (value: string) => {
    if (value === "new-game") navigate("/");
    else if (value === "games-history") navigate("/games");
    else if (value === "players-history") navigate("/players");
    else if (value === "hands-history") navigate("/hands");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-7xl">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Poker Tracker</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
        
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tabs.List grow>
            <Tabs.Tab value="new-game">
              <span className="hidden xs:inline">New Game</span>
              <span className="xs:hidden">New</span>
            </Tabs.Tab>
            <Tabs.Tab value="games-history">
              <span className="hidden xs:inline">Games</span>
              <span className="xs:hidden">Games</span>
            </Tabs.Tab>
            <Tabs.Tab value="players-history">
              <span className="hidden xs:inline">Players</span>
              <span className="xs:hidden">Players</span>
            </Tabs.Tab>
            <Tabs.Tab value="hands-history">
              <span className="hidden xs:inline">Hands</span>
              <span className="xs:hidden">Hands</span>
            </Tabs.Tab>
          </Tabs.List>
          
          {children}
        </Tabs>
      </div>
    </div>
  );
};

export default TabLayout;
