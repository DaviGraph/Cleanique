import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SparklesIcon } from './Icons';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="cq-navbar">
      <div className="cq-container cq-navbar-inner">
        <Link to="/" className="cq-brand" aria-label="Cleanique Home">
          <div className="cq-brand-icon">
            <SparklesIcon size={22} color="#102A29" />
          </div>
          <div className="cq-brand-text">
            <span className="cq-brand-name">Cleanique</span>
            <span className="cq-brand-tag">HYGIENE & FACILITY CARE</span>
          </div>
        </Link>

        <nav className="cq-nav-links" aria-label="Main Navigation">
          {isHomePage ? (
            <>
              <a href="#packages" className="cq-nav-link">Residential Packages</a>
              <a href="#services" className="cq-nav-link">Specialized & Quotes</a>
              <a href="#standards" className="cq-nav-link">The Cleanique Standard</a>
            </>
          ) : (
            <>
              <Link to="/#packages" className="cq-nav-link">Residential Packages</Link>
              <Link to="/#services" className="cq-nav-link">Specialized & Quotes</Link>
              <Link to="/" className="cq-nav-link">Home Overview</Link>
            </>
          )}
        </nav>

        <div className="cq-nav-actions">
          <Link to="/book" className="cq-btn cq-btn-primary cq-nav-cta">
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
};
