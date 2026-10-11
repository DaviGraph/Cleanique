import React from 'react';
import type { Package } from '../types';
import { PackageCard } from './PackageCard';

interface PackagesSectionProps {
  packages: Package[];
  isLoading: boolean;
  onSelectPackage: (pkg: Package) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  packages,
  isLoading,
  onSelectPackage,
}) => {
  return (
    <section id="packages" className="cq-pkg-section">
      <div className="cq-container">
        <div className="cq-section-header">
          <span className="cq-badge cq-badge-turquoise">Upfront Flat Rates</span>
          <h2 className="cq-section-title">Residential Cleaning Packages</h2>
          <p className="cq-section-subtitle">
            Transparent pricing without surprise surcharges. Choose your space type and let Cleanique’s vetted
            specialists restore spotless hygiene.
          </p>
        </div>

        {isLoading ? (
          <div className="cq-loading-state">
            <div className="cq-spinner" />
            <p>Loading package rates from registry...</p>
          </div>
        ) : (
          <div className="cq-pkg-grid">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                packageData={pkg}
                onSelect={onSelectPackage}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
