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
          <>
            <div className="cq-pkg-grid">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  packageData={pkg}
                  onSelect={onSelectPackage}
                />
              ))}
            </div>

            {/* Dishwashing Add-on Notice */}
            <div className="cq-pkg-notice-banner" style={{ marginTop: '28px', background: '#FFFFFF', border: '1px solid #DCE5E3', borderRadius: '14px', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#102A29', fontSize: '0.98rem' }}>
                  Need Kitchen Dishwashing?
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#516d6a' }}>
                  Dishwashing starts at <strong>₦3,000</strong> (final price depends on the quantity of dishes) and can be added during booking.
                </p>
              </div>
              <span className="cq-badge cq-badge-turquoise">Optional Add-On</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
