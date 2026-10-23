import React from 'react';
import { SparklesIcon, CalendarIcon, ShieldCheckIcon, ArrowRightIcon } from './Icons';
import { Link } from 'react-router-dom';

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="cq-how-it-works-section">
      <div className="cq-container">
        <div className="cq-section-header">
          <span className="cq-badge cq-badge-turquoise">Simple &amp; Transparent</span>
          <h2 className="cq-section-title">How Booking Works</h2>
          <p className="cq-section-subtitle">
            Booking professional hygiene care with Cleanique is quick, transparent, and hassle-free.
          </p>
        </div>

        <div className="cq-steps-grid">
          {/* Step 1 */}
          <div className="cq-step-card">
            <div className="cq-step-number">01</div>
            <div className="cq-step-icon-wrap">
              <SparklesIcon size={24} color="#2ECDBF" />
            </div>
            <h3 className="cq-step-card-title">Select Your Clean</h3>
            <p className="cq-step-card-desc">
              Choose your residential apartment package with fixed, transparent pricing, or request a custom quote for office, deep cleaning, or post-construction needs.
            </p>
          </div>

          {/* Step 2 */}
          <div className="cq-step-card">
            <div className="cq-step-number">02</div>
            <div className="cq-step-icon-wrap">
              <CalendarIcon size={24} color="#2ECDBF" />
            </div>
            <h3 className="cq-step-card-title">Schedule &amp; Location</h3>
            <p className="cq-step-card-desc">
              Select your preferred cleaning date, arrival window, and enter your Delta State address with any special access or parking instructions.
            </p>
          </div>

          {/* Step 3 */}
          <div className="cq-step-card">
            <div className="cq-step-number">03</div>
            <div className="cq-step-icon-wrap">
              <ShieldCheckIcon size={24} color="#2ECDBF" />
            </div>
            <h3 className="cq-step-card-title">Secure &amp; Verified</h3>
            <p className="cq-step-card-desc">
              Transfer your 50% initial deposit to our official PalmPay account, upload your receipt, and our vetted specialists arrive promptly on time.
            </p>
          </div>
        </div>

        <div className="cq-how-it-works-cta" style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/book" className="cq-btn cq-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px' }}>
            <span>Book a Cleaning Now</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
