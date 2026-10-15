import React from 'react';
import { useCart } from '../hooks/useCart';
import { ShoppingCartIcon, CheckIcon } from './Icons';

export const FloatingCartButton: React.FC = () => {
  const { totalCount, totalAmount, openCart, isCartOpen, notification } = useCart();

  return (
    <>
      {/* Toast Notification */}
      {notification && (
        <div className="cq-cart-toast" role="status" aria-live="polite">
          <CheckIcon size={16} color="#2ECDBF" />
          <span>{notification}</span>
        </div>
      )}

      {/* Floating Cart Button (only if cart has items and drawer is closed) */}
      {totalCount > 0 && !isCartOpen && (
        <button
          type="button"
          onClick={openCart}
          className="cq-floating-cart-btn"
          aria-label={`View cart with ${totalCount} items`}
          id="floating-cart-btn"
        >
          <div className="cq-floating-cart-icon-wrap">
            <ShoppingCartIcon size={20} color="#102A29" />
            <span className="cq-floating-cart-badge">{totalCount}</span>
          </div>
          <div className="cq-floating-cart-label">
            <span className="cq-floating-cart-text">View Cart</span>
            {totalAmount > 0 && (
              <span className="cq-floating-cart-price">₦{totalAmount.toLocaleString()}</span>
            )}
          </div>
        </button>
      )}
    </>
  );
};
