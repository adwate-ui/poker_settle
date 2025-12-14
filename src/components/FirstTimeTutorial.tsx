import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Progress } from '@/components/ui/progress';

interface TutorialStep {
  title: string;
  description: string;
  content: React.ReactNode;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Poker Settle! 🎮',
    description: 'Your all-in-one poker game tracker',
    content: (
      <div className="space-y-4">
        <p>
          Poker Settle helps you track buy-ins, stacks, settlements, and record hands for your home poker games.
        </p>
        <div className="space-y-2">
          <h4 className="font-semibold">Key Features:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li>Track games, players, and settlements</li>
            <li>Record and replay poker hands</li>
            <li>Send email notifications to players</li>
            <li>Automatic payment confirmations</li>
            <li>Multiple anime themes</li>
            <li>Detailed statistics and analytics</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: 'Step 1: Add Players 👥',
    description: 'Create your player database',
    content: (
      <div className="space-y-4">
        <p>Before starting a game, you'll need to add players to your database.</p>
        <div className="space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">To add players:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
              <li>Go to the "Players" tab</li>
              <li>Click the "Add Player" button</li>
              <li>Enter player name, email, and UPI ID (optional)</li>
              <li>Click "Create Player"</li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            💡 Tip: Add email addresses and UPI IDs to enable automatic settlement notifications and payment links.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Step 2: Create a Game 🎲',
    description: 'Set up your poker game',
    content: (
      <div className="space-y-4">
        <p>Once you have players, you can create a new game.</p>
        <div className="space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">To create a game:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
              <li>Go to the "Games" tab</li>
              <li>Click "New Game"</li>
              <li>Set the date and buy-in amount</li>
              <li>Add players to the game</li>
              <li>Click "Create Game"</li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            💡 Tip: You can add blinds, track buy-ins, and record final stacks as the game progresses.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Step 3: Track the Game 📊',
    description: 'Monitor buy-ins and stacks',
    content: (
      <div className="space-y-4">
        <p>During the game, you can track player buy-ins and final stacks.</p>
        <div className="space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">Game tracking features:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
              <li><strong>Add Buy-ins:</strong> Click on a player to add additional buy-ins</li>
              <li><strong>Record Stacks:</strong> Enter final chip counts when the game ends</li>
              <li><strong>View Summary:</strong> See real-time profit/loss for each player</li>
              <li><strong>Calculate Settlements:</strong> Get automatic settlement suggestions</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Step 4: Record Hands 🃏',
    description: 'Keep a detailed hand history',
    content: (
      <div className="space-y-4">
        <p>Record interesting hands to review later and improve your game.</p>
        <div className="space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">To record a hand:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
              <li>Open the game details</li>
              <li>Go to the "Hands" tab</li>
              <li>Click "Record Hand"</li>
              <li>Enter hand details: positions, actions, cards</li>
              <li>Save the hand</li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            💡 Tip: The hand history tab lets you filter hands by position, result, and more to analyze your play.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Step 5: Send Settlements 💳',
    description: 'Notify players about payments',
    content: (
      <div className="space-y-4">
        <p>After the game, send settlement notifications to players via email.</p>
        <div className="space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">Settlement process:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
              <li>Complete the game with all final stacks</li>
              <li>View suggested settlements</li>
              <li>Click "Send Notifications" to email players</li>
              <li>Players receive email with payment instructions</li>
              <li>Track confirmation status</li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            💡 Tip: Configure email settings in your Profile to enable automatic notifications.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Step 6: Configure Settings ⚙️',
    description: 'Personalize your experience',
    content: (
      <div className="space-y-4">
        <p>Visit your Profile to configure email, payment keywords, and themes.</p>
        <div className="space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">Available settings:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
              <li><strong>Email Configuration:</strong> Set up EmailJS for notifications</li>
              <li><strong>Payment Keywords:</strong> Customize auto-confirmation keywords</li>
              <li><strong>Theme Selection:</strong> Choose from 5 anime themes</li>
              <li><strong>Dark Mode:</strong> Toggle dark/light mode</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'You\'re All Set! 🎉',
    description: 'Start tracking your games',
    content: (
      <div className="space-y-4">
        <p className="text-lg">
          You're ready to start using Poker Settle!
        </p>
        <div className="space-y-3">
          <div className="border rounded-lg p-3 bg-primary/5">
            <h4 className="font-semibold mb-2">Quick Tips:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
              <li>Check the Profile page for detailed setup guides</li>
              <li>You can replay this tutorial anytime from your Profile</li>
              <li>See the README.md for more detailed documentation</li>
              <li>All your data is stored securely in your account</li>
            </ul>
          </div>
          <p className="text-center font-semibold text-primary mt-4">
            Happy tracking! 🎮
          </p>
        </div>
      </div>
    ),
  },
];

interface FirstTimeTutorialProps {
  open: boolean;
  onClose: () => void;
}

export const FirstTimeTutorial: React.FC<FirstTimeTutorialProps> = ({ open, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeTutorial } = useUserPreferences();

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    await completeTutorial();
    onClose();
  };

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step.content}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {isLastStep ? (
              <Button onClick={handleComplete} className="min-w-[120px]">
                <Check className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            ) : (
              <Button onClick={handleNext} className="min-w-[120px]">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          <button
            onClick={handleComplete}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
