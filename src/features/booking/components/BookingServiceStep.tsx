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
  ArrowRightIcon,
} from './Icons';

interface BookingServiceStepProps {
  services: Service[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
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

export const BookingServiceStep: React.FC<BookingServiceStepProps> = ({
  services,
  selectedService,
  onSelectService,
}) => {
  return (
    <div className="cq-step-content">
      <div className="cq-step-header">
        <span className="cq-badge cq-badge-turquoise">Step 1 of 3</span>
        <h2 className="cq-step-title">Choose Your Cleaning Service</h2>
        <p className="cq-step-subtitle">
          Select between our fixed-rate residential packages or request a custom assessment for specialized &
          commercial facilities.
        </p>
      </div>

      <div className="cq-service-select-grid">
        {services.map((srv) => {
          const isSelected = selectedService?.id === srv.id;
          const isFixed = srv.pricingType === 'fixed';

          return (
            <div
              key={srv.id}
              className={`cq-service-select-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectService(srv)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectService(srv);
                }
              }}
              id={`service-card-${srv.id}`}
            >
              <div className="cq-service-select-top">
                <div className="cq-service-select-icon">
                  {getServiceIcon(srv.icon)}
                </div>
                <div className="cq-service-select-type-tag">
                  {isFixed ? (
                    <span className="cq-badge cq-badge-turquoise">Package Rates</span>
                  ) : (
                    <span className="cq-badge cq-badge-teal">Quote Based</span>
                  )}
                </div>
              </div>

              <div className="cq-service-select-body">
                <h3 className="cq-service-select-name">{srv.name}</h3>
                <p className="cq-service-select-desc">{srv.description}</p>
              </div>

              <div className="cq-service-select-footer">
                <div className="cq-service-select-price">
                  <span className="cq-price-label">Pricing</span>
                  <span className="cq-price-value">{srv.displayPrice}</span>
                </div>

                <div className="cq-service-select-cta">
                  <span>{isFixed ? 'Select Package' : 'Request Quote'}</span>
                  <ArrowRightIcon size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
