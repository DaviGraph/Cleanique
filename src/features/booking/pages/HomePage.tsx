import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, getPackages } from '../lib/bookingApi';
import type { Service, Package } from '../types';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { PackagesSection } from '../components/PackagesSection';
import { ServicesSection } from '../components/ServicesSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { TrustSection } from '../components/TrustSection';
import { ContactSection } from '../components/ContactSection';
import { Footer } from '../components/Footer';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCleaniqueData() {
      try {
        setIsLoading(true);
        // All data access strictly goes through bookingApi.ts
        const [fetchedPackages, fetchedServices] = await Promise.all([
          getPackages(),
          getServices(),
        ]);

        if (isMounted) {
          setPackages(fetchedPackages);
          setServices(fetchedServices);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load services.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCleaniqueData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPackage = (pkg: Package) => {
    navigate(`/book?package=${pkg.id}&step=2`);
  };

  const handleInquireService = (srv: Service) => {
    navigate(`/book?service=${srv.id}&step=2`);
  };

  return (
    <div className="cq-page-wrapper">
      <Navbar />

      <main>
        <Hero />

        {error ? (
          <div className="cq-container" style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ color: '#d9534f', fontWeight: 600 }}>{error}</p>
          </div>
        ) : (
          <>
            <PackagesSection
              packages={packages}
              isLoading={isLoading}
              onSelectPackage={handleSelectPackage}
            />

            <ServicesSection
              services={services}
              isLoading={isLoading}
              onInquireService={handleInquireService}
            />

            <HowItWorksSection />

            <TrustSection />

            <ContactSection />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};
