import React from 'react';
import { SparklesIcon } from './Icons';

export const Navbar: React.FC = () => {
  return (
    <header className="cq-navbar">
      <div className="cq-container cq-navbar-inner">
        <a href="#" className="cq-brand" aria-label="Cleanique Home">
          <div className="cq-brand-icon">
            <SparklesIcon size={22} color="#102A29" />
          </div>
          <div className="cq-brand-text">
            <span className="cq-brand-name">Cleanique</span>
            <span className="cq-brand-tag">HYGIENE & FACILITY CARE</span>
          </div>
        </a>

        <nav className="cq-nav-links" aria-label="Main Navigation">
          <a href="#packages" className="cq-nav-link">Residential Packages</a>
          <a href="#services" className="cq-nav-link">Specialized & Quotes</a>
          <a href="#standards" className="cq-nav-link">The Cleanique Standard</a>
        </nav>

        <div className="cq-nav-actions">
          <a href="#packages" className="cq-btn cq-btn-primary cq-nav-cta">
            View Packages
          </a>
        </div>
      </div>
    </header>
  );
};
