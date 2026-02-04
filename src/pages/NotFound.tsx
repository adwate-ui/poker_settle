import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Users, Gamepad2, FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-2xl w-full border-border/50 bg-background/40 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-gold-400 to-transparent opacity-60" />

        <CardHeader className="pt-12 sm:pt-16 pb-8 text-center border-b border-border/30 bg-primary/5">
          <div className="flex justify-center mb-6">
            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20">
              <FileQuestion className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
            </div>
          </div>

          <CardTitle className="text-6xl sm:text-8xl font-bold uppercase tracking-wider leading-none text-primary mb-4">
            404
          </CardTitle>

          <CardDescription className="text-base sm:text-lg text-muted-foreground">
            Page Not Found
          </CardDescription>

          <p className="text-sm text-muted-foreground/70 mt-4 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardHeader>

        <CardContent className="py-10 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-foreground/70 text-center font-semibold mb-4">
              Quick Navigation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={() => navigate("/")}
                className="h-14 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary-foreground text-xs uppercase tracking-wider transition-all"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>

              <Button
                onClick={() => navigate("/games")}
                variant="ghost"
                className="h-14 bg-muted/20 border border-border/30 hover:bg-muted/40 text-foreground text-xs uppercase tracking-wider transition-all"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Games
              </Button>

              <Button
                onClick={() => navigate("/players")}
                variant="ghost"
                className="h-14 bg-muted/20 border border-border/30 hover:bg-muted/40 text-foreground text-xs uppercase tracking-wider transition-all"
              >
                <Users className="h-4 w-4 mr-2" />
                Players
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-border/20">
            <p className="text-xs text-muted-foreground/60 text-center font-mono">
              {location.pathname}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
