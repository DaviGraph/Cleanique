import React from 'react';
import type { Package } from '../types';
import { CheckIcon, SparklesIcon, ArrowRightIcon } from './Icons';

interface BookingPackageStepProps {
  packages: Package[];
  selectedPackage: Package | null;
  onSelectPackage: (pkg: Package) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const BookingPackageStep: React.FC<BookingPackageStepProps> = ({
  packages,
  selectedPackage,
  onSelectPackage,
  onBack,
  onContinue,
}) => {
  return (
    <div className="cq-step-content">
      <div className="cq-step-header">
        <span className="cq-badge cq-badge-turquoise">Step 2 of 3</span>
        <h2 className="cq-step-title">Select Your Residential Package</h2>
        <p className="cq-step-subtitle">
          Guaranteed flat rates with exact pricing. Choose the package that matches your living space layout.
        </p>
      </div>

      <div className="cq-package-select-grid">
        {packages.map((pkg) => {
          const isSelected = selectedPackage?.id === pkg.id;

          return (
            <div
              key={pkg.id}
              className={`cq-package-select-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectPackage(pkg)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPackage(pkg);
                }
              }}
              id={`package-option-${pkg.id}`}
            >
              {pkg.popular && (
                <div className="cq-pkg-popular-badge">
                  <SparklesIcon size={12} color="#102A29" />
                  <span>Popular</span>
                </div>
              )}

              <div className="cq-pkg-radio-indicator">
                <div className={`cq-radio-dot ${isSelected ? 'is-active' : ''}`} />
              </div>

              <div className="cq-pkg-select-header">
                <span className="cq-pkg-recommended">{pkg.recommendedFor}</span>
                <h3 className="cq-pkg-select-title">{pkg.name}</h3>
                <p className="cq-pkg-select-desc">{pkg.description}</p>
              </div>

              <div className="cq-pkg-select-price-box">
                <span className="cq-price-tag">Fixed Rate</span>
                <span className="cq-price-val">{pkg.formattedPrice}</span>
              </div>

              <ul className="cq-pkg-select-features">
                {pkg.features.map((feat, idx) => (
                  <li key={idx}>
                    <CheckIcon size={14} color="#2ECDBF" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="cq-step-nav-bar">
        <button
          type="button"
          onClick={onBack}
          className="cq-btn cq-btn-outline"
        >
          ← Back to Services
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedPackage}
          className="cq-btn cq-btn-primary"
          id="continue-to-details-btn"
        >
          Continue to Customer Details
          <ArrowRightIcon size={16} />
        </button>
      </div>
    </div>
  );
};
