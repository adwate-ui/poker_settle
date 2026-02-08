import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { UserProfile } from "./UserProfile";
import { cn } from "@/lib/utils";
import { Play, History, Users, Hand } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface TabLayoutProps {
  children: React.ReactNode;
  defaultTab?: string;
}

const TabLayout = ({ children, defaultTab = "new-game" }: TabLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLiveGame = /^\/games\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(location.pathname);

  const currentTab = location.pathname === "/" ? "new-game"
    : location.pathname === "/games" ? "games-history"
      : location.pathname.startsWith("/players") ? "players-history"
        : location.pathname.startsWith("/hands") ? "hands-history"
          : defaultTab;

  const handleTabChange = (value: string) => {
    if (value === "new-game") navigate("/");
    else if (value === "games-history") navigate("/games");
    else if (value === "players-history") navigate("/players");
    else if (value === "hands-history") navigate("/hands");
  };

  if (isLiveGame) {
    return (
      <div className="min-h-screen bg-transparent pt-safe pb-safe">
        {children}

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gold-900/10 dark:border-gold-500/20 pb-safe">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => handleTabChange("new-game")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative group",
                currentTab === "new-game" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {currentTab === "new-game" && (
                <div className="absolute top-0 w-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <Play className={cn("h-5 w-5", currentTab === "new-game" && "drop-shadow-glow")} />
              <span className="text-[10px] font-luxury uppercase tracking-widest">New</span>
            </button>
            <button
              onClick={() => handleTabChange("games-history")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative group",
                currentTab === "games-history" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {currentTab === "games-history" && (
                <div className="absolute top-0 w-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <History className={cn("h-5 w-5", currentTab === "games-history" && "drop-shadow-glow")} />
              <span className="text-[10px] font-luxury uppercase tracking-widest">Games</span>
            </button>
            <button
              onClick={() => handleTabChange("players-history")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative group",
                currentTab === "players-history" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {currentTab === "players-history" && (
                <div className="absolute top-0 w-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <Users className={cn("h-5 w-5", currentTab === "players-history" && "drop-shadow-glow")} />
              <span className="text-[10px] font-luxury uppercase tracking-widest">Players</span>
            </button>
            <button
              onClick={() => handleTabChange("hands-history")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative group",
                currentTab === "hands-history" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {currentTab === "hands-history" && (
                <div className="absolute top-0 w-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <Hand className={cn("h-5 w-5", currentTab === "hands-history" && "drop-shadow-glow")} />
              <span className="text-[10px] font-luxury uppercase tracking-widest">Hands</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 pt-2 pb-8 md:py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-4 md:mb-10">
          <h1 className="text-xl md:text-3xl font-luxury font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary/80 to-primary drop-shadow-sm">
            Poker Tracker
          </h1>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-8 hidden sm:flex">
            <TabsTrigger value="new-game" className="flex-1 sm:flex-none">
              New Game
            </TabsTrigger>
            <TabsTrigger value="games-history" className="flex-1 sm:flex-none">
              Games History
            </TabsTrigger>
            <TabsTrigger value="players-history" className="flex-1 sm:flex-none">
              Players List
            </TabsTrigger>
            <TabsTrigger value="hands-history" className="flex-1 sm:flex-none">
              Hands Tracking
            </TabsTrigger>
          </TabsList>

          <div className="mt-2 pb-24 sm:pb-0">
            {children}
          </div>
        </Tabs>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gold-900/10 dark:border-gold-500/20 pb-safe">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => handleTabChange("new-game")}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-300 relative group",
                currentTab === "new-game" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {currentTab === "new-game" && (
                <div className="absolute top-0 w-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <Play className={cn("h-4 w-4", currentTab === "new-game" && "drop-shadow-glow")} />
              <span className="text-[8px] font-luxury uppercase tracking-wider">New</span>
            </button>
            <button
              onClick={() => handleTabChange("games-history")}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-300 relative group",
                currentTab === "games-history" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {currentTab === "games-history" && (
                <div className="absolute top-0 w-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <History className={cn("h-4 w-4", currentTab === "games-history" && "drop-shadow-glow")} />
              <span className="text-[8px] font-luxury uppercase tracking-wider">Games</span>
            </button>
            <button
              onClick={() => handleTabChange("players-history")}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-300 relative group",
                currentTab === "players-history" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {currentTab === "players-history" && (
                <div className="absolute top-0 w-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <Users className={cn("h-4 w-4", currentTab === "players-history" && "drop-shadow-glow")} />
              <span className="text-[8px] font-luxury uppercase tracking-wider">Players</span>
            </button>
            <button
              onClick={() => handleTabChange("hands-history")}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-300 relative group",
                currentTab === "hands-history" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {currentTab === "hands-history" && (
                <div className="absolute top-0 w-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <Hand className={cn("h-4 w-4", currentTab === "hands-history" && "drop-shadow-glow")} />
              <span className="text-[8px] font-luxury uppercase tracking-wider">Hands</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabLayout;
