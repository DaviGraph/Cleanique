import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, ShieldCheckIcon, ClockIcon, ArrowRightIcon } from './Icons';

export const Hero: React.FC = () => {
  return (
    <section className="cq-hero">
      <div className="cq-hero-bg-accent" aria-hidden="true" />
      <div className="cq-container cq-hero-container">
        <div className="cq-hero-badge-wrap">
          <span className="cq-badge cq-badge-teal cq-hero-badge">
            <SparklesIcon size={14} color="#2ECDBF" />
            Premium Hygiene &amp; Facility Care &bull; Delta State, Nigeria
          </span>
        </div>

        <h1 className="cq-hero-title">
          Pristine Living &amp; Workspaces,{' '}
          <span className="cq-hero-title-highlight">Handled with Precision</span>
        </h1>

        <p className="cq-hero-description">
          Professional residential apartment cleaning with transparent flat-rate pricing,
          plus bespoke custom quotes for offices, deep cleaning, and post-construction projects across Delta State.
        </p>

        <div className="cq-hero-actions">
          <Link to="/book" className="cq-btn cq-btn-primary cq-hero-btn" id="hero-book-btn">
            <span>Book a Cleaning</span>
            <ArrowRightIcon size={16} />
          </Link>
          <a href="#services" className="cq-btn cq-btn-outline-white cq-hero-btn" id="hero-services-btn">
            Explore Services
          </a>
        </div>

        {/* Value metrics */}
        <div className="cq-hero-metrics">
          <div className="cq-metric-item">
            <div className="cq-metric-icon">
              <ShieldCheckIcon size={20} color="#2ECDBF" />
            </div>
            <div>
              <div className="cq-metric-value">Vetted Specialists</div>
              <div className="cq-metric-sub">Rigorous background checks & training</div>
            </div>
          </div>

          <div className="cq-metric-divider" aria-hidden="true" />

          <div className="cq-metric-item">
            <div className="cq-metric-icon">
              <SparklesIcon size={20} color="#2ECDBF" />
            </div>
            <div>
              <div className="cq-metric-value">Fixed Upfront Pricing</div>
              <div className="cq-metric-sub">Never any surprise fees or guesswork</div>
            </div>
          </div>

          <div className="cq-metric-divider" aria-hidden="true" />

          <div className="cq-metric-item">
            <div className="cq-metric-icon">
              <ClockIcon size={20} color="#2ECDBF" />
            </div>
            <div>
              <div className="cq-metric-value">Punctual & Reliable</div>
              <div className="cq-metric-sub">Scheduled arrival with prompt execution</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
