import React from 'react';
import { ShieldCheckIcon, ClockIcon, SparklesIcon } from './Icons';

export const TrustSection: React.FC = () => {
  return (
    <section id="standards" className="cq-trust-section">
      <div className="cq-container">
        <div className="cq-section-header">
          <span className="cq-badge cq-badge-turquoise">The Cleanique Guarantee</span>
          <h2 className="cq-section-title">Why Discerning Clients Trust Cleanique</h2>
          <p className="cq-section-subtitle">
            We deliver spotless results through uncompromising hygiene protocols, verified pricing,
            and professional cleaning technicians.
          </p>
        </div>

        <div className="cq-trust-grid">
          <div className="cq-trust-card">
            <div className="cq-trust-icon-wrap">
              <ShieldCheckIcon size={28} color="#102A29" />
            </div>
            <h3 className="cq-trust-card-title">Vetted & Trained Cleaners</h3>
            <p className="cq-trust-card-desc">
              Every Cleanique specialist undergoes full identity verification, background screening,
              and professional surface-care protocol training.
            </p>
          </div>

          <div className="cq-trust-card">
            <div className="cq-trust-icon-wrap">
              <SparklesIcon size={28} color="#102A29" />
            </div>
            <h3 className="cq-trust-card-title">Hospital-Grade Sanity</h3>
            <p className="cq-trust-card-desc">
              We exclusively utilize child-safe, pet-friendly disinfectants and micro-filtration equipment
              that neutralize 99.9% of bacteria and allergens.
            </p>
          </div>

          <div className="cq-trust-card">
            <div className="cq-trust-icon-wrap">
              <ClockIcon size={28} color="#102A29" />
            </div>
            <h3 className="cq-trust-card-title">Transparent & Verified</h3>
            <p className="cq-trust-card-desc">
              Prices are published upfront. Every booking is tracked with verified receipts and clear status
              updates before our team arrives.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
