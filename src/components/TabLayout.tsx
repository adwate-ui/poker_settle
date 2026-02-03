import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { UserProfile } from "./UserProfile";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-luxury font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-200 to-gold-500 drop-shadow-sm">
            Poker Tracker
          </h1>
          <div className="flex items-center gap-4">
            <UserProfile />
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="new-game" className="flex-1 sm:flex-none">
              <span className="hidden xs:inline">New Game</span>
              <span className="xs:hidden">New</span>
            </TabsTrigger>
            <TabsTrigger value="games-history" className="flex-1 sm:flex-none">
              <span className="hidden xs:inline">Games History</span>
              <span className="xs:hidden">Games</span>
            </TabsTrigger>
            <TabsTrigger value="players-history" className="flex-1 sm:flex-none">
              <span className="hidden xs:inline">Players List</span>
              <span className="xs:hidden">Players</span>
            </TabsTrigger>
            <TabsTrigger value="hands-history" className="flex-1 sm:flex-none">
              <span className="hidden xs:inline">Hands Tracking</span>
              <span className="xs:hidden">Hands</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-2">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default TabLayout;
