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
    <div className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 via-poker-gold/10 to-primary/10 border border-primary/20">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-poker-gold to-primary bg-clip-text text-transparent">
            Poker Tracker
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
        
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gradient-to-r from-primary/20 via-poker-gold/10 to-primary/20 border border-primary/30">
            <TabsTrigger value="new-game" className="data-[state=active]:bg-gradient-poker data-[state=active]:text-primary-foreground">New Game</TabsTrigger>
            <TabsTrigger value="games-history" className="data-[state=active]:bg-gradient-poker data-[state=active]:text-primary-foreground">Games History</TabsTrigger>
            <TabsTrigger value="players-history" className="data-[state=active]:bg-gradient-poker data-[state=active]:text-primary-foreground">Players History</TabsTrigger>
          </TabsList>
          
          {children}
        </Tabs>
      </div>
    </div>
  );
};

export default TabLayout;
