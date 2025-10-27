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
    : defaultTab;

  const handleTabChange = (value: string) => {
    if (value === "new-game") navigate("/");
    else if (value === "games-history") navigate("/games");
    else if (value === "players-history") navigate("/players");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Poker Tracker</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
        
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="new-game">New Game</TabsTrigger>
            <TabsTrigger value="games-history">Games History</TabsTrigger>
            <TabsTrigger value="players-history">Players History</TabsTrigger>
          </TabsList>
          
          {children}
        </Tabs>
      </div>
    </div>
  );
};

export default TabLayout;
