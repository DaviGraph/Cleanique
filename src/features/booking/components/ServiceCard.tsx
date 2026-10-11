import React from 'react';
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
} from './Icons';

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

      <div className="cq-service-footer">
        <button
          type="button"
          onClick={() => onInquire?.(service)}
          className="cq-btn cq-btn-secondary cq-service-btn"
          id={`inquire-service-${service.id}`}
        >
          {service.pricingType === 'quote' ? 'Request Custom Quote' : 'View Service Details'}
        </button>
      </div>
    </div>
  );
};
