import { memo } from 'react';
import { Button } from '@mantine/core';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface StreetControlsProps {
  stage: 'setup' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  onNext: () => void;
  onBack: () => void;
  canMoveToNext: boolean;
  disabled?: boolean;
}

const StreetControls = memo(({ 
  stage, 
  onNext, 
  onBack, 
  canMoveToNext,
  disabled = false 
}: StreetControlsProps) => {
  const shouldShowNext = stage !== 'setup' && stage !== 'showdown' && stage !== 'river';
  const shouldShowBack = stage !== 'setup' && stage !== 'preflop';

  return (
    <div className="flex gap-2 justify-end">
      {shouldShowBack && (
        <Button
          variant="default"
          onClick={onBack}
          disabled={disabled}
          leftSection={<ArrowLeft className="h-4 w-4" />}
        >
          Back Street
        </Button>
      )}
      {shouldShowNext && (
        <Button
          onClick={onNext}
          disabled={disabled || !canMoveToNext}
          className="bg-gradient-poker text-primary-foreground"
          rightSection={<ArrowRight className="h-4 w-4" />}
        >
          Next Street
        </Button>
      )}
    </div>
  );
});

StreetControls.displayName = 'StreetControls';

export default StreetControls;
