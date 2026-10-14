import React from 'react';
import { CheckIcon } from './Icons';

interface BookingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const BookingProgress: React.FC<BookingProgressProps> = ({
  currentStep,
  stepLabels,
}) => {
  return (
    <div className="cq-progress-container" aria-label="Booking steps">
      <div className="cq-progress-steps">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div
              key={label}
              className={`cq-progress-step ${isActive ? 'is-active' : ''} ${
                isCompleted ? 'is-completed' : ''
              }`}
            >
              <div className="cq-step-circle">
                {isCompleted ? (
                  <CheckIcon size={14} color="#102A29" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              <span className="cq-step-label">{label}</span>
              {index < stepLabels.length - 1 && <div className="cq-step-connector" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
