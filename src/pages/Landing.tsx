import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Coins, Wallet, Calculator, Hand } from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "Track buy-ins & stacks",
    description: "Log every buy-in and final stack as the game happens, from any device at the table.",
  },
  {
    icon: Calculator,
    title: "Auto-calculate settlements",
    description: "The moment a game ends, know exactly who pays whom — no spreadsheets, no arguments.",
  },
  {
    icon: Hand,
    title: "Record & analyze hands",
    description: "Track hand histories and player performance across every session you host.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />

      <div className="relative w-full max-w-3xl space-y-10 py-12">
        <div className="text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-2xl">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-luxury tracking-tight text-foreground">
              PokerSettle
            </h1>
            <p className="text-label tracking-[0.3em] text-muted-foreground">
              Game Management &amp; Settlements
            </p>
          </div>
          <p className="max-w-xl mx-auto text-muted-foreground text-base sm:text-lg">
            Run your home poker game like a private club — track every buy-in, settle up automatically, and keep a record worth looking back on.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="h-12 px-8 font-luxury shadow-lg shadow-primary/10">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="glass-panel rounded-xl p-5 space-y-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-luxury text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 text-center w-full pointer-events-none">
        <p className="text-label tracking-[0.5em] text-muted-foreground">Secure Game Management</p>
      </div>
    </div>
  );
};

export default Landing;
