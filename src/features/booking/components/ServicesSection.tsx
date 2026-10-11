import React, { useState } from 'react';
import type { Service, ServiceCategory } from '../types';
import { ServiceCard } from './ServiceCard';

interface ServicesSectionProps {
  services: Service[];
  isLoading: boolean;
  onInquireService: (service: Service) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  isLoading,
  onInquireService,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'All Services' },
    { key: 'specialized', label: 'Deep Clean & Post-Build' },
    { key: 'commercial', label: 'Office & Commercial' },
    { key: 'residential', label: 'Residential Overview' },
    { key: 'add_on', label: 'Add-Ons & Extras' },
  ];

  const filteredServices = services.filter((srv) => {
    if (selectedCategory === 'all') return true;
    return srv.category === (selectedCategory as ServiceCategory);
  });

  return (
    <section id="services" className="cq-services-section">
      <div className="cq-container">
        <div className="cq-section-header">
          <span className="cq-badge cq-badge-turquoise">Specialized & Enterprise</span>
          <h2 className="cq-section-title">Comprehensive Cleaning Services</h2>
          <p className="cq-section-subtitle">
            From tailored corporate office hygiene to intensive post-construction cleanups and dishwashing,
            we deliver specialized cleaning configured to your scope.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="cq-category-tabs" role="tablist" aria-label="Filter Services">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat.key}
              className={`cq-tab-btn ${selectedCategory === cat.key ? 'cq-tab-btn-active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="cq-loading-state">
            <div className="cq-spinner" />
            <p>Loading services from registry...</p>
          </div>
        ) : (
          <div className="cq-services-grid">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onInquire={onInquireService}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
