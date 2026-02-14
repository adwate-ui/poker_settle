import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Gamepad2,
  DollarSign,
  Trophy,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Poker Settle",
    description: "Your premium poker game management companion. Track buy-ins, calculate settlements, and keep everyone honest.",
    icon: Sparkles,
    features: [
      "Track multiple players and games",
      "Automatic settlement calculations",
      "Share game results with players",
    ],
  },
  {
    id: "games",
    title: "Create & Manage Games",
    description: "Start a new game with a few taps. Add players, set buy-in amounts, and track everyone's stack throughout the night.",
    icon: Gamepad2,
    features: [
      "Quick game setup with customizable buy-ins",
      "Add or remove players mid-game",
      "Track multiple buy-ins per player",
    ],
  },
  {
    id: "settlements",
    title: "Smart Settlements",
    description: "When the game ends, we calculate the optimal way for everyone to settle up. No more confusing IOUs.",
    icon: DollarSign,
    features: [
      "Automatic profit/loss calculation",
      "Optimized settlement suggestions",
      "Support for manual adjustments",
    ],
  },
  {
    id: "analytics",
    title: "Track Your Performance",
    description: "See who's the shark and who's the fish. Detailed analytics show trends, leaderboards, and insights.",
    icon: Trophy,
    features: [
      "Player leaderboards and rankings",
      "Historical trends and charts",
      "Export data for record keeping",
    ],
  },
];

const STORAGE_KEY = "poker_settle_onboarding_complete";

interface OnboardingWizardProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export const OnboardingWizard = ({ forceShow = false, onComplete }: OnboardingWizardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if onboarding has been completed
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted || forceShow) {
      setIsOpen(true);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
    onComplete?.();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/20">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 pb-12">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Skip
            </Button>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
              <step.icon className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-luxury mb-2">{step.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground max-w-sm">
              {step.description}
            </DialogDescription>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-0 -mt-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-3">
              {step.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-1 rounded-full bg-state-success/20 text-state-success mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-foreground/90">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 space-y-4">
          {/* Progress indicator */}
          <div className="space-y-2">
            <Progress value={progress} className="h-1" />
            <div className="flex justify-center gap-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentStep
                      ? "bg-primary w-4"
                      : index < currentStep
                        ? "bg-primary/50"
                        : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>

          <Button onClick={handleNext} className="w-full gap-2" size="lg">
            {isLastStep ? (
              <>
                Get Started
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Hook to manage onboarding state
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useOnboarding = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasCompletedOnboarding(false);
  };

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHasCompletedOnboarding(true);
  };

  return {
    hasCompletedOnboarding,
    resetOnboarding,
    completeOnboarding,
  };
};

export default OnboardingWizard;
