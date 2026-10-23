import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircleIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="cq-footer">
      <div className="cq-container">
        <div className="cq-footer-grid">
          {/* Brand & Mission */}
          <div className="cq-footer-brand-col">
            <Link to="/" className="cq-brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/cleanique-logo.png"
                alt="Cleanique Hygiene & Facility Care"
                className="cq-brand-logo-img"
                style={{ width: '44px', height: '44px', borderRadius: '10px' }}
              />
              <div className="cq-brand-text">
                <span className="cq-brand-name cq-brand-name-light">Cleanique</span>
                <span className="cq-brand-tag cq-brand-tag-light">HYGIENE &amp; FACILITY CARE</span>
              </div>
            </Link>
            <p className="cq-footer-tagline">
              Professional residential apartment, commercial office, and post-construction cleaning services in Delta State, Nigeria.
              Spotless hygiene, vetted specialists, and transparent upfront pricing.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="cq-footer-links-col">
            <h4 className="cq-footer-heading">Quick Links</h4>
            <ul className="cq-footer-links">
              <li><Link to="/">Home</Link></li>
              <li><a href="/#packages">Residential Packages</a></li>
              <li><a href="/#services">Specialized Services</a></li>
              <li><a href="/#how-it-works">How It Works</a></li>
              <li><Link to="/book">Book a Cleaning</Link></li>
            </ul>
          </div>

          {/* Operating Hours & Support */}
          <div className="cq-footer-links-col">
            <h4 className="cq-footer-heading">Service Hours &amp; Support</h4>
            <p className="cq-footer-text">
              Delta State, Nigeria<br />
              Mon – Sat: 7:30 AM – 7:00 PM<br />
              Sunday: 9:00 AM – 5:00 PM
            </p>
            <div style={{ marginTop: '12px' }}>
              <a
                href="https://wa.me/2349162192102?text=Hello%20Cleanique,%20I%20have%20an%20inquiry%20regarding%20cleaning%20services"
                target="_blank"
                rel="noreferrer"
                className="cq-footer-highlight"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              >
                <MessageCircleIcon size={16} color="#25D366" />
                <span>WhatsApp: +234 916 219 2102</span>
              </a>
            </div>
          </div>
        </div>

        <div className="cq-footer-bottom">
          <p>© {new Date().getFullYear()} Cleanique Hygiene &amp; Facility Care. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
