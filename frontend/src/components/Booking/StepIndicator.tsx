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
    <div className="flex items-center justify-start sm:justify-center gap-0">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div
            key={index}
            className="flex items-center gap-0 shrink-0"
          >
            {index > 0 && (
              <div
                className={cn(
                  'h-0.5 w-3 sm:w-10 md:w-16 lg:w-20 transition-colors duration-300',
                  isCompleted ? 'bg-teal-500' : 'bg-gray-200'
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full text-[12px] sm:text-[15px] font-bold transition-all duration-300',
                  isCompleted &&
                    'bg-teal-600 text-white shadow-md shadow-teal-600/20',
                  isCurrent &&
                    'border-2 border-teal-600 bg-white text-teal-600 shadow-md shadow-teal-600/10',
                  !isCompleted &&
                    !isCurrent &&
                    'border-2 border-gray-200 bg-white text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-[12px] whitespace-nowrap font-medium transition-colors duration-200',
                  isCurrent
                    ? 'text-teal-600 font-semibold'
                    : isCompleted
                      ? 'text-teal-500'
                      : 'text-gray-400'
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
