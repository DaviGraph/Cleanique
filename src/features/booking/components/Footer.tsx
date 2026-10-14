import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, MessageCircleIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="cq-footer">
      <div className="cq-container">
        <div className="cq-footer-grid">
          {/* Brand & Mission */}
          <div className="cq-footer-brand-col">
            <div className="cq-brand">
              <div className="cq-brand-icon">
                <SparklesIcon size={20} color="#102A29" />
              </div>
              <div className="cq-brand-text">
                <span className="cq-brand-name cq-brand-name-light">Cleanique</span>
                <span className="cq-brand-tag cq-brand-tag-light">HYGIENE & FACILITY CARE</span>
              </div>
            </div>
            <p className="cq-footer-tagline">
              Professional residential, commercial, and post-construction sanitization services.
              Spotless hygiene, vetted specialists, and dependable execution.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="cq-footer-links-col">
            <h4 className="cq-footer-heading">Quick Links</h4>
            <ul className="cq-footer-links">
              <li><Link to="/">Home</Link></li>
              <li><a href="/#packages">Residential Packages</a></li>
              <li><a href="/#services">Specialized Services</a></li>
              <li><Link to="/book">Book a Clean</Link></li>
            </ul>
          </div>

          {/* Operating Hours & Support */}
          <div className="cq-footer-links-col">
            <h4 className="cq-footer-heading">Hours & Support</h4>
            <p className="cq-footer-text">
              Mon – Sat: 7:30 AM – 7:00 PM<br />
              Sunday: 9:00 AM – 5:00 PM
            </p>
            <div style={{ marginTop: '10px' }}>
              <a
                href="https://wa.me/2349162192102?text=Hello%20Cleanique,%20I%20have%20an%20inquiry%20regarding%20cleaning%20services"
                target="_blank"
                rel="noreferrer"
                className="cq-footer-highlight"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <MessageCircleIcon size={16} color="#25D366" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>

        <div className="cq-footer-bottom">
          <p>© {new Date().getFullYear()} Cleanique Hygiene & Facility Care. All rights reserved.</p>
          <div className="cq-footer-bottom-links">
            <Link
              to="/admin/login"
              style={{ color: 'rgba(245, 249, 248, 0.45)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#2ECDBF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(245, 249, 248, 0.45)')}
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
