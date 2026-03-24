import React from 'react';

interface Step {
  label: string;
  value: number;
}

interface SemanticStepsProps {
  steps: Step[];
  value: number;
  onChange: (value: number) => void;
}

export const SemanticSteps: React.FC<SemanticStepsProps> = ({ steps, value, onChange }) => {
  // Find the closest step to the current value
  const closestStepIndex = steps.reduce((prev, curr, index) => {
    return Math.abs(curr.value - value) < Math.abs(steps[prev].value - value) ? index : prev;
  }, 0);

  return (
    <div className="flex w-full bg-stone-100 dark:bg-stone-900 rounded-sm p-1 border border-stone-200 dark:border-stone-800">
      {steps.map((step, index) => {
        const isActive = index === closestStepIndex;
        return (
          <button
            key={step.label}
            onClick={() => onChange(step.value)}
            className={`flex-1 py-2 px-2 text-[9px] uppercase tracking-widest font-black transition-all rounded-sm ${
              isActive 
                ? 'bg-white dark:bg-stone-800 text-primary dark:text-white shadow-sm' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
            }`}
          >
            {step.label}
          </button>
        );
      })}
    </div>
  );
};
