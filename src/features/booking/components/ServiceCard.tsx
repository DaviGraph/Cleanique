import React, { useState } from 'react';
import type { Service } from '../types';
import {
  HomeIcon,
  SparklesIcon,
  TruckIcon,
  HardHatIcon,
  BriefcaseIcon,
  BuildingIcon,
  UtensilsIcon,
  CheckIcon,
  ShoppingCartIcon,
} from './Icons';
import { useCart } from '../hooks/useCart';

interface ServiceCardProps {
  service: Service;
  onInquire?: (service: Service) => void;
}

function getServiceIcon(iconName: string) {
  switch (iconName) {
    case 'home':
      return <HomeIcon size={24} color="#2ECDBF" />;
    case 'sparkles':
      return <SparklesIcon size={24} color="#2ECDBF" />;
    case 'truck':
      return <TruckIcon size={24} color="#2ECDBF" />;
    case 'hard-hat':
      return <HardHatIcon size={24} color="#2ECDBF" />;
    case 'briefcase':
      return <BriefcaseIcon size={24} color="#2ECDBF" />;
    case 'building':
      return <BuildingIcon size={24} color="#2ECDBF" />;
    case 'utensils':
      return <UtensilsIcon size={24} color="#2ECDBF" />;
    default:
      return <SparklesIcon size={24} color="#2ECDBF" />;
  }
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onInquire }) => {
  const { items, addToCart } = useCart();
  const [isCooldown, setIsCooldown] = useState(false);
  const cartItem = items.find((i) => i.itemId === service.id);

  const isResidentialOverview = service.category === 'residential' || service.name.toLowerCase().includes('residential');
  const isDishwashing = service.category === 'add_on' || service.name.toLowerCase().includes('dish');

  const handleAction = () => {
    if (isCooldown) return;
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 300);

    if (service.pricingType === 'quote') {
      if (onInquire) {
        onInquire(service);
      }
      return;
    }

    if (isResidentialOverview) {
      // Guide customer to view and choose their specific residential apartment package
      const pkgSection = document.getElementById('packages');
      if (pkgSection) {
        pkgSection.scrollIntoView({ behavior: 'smooth' });
      } else if (onInquire) {
        onInquire(service);
      }
      return;
    }

    // Dishwashing or explicit add-on only
    addToCart({
      itemId: service.id,
      name: service.name,
      category: service.categoryLabel || 'Add-on',
      price: isDishwashing ? 3000 : 3000,
      formattedPrice: service.displayPrice,
      isQuote: false,
      features: service.features,
      itemType: 'service',
    });
  };

  return (
    <div className="cq-service-card">
      <div className="cq-service-card-top">
        <div className="cq-service-icon-box">
          {getServiceIcon(service.icon)}
        </div>
        <div className="cq-service-badges">
          <span className="cq-badge cq-badge-turquoise">
            {service.categoryLabel}
          </span>
          {service.badge && (
            <span className="cq-badge cq-badge-teal">
              {service.badge}
            </span>
          )}
        </div>
      </div>

      <h3 className="cq-service-name">{service.name}</h3>
      <p className="cq-service-desc">{service.description}</p>

      <div className="cq-service-pricing-pill">
        <span className="cq-service-pricing-tag">Pricing:</span>
        <span className="cq-service-pricing-value">{service.displayPrice}</span>
      </div>

      <div className="cq-service-features-list">
        {service.features.map((feat, idx) => (
          <div key={idx} className="cq-service-feature-row">
            <CheckIcon size={14} color="#2ECDBF" className="cq-service-feat-check" />
            <span>{feat}</span>
          </div>
        ))}
      </div>

      <div className="cq-service-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={handleAction}
          disabled={isCooldown}
          className="cq-btn cq-btn-primary cq-service-btn"
          id={`add-service-${service.id}`}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {service.pricingType === 'quote' ? (
            <span>Request a Quote →</span>
          ) : isResidentialOverview ? (
            <span>Explore Residential Packages →</span>
          ) : (
            <>
              <ShoppingCartIcon size={16} />
              <span>
                {cartItem
                  ? `In Cart (Qty: ${cartItem.quantity})`
                  : 'Add to Cart'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
