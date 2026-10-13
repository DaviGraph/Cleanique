import React from 'react';
import type { Package } from '../types';
import { CheckIcon, SparklesIcon, ShoppingCartIcon } from './Icons';
import { useCart } from '../context/CartContext';

interface PackageCardProps {
  packageData: Package;
  onSelect?: (pkg: Package) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ packageData, onSelect }) => {
  const isPopular = Boolean(packageData.popular);
  const { items, addToCart, openCart } = useCart();

  const cartItem = items.find((i) => i.itemId === packageData.id);

  const handleAddToCart = () => {
    addToCart({
      itemId: packageData.id,
      name: packageData.name,
      category: 'Residential',
      price: packageData.price,
      formattedPrice: packageData.formattedPrice,
      isQuote: false,
      features: packageData.features,
      itemType: 'package',
    });
  };

  const handleBookNow = () => {
    handleAddToCart();
    if (onSelect) {
      onSelect(packageData);
    } else {
      openCart();
    }
  };

  return (
    <div className={`cq-pkg-card ${isPopular ? 'cq-pkg-card-popular' : ''}`}>
      {isPopular && (
        <div className="cq-pkg-popular-badge">
          <SparklesIcon size={14} color="#102A29" />
          <span>Most Popular</span>
        </div>
      )}

      <div className="cq-pkg-header">
        <span className="cq-pkg-recommended">{packageData.recommendedFor}</span>
        <h3 className="cq-pkg-title">{packageData.name}</h3>
        <p className="cq-pkg-desc">{packageData.description}</p>
      </div>

      <div className="cq-pkg-price-box">
        <div className="cq-pkg-price-label">Transparent Flat Rate</div>
        <div className="cq-pkg-price-amount">
          {packageData.formattedPrice}
        </div>
        <div className="cq-pkg-price-guarantee">Standard residential session</div>
      </div>

      <div className="cq-pkg-divider" />

      <div className="cq-pkg-features-header">Included in this clean:</div>
      <ul className="cq-pkg-features-list">
        {packageData.features.map((feature, idx) => (
          <li key={idx} className="cq-pkg-feature-item">
            <div className="cq-pkg-check">
              <CheckIcon size={14} color="#2ECDBF" />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="cq-pkg-action" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={handleAddToCart}
          className={`cq-btn ${isPopular ? 'cq-btn-primary' : 'cq-btn-outline'} cq-pkg-btn`}
          id={`add-package-${packageData.id}`}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <ShoppingCartIcon size={16} />
          <span>{cartItem ? `Add More (${cartItem.quantity} in Cart)` : 'Add to Cart'}</span>
        </button>

        <button
          type="button"
          onClick={handleBookNow}
          className="cq-btn cq-btn-secondary"
          style={{ fontSize: '0.85rem', padding: '8px 14px' }}
        >
          Book Now →
        </button>
      </div>
    </div>
  );
};
