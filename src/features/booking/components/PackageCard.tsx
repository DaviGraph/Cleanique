import React from 'react';
import type { Package } from '../types';
import { CheckIcon, SparklesIcon } from './Icons';

interface PackageCardProps {
  packageData: Package;
  onSelect?: (pkg: Package) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ packageData, onSelect }) => {
  const isPopular = Boolean(packageData.popular);

  return (
    <div className={`cq-pkg-card ${isPopular ? 'cq-pkg-card-popular' : ''}`}>
      {isPopular && (
        <div className="cq-pkg-popular-badge">
          <SparklesIcon size={14} color="#102A29" />
          <span>Most Popular</span>
        </div>
      )}

      <div className="cq-pkg-header">
        <span className="cq-pkg-recommended">{packageData.recommendedFor}</span>
        <h3 className="cq-pkg-title">{packageData.name}</h3>
        <p className="cq-pkg-desc">{packageData.description}</p>
      </div>

      <div className="cq-pkg-price-box">
        <div className="cq-pkg-price-label">Transparent Flat Rate</div>
        <div className="cq-pkg-price-amount">
          {packageData.formattedPrice}
        </div>
        <div className="cq-pkg-price-guarantee">Standard residential session</div>
      </div>

      <div className="cq-pkg-divider" />

      <div className="cq-pkg-features-header">Included in this clean:</div>
      <ul className="cq-pkg-features-list">
        {packageData.features.map((feature, idx) => (
          <li key={idx} className="cq-pkg-feature-item">
            <div className="cq-pkg-check">
              <CheckIcon size={14} color="#2ECDBF" />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="cq-pkg-action">
        <button
          type="button"
          onClick={() => onSelect?.(packageData)}
          className={`cq-btn ${isPopular ? 'cq-btn-primary' : 'cq-btn-outline'} cq-pkg-btn`}
          id={`select-package-${packageData.id}`}
        >
          Book {packageData.name}
        </button>
      </div>
    </div>
  );
};
