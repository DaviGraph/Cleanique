import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCartIcon, MenuIcon, XIcon, ArrowRightIcon } from './Icons';
import { useCart } from '../hooks/useCart';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { totalCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="cq-navbar">
      <div className="cq-container cq-navbar-inner">
        <Link to="/" className="cq-brand" aria-label="Cleanique Home" onClick={closeMobileMenu}>
          <img
            src="/cleanique-logo.png"
            alt="Cleanique Hygiene & Facility Care"
            className="cq-brand-logo-img"
          />
          <div className="cq-brand-text">
            <span className="cq-brand-name">Cleanique</span>
            <span className="cq-brand-tag">HYGIENE &amp; FACILITY CARE</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="cq-nav-links" aria-label="Main Navigation">
          {isHomePage ? (
            <>
              <a href="#packages" className="cq-nav-link">Residential Packages</a>
              <a href="#services" className="cq-nav-link">Specialized &amp; Quotes</a>
              <a href="#how-it-works" className="cq-nav-link">How It Works</a>
              <a href="#contact" className="cq-nav-link">Contact &amp; WhatsApp</a>
            </>
          ) : (
            <>
              <Link to="/#packages" className="cq-nav-link">Residential Packages</Link>
              <Link to="/#services" className="cq-nav-link">Specialized &amp; Quotes</Link>
              <Link to="/#how-it-works" className="cq-nav-link">How It Works</Link>
              <Link to="/#contact" className="cq-nav-link">Contact &amp; WhatsApp</Link>
            </>
          )}
        </nav>

        {/* Actions: Cart, Book CTA & Mobile Toggle */}
        <div className="cq-nav-actions">
          {/* Cart Icon Button with count badge */}
          <button
            type="button"
            onClick={openCart}
            className="cq-nav-cart-btn"
            aria-label={`Cart with ${totalCount} items`}
            title="View Cart"
            id="nav-cart-btn"
          >
            <ShoppingCartIcon size={20} color="#102A29" />
            <span className="cq-nav-cart-badge">{totalCount}</span>
          </button>

          <Link to="/book" className="cq-btn cq-btn-primary cq-nav-cta" id="nav-book-btn">
            {totalCount > 0 ? `Checkout (${totalCount})` : 'Book a Cleaning'}
          </Link>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="cq-mobile-nav-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <XIcon size={22} color="#102A29" /> : <MenuIcon size={22} color="#102A29" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="cq-mobile-menu" role="dialog" aria-label="Mobile Navigation">
          <nav className="cq-mobile-nav-links">
            {isHomePage ? (
              <>
                <a href="#packages" className="cq-mobile-nav-link" onClick={closeMobileMenu}>
                  Residential Packages
                </a>
                <a href="#services" className="cq-mobile-nav-link" onClick={closeMobileMenu}>
                  Specialized &amp; Commercial Quotes
                </a>
                <a href="#how-it-works" className="cq-mobile-nav-link" onClick={closeMobileMenu}>
                  How Booking Works
                </a>
                <a href="#contact" className="cq-mobile-nav-link" onClick={closeMobileMenu}>
                  Contact &amp; WhatsApp Support
                </a>
              </>
            ) : (
              <>
                <Link to="/#packages" className="cq-mobile-nav-link" onClick={closeMobileMenu}>
                  Residential Packages
                </Link>
                <Link to="/#services" className="cq-mobile-nav-link" onClick={closeMobileMenu}>
                  Specialized &amp; Commercial Quotes
                </Link>
                <Link to="/#how-it-works" className="cq-mobile-nav-link" onClick={closeMobileMenu}>
                  How Booking Works
                </Link>
                <Link to="/#contact" className="cq-mobile-nav-link" onClick={closeMobileMenu}>
                  Contact &amp; WhatsApp Support
                </Link>
              </>
            )}
            <div className="cq-mobile-menu-cta-wrap">
              <Link
                to="/book"
                className="cq-btn cq-btn-primary cq-mobile-menu-cta"
                onClick={closeMobileMenu}
              >
                <span>Book a Cleaning</span>
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
