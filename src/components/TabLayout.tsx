import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Poker Tracker</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
        
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="new-game" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden xs:inline">New Game</span>
              <span className="xs:hidden">New</span>
            </TabsTrigger>
            <TabsTrigger value="games-history" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden xs:inline">Games</span>
              <span className="xs:hidden">Games</span>
            </TabsTrigger>
            <TabsTrigger value="players-history" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden xs:inline">Players</span>
              <span className="xs:hidden">Players</span>
            </TabsTrigger>
            <TabsTrigger value="hands-history" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden xs:inline">Hands</span>
              <span className="xs:hidden">Hands</span>
            </TabsTrigger>
          </TabsList>
          
          {children}
        </Tabs>
      </div>
    </div>
  );
};

export default TabLayout;
