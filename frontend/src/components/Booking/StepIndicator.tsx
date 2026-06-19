import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface Step {
  label: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-12',
                  isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent &&
                    'border-2 border-primary bg-background text-primary',
                  !isCompleted &&
                    !isCurrent &&
                    'border-2 border-muted-foreground/30 bg-background text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span
                className={cn(
                  'hidden text-xs sm:block',
                  isCurrent
                    ? 'font-medium text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
