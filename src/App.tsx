import { useState, useEffect } from 'react';
import { getServices, getPackages } from './features/booking/lib/bookingApi';
import type { Service, Package } from './features/booking/types';
import { Navbar } from './features/booking/components/Navbar';
import { Hero } from './features/booking/components/Hero';
import { PackagesSection } from './features/booking/components/PackagesSection';
import { ServicesSection } from './features/booking/components/ServicesSection';
import { TrustSection } from './features/booking/components/TrustSection';
import { Footer } from './features/booking/components/Footer';
import { SparklesIcon } from './features/booking/components/Icons';
import './App.css';

function App() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active user selection for feedback
  const [activeSelection, setActiveSelection] = useState<{
    title: string;
    detail: string;
    type: 'package' | 'service';
  } | null>(null);

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
    setActiveSelection({
      title: `${pkg.name} Package Selected`,
      detail: `Rate: ${pkg.formattedPrice}. Booking form and scheduling will open in the next phase.`,
      type: 'package',
    });
  };

  const handleInquireService = (srv: Service) => {
    setActiveSelection({
      title: `${srv.name}`,
      detail: `Pricing: ${srv.displayPrice}. Custom assessment inquiry will open in the next phase.`,
      type: 'service',
    });
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

            <TrustSection />
          </>
        )}
      </main>

      <Footer />

      {/* Interactive Selection Notification */}
      {activeSelection && (
        <div className="cq-notice-banner" role="alert">
          <div className="cq-notice-header">
            <span className="cq-notice-title">
              <SparklesIcon size={16} color="#2ECDBF" />
              {activeSelection.title}
            </span>
            <button
              type="button"
              className="cq-notice-close"
              onClick={() => setActiveSelection(null)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
          <p className="cq-notice-body">{activeSelection.detail}</p>
        </div>
      )}
    </div>
  );
}

export default App;
