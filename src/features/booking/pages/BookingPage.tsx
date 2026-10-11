import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getServices, getPackages, createBooking } from '../lib/bookingApi';
import type { Service, Package, CreateBookingPayload, CreateBookingResponse } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BookingProgress } from '../components/BookingProgress';
import { BookingServiceStep } from '../components/BookingServiceStep';
import { BookingPackageStep } from '../components/BookingPackageStep';
import { BookingCustomerDetailsStep } from '../components/BookingCustomerDetailsStep';
import { BookingResultScreen } from '../components/BookingResultScreen';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Stepper state
  // 1: Service selection
  // 2: Package selection (if fixed price)
  // 3: Customer details & scheduling
  // 4: Confirmation result
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<CreateBookingResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch initial data exclusively through bookingApi.ts
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoadingData(true);
        const [fetchedServices, fetchedPackages] = await Promise.all([
          getServices(),
          getPackages(),
        ]);

        if (isMounted) {
          setServices(fetchedServices);
          setPackages(fetchedPackages);

          // Check if query params pre-select a service or package
          const serviceQuery = searchParams.get('service');
          const packageQuery = searchParams.get('package');

          if (serviceQuery) {
            const foundService = fetchedServices.find(
              (s) => s.id === serviceQuery || s.id === `srv_${serviceQuery}`
            );
            if (foundService) {
              setSelectedService(foundService);
              if (foundService.pricingType === 'quote') {
                setCurrentStep(3);
              } else {
                setCurrentStep(2);
              }
            }
          }

          if (packageQuery) {
            const foundPackage = fetchedPackages.find(
              (p) => p.id === packageQuery || p.id === `pkg_${packageQuery}`
            );
            if (foundPackage) {
              setSelectedPackage(foundPackage);
              const resService = fetchedServices.find((s) => s.id === 'srv_residential');
              if (resService) setSelectedService(resService);
              setCurrentStep(3);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load Cleanique services:', err);
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Handler: When customer chooses a service
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setSubmitError(null);

    if (service.pricingType === 'fixed') {
      // Fixed price goes to the package picker
      setCurrentStep(2);
    } else {
      // Quote-based goes straight to details form with quote textarea
      setSelectedPackage(null);
      setCurrentStep(3);
    }
  };

  // Handler: When customer chooses a residential package
  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
  };

  // Handler: Advance from package picker to customer details
  const handleContinueToDetails = () => {
    if (!selectedPackage) return;
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Back navigation
  const handleBack = () => {
    setSubmitError(null);
    if (currentStep === 3) {
      if (selectedService?.pricingType === 'quote') {
        setCurrentStep(1);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Form submission via bookingApi.createBooking()
  const handleSubmitBooking = async (payload: CreateBookingPayload) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Submit through bookingApi.ts (Client never sends prices)
      const result = await createBooking(payload);
      setBookingResult(result);
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'An error occurred while creating your booking.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to book another service
  const handleReset = () => {
    setSelectedService(null);
    setSelectedPackage(null);
    setBookingResult(null);
    setCurrentStep(1);
    navigate('/book');
  };

  const isQuoteMode = selectedService?.pricingType === 'quote';

  const stepLabels = isQuoteMode
    ? ['Select Service', 'Details & Quote Request', 'Confirmation']
    : ['Select Service', 'Choose Package', 'Customer Details', 'Confirmation'];

  const progressStep =
    currentStep === 4
      ? stepLabels.length
      : isQuoteMode && currentStep === 3
      ? 2
      : currentStep;

  return (
    <div className="cq-page-wrapper">
      <Navbar />

      <main className="cq-booking-page-main">
        <div className="cq-container">
          {/* Progress Bar (hidden on final result screen) */}
          {currentStep < 4 && (
            <BookingProgress
              currentStep={progressStep}
              totalSteps={stepLabels.length}
              stepLabels={stepLabels}
            />
          )}

          {submitError && (
            <div className="cq-error-banner" role="alert">
              <span>{submitError}</span>
            </div>
          )}

          {isLoadingData ? (
            <div className="cq-loading-state">
              <div className="cq-spinner" />
              <p>Loading Cleanique booking options...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Service Selection */}
              {currentStep === 1 && (
                <BookingServiceStep
                  services={services}
                  selectedService={selectedService}
                  onSelectService={handleSelectService}
                />
              )}

              {/* Step 2: Package Selection (Fixed-price only) */}
              {currentStep === 2 && (
                <BookingPackageStep
                  packages={packages}
                  selectedPackage={selectedPackage}
                  onSelectPackage={handleSelectPackage}
                  onBack={handleBack}
                  onContinue={handleContinueToDetails}
                />
              )}

              {/* Step 3: Customer Details & Scheduling */}
              {currentStep === 3 && selectedService && (
                <BookingCustomerDetailsStep
                  service={selectedService}
                  packageData={selectedPackage}
                  isSubmitting={isSubmitting}
                  onBack={handleBack}
                  onSubmit={handleSubmitBooking}
                />
              )}

              {/* Step 4: Result Screen */}
              {currentStep === 4 && bookingResult && (
                <BookingResultScreen
                  booking={bookingResult}
                  onReset={handleReset}
                />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
