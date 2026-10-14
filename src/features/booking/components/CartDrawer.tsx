import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  ShoppingCartIcon,
  XIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from './Icons';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCount,
    totalAmount,
    depositAmount,
  } = useCart();

  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/book');
  };

  return (
    <div className="cq-cart-overlay" onClick={closeCart}>
      <aside
        className="cq-cart-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Shopping Cart Drawer"
      >
        {/* Drawer Header */}
        <div className="cq-cart-header">
          <div className="cq-cart-header-title">
            <ShoppingCartIcon size={22} color="#2ECDBF" />
            <h2 className="cq-cart-heading">Your Cleaning Cart</h2>
            <span className="cq-cart-count-badge">{totalCount}</span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="cq-cart-close-btn"
            aria-label="Close cart drawer"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="cq-cart-body">
          {items.length === 0 ? (
            <div className="cq-cart-empty">
              <div className="cq-cart-empty-icon">
                <ShoppingCartIcon size={48} color="#888" />
              </div>
              <h3 className="cq-cart-empty-title">Your cart is empty</h3>
              <p className="cq-cart-empty-desc">
                Choose residential cleaning packages to build your customized order.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate('/book');
                }}
                className="cq-btn cq-btn-primary cq-cart-browse-btn"
              >
                Browse Packages & Rates
              </button>
            </div>
          ) : (
            <div className="cq-cart-items-list">
              {items.map((item) => (
                <div key={item.id} className="cq-cart-item-card">
                  <div className="cq-cart-item-header">
                    <div>
                      <span className="cq-badge cq-badge-turquoise" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {item.category}
                      </span>
                      <h4 className="cq-cart-item-name">{item.name}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="cq-cart-item-remove-btn"
                      title="Remove item"
                      aria-label={`Remove ${item.name}`}
                    >
                      <TrashIcon size={15} color="#e53935" />
                    </button>
                  </div>

                  <div className="cq-cart-item-footer">
                    <div className="cq-cart-item-price">
                      <span className="cq-cart-price-val">
                        ₦{((item.price || 0) * item.quantity).toLocaleString()}
                        {item.quantity > 1 && (
                          <span className="cq-cart-unit-price">
                            {' '}(₦{(item.price || 0).toLocaleString()} each)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="cq-cart-qty-controls">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="cq-cart-qty-btn"
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon size={12} />
                      </button>
                      <span className="cq-cart-qty-val">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="cq-cart-qty-btn"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="cq-cart-footer">
            <div className="cq-cart-totals">
              {totalAmount > 0 && (
                <>
                  <div className="cq-cart-total-row">
                    <span>Subtotal</span>
                    <span className="cq-cart-total-amt">₦{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="cq-cart-total-row cq-cart-deposit-row">
                    <span>50% Deposit Due at Booking</span>
                    <span className="cq-cart-deposit-amt">₦{depositAmount.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <div className="cq-cart-guarantee">
              <ShieldCheckIcon size={14} color="#2ECDBF" />
              <span>Zero upfront payment until you review & confirm booking</span>
            </div>

            <div className="cq-cart-actions">
              <button
                type="button"
                onClick={handleCheckout}
                className="cq-btn cq-btn-primary cq-cart-checkout-btn"
                id="cart-proceed-checkout-btn"
              >
                <span>Proceed to Checkout</span>
                <ArrowRightIcon size={16} />
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="cq-cart-clear-btn"
              >
                Empty Cart
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
