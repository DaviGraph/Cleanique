import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SparklesIcon, ShoppingCartIcon } from './Icons';
import { useCart } from '../context/CartContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { totalCount, openCart } = useCart();

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
              <a href="#contact" className="cq-nav-link">Contact Us</a>
            </>
          ) : (
            <>
              <Link to="/#packages" className="cq-nav-link">Residential Packages</Link>
              <Link to="/#services" className="cq-nav-link">Specialized & Quotes</Link>
              <Link to="/#contact" className="cq-nav-link">Contact Us</Link>
            </>
          )}
        </nav>

        <div className="cq-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Cart Icon Button */}
          <button
            type="button"
            onClick={openCart}
            className="cq-nav-cart-btn"
            aria-label={`Cart with ${totalCount} items`}
            title="View Cart"
            id="nav-cart-btn"
          >
            <ShoppingCartIcon size={20} color="#F5F9F8" />
            {totalCount > 0 && (
              <span className="cq-nav-cart-badge">{totalCount}</span>
            )}
          </button>

          <Link to="/book" className="cq-btn cq-btn-primary cq-nav-cta">
            {totalCount > 0 ? `Checkout (${totalCount})` : 'Book Now'}
          </Link>
        </div>
      </div>
    </header>
  );
};
