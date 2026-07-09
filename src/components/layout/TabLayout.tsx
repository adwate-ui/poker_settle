import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { UserProfile } from "./UserProfile";
import { cn } from "@/lib/utils";
import { Home, Play, History, Users, Hand, LucideIcon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface TabLayoutProps {
  children: React.ReactNode;
  defaultTab?: string;
}

const NAV_ITEMS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "overview", label: "Home", icon: Home },
  { value: "new-game", label: "New", icon: Play },
  { value: "games-history", label: "Games", icon: History },
  { value: "players-history", label: "Players", icon: Users },
  { value: "hands-history", label: "Hands", icon: Hand },
];

const MobileBottomNav = ({ currentTab, onTabChange }: { currentTab: string; onTabChange: (value: string) => void }) => (
  <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden glass-panel border-t border-primary/20 pb-safe">
    <div className="flex justify-around items-center h-16">
      {NAV_ITEMS.map(({ value, label, icon: Icon }) => {
        const isActive = currentTab === value;
        return (
          <button
            key={value}
            onClick={() => onTabChange(value)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-300 relative group",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isActive && (
              <div className="absolute top-0 w-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
            )}
            <Icon className={cn("h-4 w-4", isActive && "drop-shadow-glow")} />
            <span className="text-tiny font-luxury uppercase tracking-wider">{label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const TabLayout = ({ children, defaultTab = "new-game" }: TabLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLiveGame = /^\/games\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(location.pathname);

  const currentTab = location.pathname === "/" ? "overview"
    : location.pathname === "/new" ? "new-game"
      : location.pathname === "/games" ? "games-history"
        : location.pathname.startsWith("/players") ? "players-history"
          : location.pathname.startsWith("/hands") ? "hands-history"
            : defaultTab;

  const handleTabChange = (value: string) => {
    if (value === "overview") navigate("/");
    else if (value === "new-game") navigate("/new");
    else if (value === "games-history") navigate("/games");
    else if (value === "players-history") navigate("/players");
    else if (value === "hands-history") navigate("/hands");
  };

  if (isLiveGame) {
    return (
      <div className="min-h-screen bg-transparent pb-safe">
        {/* Mobile-only access to theme/profile while in a live game */}
        <div className="flex sm:hidden justify-end items-center gap-2 p-3">
          <ThemeToggle />
          <UserProfile />
        </div>

        {children}

        <MobileBottomNav currentTab={currentTab} onTabChange={handleTabChange} />
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
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">
              Overview
            </TabsTrigger>
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

        <MobileBottomNav currentTab={currentTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default TabLayout;
