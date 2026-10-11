import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="cq-footer">
      <div className="cq-container">
        <div className="cq-footer-grid">
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
              Premium residential, commercial, and post-construction sanitization services.
              Built on transparency, certified hygiene, and reliable execution.
            </p>
          </div>

          <div className="cq-footer-links-col">
            <h4 className="cq-footer-heading">Residential Packages</h4>
            <ul className="cq-footer-links">
              <li><Link to="/book?package=pkg_single_room">Single Room (₦20,000)</Link></li>
              <li><Link to="/book?package=pkg_bedsitter">Bedsitter (₦25,000)</Link></li>
              <li><Link to="/book?package=pkg_self_contained">Self-Contained (₦35,000)</Link></li>
              <li><Link to="/book?package=pkg_two_bedroom">Two-Bedroom (₦50,000)</Link></li>
              <li><Link to="/book?package=pkg_three_bedroom">Three-Bedroom (₦65,000)</Link></li>
            </ul>
          </div>

          <div className="cq-footer-links-col">
            <h4 className="cq-footer-heading">Specialized & Quotes</h4>
            <ul className="cq-footer-links">
              <li><Link to="/book?service=srv_deep_clean">Deep Cleaning</Link></li>
              <li><Link to="/book?service=srv_move_in_out">Move-in / Move-out</Link></li>
              <li><Link to="/book?service=srv_post_construction">Post-Construction</Link></li>
              <li><Link to="/book?service=srv_office">Office & Corporate</Link></li>
              <li><Link to="/book?service=srv_commercial">Commercial Facilities</Link></li>
              <li><Link to="/book?service=srv_dishwashing">Dishwashing (From ₦3,000)</Link></li>
            </ul>
          </div>

          <div className="cq-footer-links-col">
            <h4 className="cq-footer-heading">Operating Hours</h4>
            <p className="cq-footer-text">
              Monday – Saturday: 7:30 AM – 7:00 PM<br />
              Sunday: 9:00 AM – 5:00 PM<br />
              <span className="cq-footer-highlight">Emergency & after-hours available for commercial spaces.</span>
            </p>
          </div>
        </div>

        <div className="cq-footer-bottom">
          <p>© {new Date().getFullYear()} Cleanique. All rights reserved.</p>
          <p className="cq-footer-note">
            Prices displayed are read directly from our service registry. All payment receipts are verified prior to final booking confirmation.
          </p>
        </div>
      </div>
    </footer>
  );
};
