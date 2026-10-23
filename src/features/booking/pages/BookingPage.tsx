import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getServices, getPackages, createBooking } from '../lib/bookingApi';
import type { Service, Package, CreateBookingPayload, CreateBookingResponse } from '../types';
import { useCart } from '../hooks/useCart';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BookingProgress } from '../components/BookingProgress';
import { BookingResultScreen } from '../components/BookingResultScreen';
import {
  bookingCustomerDetailsSchema,
  quoteCustomerDetailsSchema,
} from '../lib/bookingValidation';
import {
  ShieldCheckIcon,
  ClockIcon,
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  MailIcon,
  MessageCircleIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  UtensilsIcon,
} from '../components/Icons';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    items,
    addToCart,
    selectPackage,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalAmount,
    depositAmount,
    totalCount,
  } = useCart();

  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Mode: 'package' for cart / fixed-price packages, 'quote' for custom quote services
  const [bookingMode, setBookingMode] = useState<'package' | 'quote'>('package');
  const [selectedQuoteService, setSelectedQuoteService] = useState<Service | null>(null);

  // Wizard Step: 1 = Selection/Cart, 2 = Customer Form, 3 = Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<CreateBookingResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerWhatsapp: '',
    serviceAddress: '',
    scheduledDate: '',
    scheduledTime: '09:00 AM - 12:00 PM (Morning)',
    notes: '',
    quoteDetails: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const todayStr = new Date().toISOString().split('T')[0];

  const timeOptions = [
    '08:00 AM - 11:00 AM (Early Morning)',
    '09:00 AM - 12:00 PM (Morning)',
    '12:00 PM - 03:00 PM (Midday)',
    '03:00 PM - 06:00 PM (Afternoon)',
    'After Hours (Commercial / Flexible)',
  ];

  const stepLabels = ['Select Service', 'Customer Details', 'Confirmation'];
  const processedParamRef = React.useRef<string | null>(null);

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

          const packageQuery = searchParams.get('package');
          const serviceQuery = searchParams.get('service');
          const stepQuery = searchParams.get('step');

          const paramKey = `${packageQuery || ''}_${serviceQuery || ''}_${stepQuery || ''}`;

          if (packageQuery && processedParamRef.current !== paramKey) {
            processedParamRef.current = paramKey;
            const foundPkg = fetchedPackages.find(
              (p) => p.id === packageQuery || p.id === `pkg_${packageQuery}`
            );
            if (foundPkg) {
              setBookingMode('package');
              selectPackage({
                itemId: foundPkg.id,
                name: foundPkg.name,
                category: 'Residential',
                price: foundPkg.price,
                formattedPrice: foundPkg.formattedPrice,
                isQuote: false,
                features: foundPkg.features,
                itemType: 'package',
              });

              if (stepQuery === '2') {
                setCurrentStep(2);
              }
            }
          } else if (serviceQuery && processedParamRef.current !== paramKey) {
            processedParamRef.current = paramKey;
            const foundService = fetchedServices.find(
              (s) => s.id === serviceQuery || s.id === `srv_${serviceQuery}`
            );
            if (foundService) {
              if (foundService.pricingType === 'quote') {
                setBookingMode('quote');
                setSelectedQuoteService(foundService);
              } else if (foundService.category === 'residential') {
                setBookingMode('package');
              }

              if (stepQuery === '2') {
                setCurrentStep(2);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load Cleanique data:', err);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleProceedToDetails = () => {
    setSubmitError(null);
    if (bookingMode === 'package' && items.length === 0) {
      setSubmitError('Please add at least one residential cleaning package to your cart to proceed.');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSelection = () => {
    setSubmitError(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent double submission

    if (bookingMode === 'package' && items.length === 0) {
      setSubmitError('Your cart is empty. Please select a residential cleaning package.');
      return;
    }

    // Validate using Zod
    const isQuoteMode = bookingMode === 'quote';
    const schema = isQuoteMode ? quoteCustomerDetailsSchema : bookingCustomerDetailsSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      const flattened = result.error.flatten().fieldErrors;
      Object.entries(flattened).forEach(([key, messages]) => {
        if (messages && messages.length > 0) {
          fieldErrors[key] = messages[0];
        }
      });
      setErrors(fieldErrors);

      const firstErrorEl = document.querySelector('.is-invalid');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const primaryPackage = items.find((i) => i.itemType === 'package');

      const bookingPayload: CreateBookingPayload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerWhatsapp: formData.customerWhatsapp.trim() || undefined,
        serviceAddress: formData.serviceAddress.trim(),
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        notes: formData.notes.trim() || undefined,
        quoteDetails: isQuoteMode ? formData.quoteDetails.trim() : undefined,
        packageId: isQuoteMode ? undefined : primaryPackage?.itemId,
        serviceId: isQuoteMode ? selectedQuoteService?.id || 'srv_specialized' : 'srv_residential',
        items: isQuoteMode
          ? undefined
          : items.map((it) => ({
              id: it.itemId,
              name: it.name,
              quantity: it.quantity,
              price: it.price,
              formattedPrice: it.formattedPrice,
              isQuote: false,
            })),
      };

      const resultBooking = await createBooking(bookingPayload);

      // Clear cart on successful booking
      if (!isQuoteMode) {
        clearCart();
      }

      setBookingResult(resultBooking);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while creating your booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBookingResult(null);
    setSubmitError(null);
    setCurrentStep(1);
    navigate('/book');
  };

  return (
    <div className="cq-page-wrapper">
      <Navbar />

      <main className="cq-booking-page-main">
        <div className="cq-container">
          {/* Progress Indicator */}
          <BookingProgress currentStep={currentStep} totalSteps={3} stepLabels={stepLabels} />

          {submitError && (
            <div className="cq-error-banner" role="alert" style={{ marginBottom: '24px' }}>
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 3: RESULT SCREEN */}
          {bookingResult && currentStep === 3 ? (
            <BookingResultScreen booking={bookingResult} onReset={handleReset} />
          ) : isLoadingData ? (
            <div className="cq-loading-state">
              <div className="cq-spinner" />
              <p>Loading Cleanique services &amp; packages...</p>
            </div>
          ) : currentStep === 1 ? (
            /* WIZARD STEP 1: SERVICE & PACKAGE SELECTION */
            <div className="cq-wizard-step-1">
              {/* Mode Toggle Control - Exactly 100% Wide 2-Segment Control */}
              <div className="cq-booking-tabs-wrap">
                <div className="cq-booking-tabs">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode('package');
                      setSelectedQuoteService(null);
                    }}
                    className={`cq-btn cq-booking-tab-btn ${bookingMode === 'package' ? 'cq-btn-primary' : 'cq-btn-outline'}`}
                  >
                    Packages (Fixed Price)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode('quote');
                      const firstQuote = services.find((s) => s.pricingType === 'quote') || null;
                      setSelectedQuoteService(firstQuote);
                    }}
                    className={`cq-btn cq-booking-tab-btn ${bookingMode === 'quote' ? 'cq-btn-primary' : 'cq-btn-outline'}`}
                  >
                    Specialized &amp; Commercial (Custom Quote)
                  </button>
                </div>
              </div>

              {bookingMode === 'package' ? (
                <div>
                  <div className="cq-step-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <span className="cq-badge cq-badge-turquoise">Step 1 of 2</span>
                    <h1 className="cq-step-title">Choose Residential Cleaning Package</h1>
                    <p className="cq-step-subtitle" style={{ maxWidth: '640px', margin: '0 auto' }}>
                      Select the residential package tailored to your space. You can review cart items before entering schedule details.
                    </p>
                  </div>

                  {/* Active Cart Banner (if items exist) */}
                  {items.length > 0 && (
                    <div style={{ background: '#102A29', color: '#FFFFFF', padding: '18px 24px', borderRadius: '14px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ShoppingCartIcon size={20} color="#2ECDBF" />
                          <span>Cart Summary ({totalCount} item{totalCount > 1 ? 's' : ''})</span>
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#B0D8D5', marginTop: '4px' }}>
                          Estimated Display Total: <strong>₦{totalAmount.toLocaleString()}</strong> (50% Deposit: ₦{depositAmount.toLocaleString()})
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleProceedToDetails}
                        className="cq-btn cq-btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
                      >
                        <span>Proceed to Customer Details</span>
                        <ArrowRightIcon size={16} />
                      </button>
                    </div>
                  )}

                  {/* Packages Grid */}
                  <div className="cq-pkg-grid" style={{ marginBottom: '36px' }}>
                    {packages.map((pkg) => {
                      const isSelected = items.some((i) => i.itemId === pkg.id && i.itemType === 'package');
                      return (
                        <div key={pkg.id} className={`cq-pkg-card ${isSelected ? 'cq-pkg-card-selected is-selected' : ''}`}>
                          {pkg.popular && (
                            <div className="cq-pkg-popular-badge">
                              <SparklesIcon size={14} color="#102A29" />
                              <span>Most Popular</span>
                            </div>
                          )}
                          <div className="cq-pkg-header">
                            <span className="cq-pkg-recommended">{pkg.recommendedFor}</span>
                            <h3 className="cq-pkg-title">{pkg.name}</h3>
                            <p className="cq-pkg-desc">{pkg.description}</p>
                          </div>
                          <div className="cq-pkg-price-box">
                            <div className="cq-pkg-price-amount">{pkg.formattedPrice}</div>
                            <div className="cq-pkg-price-guarantee">Approved Flat Rate &bull; Standard Clean</div>
                          </div>
                          <div className="cq-pkg-divider" />
                          <button
                            type="button"
                            onClick={() => {
                              selectPackage({
                                itemId: pkg.id,
                                name: pkg.name,
                                category: 'Residential',
                                price: pkg.price,
                                formattedPrice: pkg.formattedPrice,
                                isQuote: false,
                                features: pkg.features,
                                itemType: 'package',
                              });
                            }}
                            className={`cq-btn ${isSelected ? 'cq-btn-secondary' : 'cq-btn-primary'} cq-pkg-btn`}
                            id={`select-package-${pkg.id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            {isSelected ? (
                              <>
                                <CheckIcon size={16} />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select Package</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Add-on: Dishwashing */}
                  <div className="cq-addons-box" style={{ background: '#FFFFFF', border: '1px solid #DCE5E3', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#102A29', margin: 0 }}>
                          Optional Cleaning Add-Ons
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#516d6a', margin: '4px 0 0 0' }}>
                          Add extra services to your residential clean. Remains unselected unless you deliberately choose to add it.
                        </p>
                      </div>
                      <span className="cq-badge cq-badge-turquoise">Optional</span>
                    </div>

                    {(() => {
                      const dishItem = items.find((i) => i.name.toLowerCase().includes('dish'));
                      const isDishAdded = Boolean(dishItem);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '16px', background: '#F5F9F8', borderRadius: '12px', border: isDishAdded ? '2px solid #2ECDBF' : '1px solid #E1EDEA' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(46, 205, 191, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <UtensilsIcon size={22} color="#2ECDBF" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#102A29', fontSize: '1rem' }}>
                                Dishwashing Service
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#516d6a' }}>
                                Starts at ₦3,000 (final price depends on the quantity of dishes)
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isDishAdded && dishItem) {
                                removeFromCart(dishItem.id);
                              } else {
                                addToCart({
                                  itemId: 'srv_dishwashing',
                                  name: 'Dishwashing Add-on',
                                  category: 'Add-on',
                                  price: 3000,
                                  formattedPrice: 'Starts at ₦3,000',
                                  isQuote: false,
                                  itemType: 'service',
                                });
                              }
                            }}
                            className={`cq-btn ${isDishAdded ? 'cq-btn-secondary' : 'cq-btn-outline'}`}
                            style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                            id="toggle-dishwashing-btn"
                          >
                            {isDishAdded ? '✓ Dishwashing Added (Remove)' : '+ Add Dishwashing (Starts at ₦3,000)'}
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Proceed CTA */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                    <button
                      type="button"
                      onClick={handleProceedToDetails}
                      className="cq-btn cq-btn-primary"
                      style={{ padding: '16px 36px', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                      id="proceed-to-details-btn"
                    >
                      <span>Next Step: Enter Customer Details &amp; Schedule</span>
                      <ArrowRightIcon size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                /* QUOTE SERVICES SELECTION */
                <div>
                  <div className="cq-step-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <span className="cq-badge cq-badge-turquoise">Custom Quote Request</span>
                    <h1 className="cq-step-title">Select Specialized or Commercial Service</h1>
                    <p className="cq-step-subtitle" style={{ maxWidth: '640px', margin: '0 auto' }}>
                      Specialized cleans and corporate spaces require custom assessment. Select your service below to submit space specifications.
                    </p>
                  </div>

                  <div className="cq-services-grid" style={{ marginBottom: '40px' }}>
                    {services
                      .filter((s) => s.pricingType === 'quote')
                      .map((srv) => {
                        const isSelected = selectedQuoteService?.id === srv.id;
                        return (
                          <div
                            key={srv.id}
                            className={`cq-service-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setSelectedQuoteService(srv)}
                            style={{ cursor: 'pointer', border: isSelected ? '2px solid #2ECDBF' : '1px solid #DCE5E3' }}
                          >
                            <div className="cq-service-card-top">
                              <span className="cq-badge cq-badge-turquoise">{srv.categoryLabel}</span>
                              {isSelected && <span style={{ color: '#2ECDBF', fontWeight: 700, fontSize: '0.85rem' }}>Selected</span>}
                            </div>
                            <h3 className="cq-service-name">{srv.name}</h3>
                            <p className="cq-service-desc">{srv.description}</p>
                            <div className="cq-service-pricing-pill">
                              <span className="cq-service-pricing-tag">Pricing:</span>
                              <span className="cq-service-pricing-value">{srv.displayPrice}</span>
                            </div>
                            <div className="cq-service-footer">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuoteService(srv);
                                  handleProceedToDetails();
                                }}
                                className="cq-btn cq-btn-primary cq-service-btn"
                              >
                                Select &amp; Request Quote
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {selectedQuoteService && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                      <button
                        type="button"
                        onClick={handleProceedToDetails}
                        className="cq-btn cq-btn-primary"
                        style={{ padding: '16px 36px', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                      >
                        <span>Next Step: Fill Space &amp; Customer Details ({selectedQuoteService.name})</span>
                        <ArrowRightIcon size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* WIZARD STEP 2: CUSTOMER DETAILS & SCHEDULE FORM */
            <div className="cq-wizard-step-2">
              <div className="cq-step-header" style={{ marginBottom: '28px' }}>
                <button
                  type="button"
                  onClick={handleBackToSelection}
                  className="cq-btn cq-btn-outline"
                  style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}
                >
                  <ChevronLeftIcon size={14} /> Back to Service Selection
                </button>

                <span className="cq-badge cq-badge-turquoise">Step 2 of 2</span>
                <h1 className="cq-step-title">
                  {bookingMode === 'quote'
                    ? `Quote Details for ${selectedQuoteService?.name || 'Specialized Service'}`
                    : 'Customer & Schedule Information'}
                </h1>
                <p className="cq-step-subtitle">
                  Please complete all required fields (*). Your preferences will be transmitted directly to Cleanique operations.
                </p>
              </div>

              <div className="cq-form-layout">
                {/* Main Form */}
                <form className="cq-booking-form" onSubmit={handleFormSubmit} noValidate>
                  {/* Space Details (if Quote Mode) */}
                  {bookingMode === 'quote' && (
                    <div className="cq-form-group">
                      <label htmlFor="quoteDetails" className="cq-form-label">
                        Space &amp; Facility Specifications <span className="cq-req">*</span>
                      </label>
                      <textarea
                        id="quoteDetails"
                        name="quoteDetails"
                        rows={4}
                        value={formData.quoteDetails}
                        onChange={handleChange}
                        placeholder="Provide space size, room count, specific problem areas, post-renovation status, or office layout..."
                        className={`cq-textarea ${errors.quoteDetails ? 'is-invalid' : ''}`}
                      />
                      {errors.quoteDetails && (
                        <p className="cq-error-msg">{errors.quoteDetails}</p>
                      )}
                    </div>
                  )}

                  {/* Full Name & Phone Number */}
                  <div className="cq-form-row">
                    <div className="cq-form-group">
                      <label htmlFor="customerName" className="cq-form-label">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <UserIcon size={15} color="#2ECDBF" />
                          <span>Full Name</span> <span className="cq-req">*</span>
                        </span>
                      </label>
                      <input
                        id="customerName"
                        name="customerName"
                        type="text"
                        value={formData.customerName}
                        onChange={handleChange}
                        placeholder="e.g. Chinedu Okafor"
                        className={`cq-input ${errors.customerName ? 'is-invalid' : ''}`}
                        autoComplete="name"
                      />
                      {errors.customerName && (
                        <p className="cq-error-msg">{errors.customerName}</p>
                      )}
                    </div>

                    <div className="cq-form-group">
                      <label htmlFor="customerPhone" className="cq-form-label">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <PhoneIcon size={15} color="#2ECDBF" />
                          <span>Phone Number</span> <span className="cq-req">*</span>
                        </span>
                      </label>
                      <input
                        id="customerPhone"
                        name="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        placeholder="e.g. 0803 123 4567"
                        className={`cq-input ${errors.customerPhone ? 'is-invalid' : ''}`}
                        autoComplete="tel"
                      />
                      {errors.customerPhone && (
                        <p className="cq-error-msg">{errors.customerPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Email & WhatsApp */}
                  <div className="cq-form-row">
                    <div className="cq-form-group">
                      <label htmlFor="customerEmail" className="cq-form-label">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <MailIcon size={15} color="#2ECDBF" />
                          <span>Email Address</span> <span className="cq-req">*</span>
                        </span>
                      </label>
                      <input
                        id="customerEmail"
                        name="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={handleChange}
                        placeholder="e.g. chinedu@example.com"
                        className={`cq-input ${errors.customerEmail ? 'is-invalid' : ''}`}
                        autoComplete="email"
                      />
                      {errors.customerEmail && (
                        <p className="cq-error-msg">{errors.customerEmail}</p>
                      )}
                    </div>

                    <div className="cq-form-group">
                      <label htmlFor="customerWhatsapp" className="cq-form-label">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <MessageCircleIcon size={15} color="#25D366" />
                          <span>WhatsApp Number</span> <span className="cq-opt">(Optional)</span>
                        </span>
                      </label>
                      <input
                        id="customerWhatsapp"
                        name="customerWhatsapp"
                        type="tel"
                        value={formData.customerWhatsapp}
                        onChange={handleChange}
                        placeholder="e.g. +234 803 123 4567"
                        className={`cq-input ${errors.customerWhatsapp ? 'is-invalid' : ''}`}
                        autoComplete="tel"
                      />
                      {errors.customerWhatsapp && (
                        <p className="cq-error-msg">{errors.customerWhatsapp}</p>
                      )}
                    </div>
                  </div>

                  {/* Service Address */}
                  <div className="cq-form-group">
                    <label htmlFor="serviceAddress" className="cq-form-label">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <MapPinIcon size={15} color="#2ECDBF" />
                        <span>Service Address / Cleaning Location</span> <span className="cq-req">*</span>
                      </span>
                    </label>
                    <input
                      id="serviceAddress"
                      name="serviceAddress"
                      type="text"
                      value={formData.serviceAddress}
                      onChange={handleChange}
                      placeholder="e.g. Flat 4B, Greenwood Court, Victoria Island, Lagos"
                      className={`cq-input ${errors.serviceAddress ? 'is-invalid' : ''}`}
                      autoComplete="street-address"
                    />
                    {errors.serviceAddress && (
                      <p className="cq-error-msg">{errors.serviceAddress}</p>
                    )}
                  </div>

                  {/* Date & Arrival Window */}
                  <div className="cq-form-row">
                    <div className="cq-form-group">
                      <label htmlFor="scheduledDate" className="cq-form-label">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarIcon size={15} color="#2ECDBF" />
                          <span>Preferred Date (Today or later)</span> <span className="cq-req">*</span>
                        </span>
                      </label>
                      <input
                        id="scheduledDate"
                        name="scheduledDate"
                        type="date"
                        min={todayStr}
                        value={formData.scheduledDate}
                        onChange={handleChange}
                        className={`cq-input ${errors.scheduledDate ? 'is-invalid' : ''}`}
                      />
                      {errors.scheduledDate && (
                        <p className="cq-error-msg">{errors.scheduledDate}</p>
                      )}
                    </div>

                    <div className="cq-form-group">
                      <label htmlFor="scheduledTime" className="cq-form-label">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <ClockIcon size={15} color="#2ECDBF" />
                          <span>Arrival Window</span> <span className="cq-req">*</span>
                        </span>
                      </label>
                      <select
                        id="scheduledTime"
                        name="scheduledTime"
                        value={formData.scheduledTime}
                        onChange={handleChange}
                        className="cq-select"
                      >
                        {timeOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Gate / Access Notes */}
                  <div className="cq-form-group">
                    <label htmlFor="notes" className="cq-form-label">
                      Additional Notes / Gate &amp; Parking Instructions <span className="cq-opt">(Optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="e.g. Call at security gate, parking space on premises..."
                      className="cq-textarea"
                    />
                  </div>

                  {/* Action Bar */}
                  <div className="cq-step-nav-bar" style={{ marginTop: '28px', display: 'flex', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={handleBackToSelection}
                      disabled={isSubmitting}
                      className="cq-btn cq-btn-outline"
                      style={{ flex: '1', padding: '16px' }}
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="cq-btn cq-btn-primary cq-submit-booking-btn"
                      id="confirm-booking-checkout-btn"
                      style={{ flex: '2', padding: '16px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="cq-spinner-sm" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon size={18} />
                          <span>
                            {bookingMode === 'quote'
                              ? 'Submit Quote Request'
                              : 'Confirm Booking Request'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Sidebar Summary */}
                <aside className="cq-booking-sidebar">
                  <div className="cq-summary-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 className="cq-summary-heading" style={{ margin: 0, border: 'none', padding: 0 }}>
                        <ShoppingCartIcon size={18} color="#2ECDBF" />
                        <span>{bookingMode === 'quote' ? 'Selected Service' : `Cart Items (${totalCount})`}</span>
                      </h3>

                      {bookingMode === 'package' && items.length > 0 && (
                        <button
                          type="button"
                          onClick={clearCart}
                          className="cq-cart-clear-btn"
                          style={{ fontSize: '0.78rem', color: '#e53935' }}
                        >
                          Clear cart
                        </button>
                      )}
                    </div>

                    {bookingMode === 'quote' ? (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#102A29', fontSize: '1rem' }}>
                          {selectedQuoteService?.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                          Custom Quote required following review
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {items.map((item) => (
                          <div key={item.id} className="cq-cart-sidebar-item">
                            <div style={{ flex: 1 }}>
                              <div className="cq-cart-sidebar-item-name">{item.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#889' }}>
                                {item.formattedPrice}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Ergonomic Steppers with >= 44px tap targets */}
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

                              {/* Clear "Remove" Button */}
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="cq-cart-item-remove-btn"
                                title={`Remove ${item.name}`}
                                aria-label={`Remove ${item.name}`}
                              >
                                <TrashIcon size={16} color="#e53935" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {bookingMode === 'package' && totalAmount > 0 ? (
                      <div className="cq-summary-price-box">
                        <div className="cq-summary-price-row">
                          <span>Display Total Rate</span>
                          <span className="cq-summary-price-highlight">
                            ₦{totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="cq-summary-price-row" style={{ marginTop: '8px', color: '#2ECDBF' }}>
                          <span style={{ fontWeight: 700 }}>50% Initial Deposit</span>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                            ₦{depositAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="cq-summary-deposit-note">
                          Transferred via PalmPay upon creation; finalized by server after booking.
                        </div>
                      </div>
                    ) : (
                      <div className="cq-summary-price-box">
                        <div className="cq-summary-price-row">
                          <span>Pricing Mode</span>
                          <span className="cq-summary-price-highlight">Custom Quote</span>
                        </div>
                        <div className="cq-summary-deposit-note">
                          Zero initial charge. Estimate issued upon review.
                        </div>
                      </div>
                    )}

                    <div className="cq-summary-guarantees">
                      <div className="cq-summary-guarantee-item">
                        <ShieldCheckIcon size={16} color="#2ECDBF" />
                        <span>Cleanique Quality Guarantee</span>
                      </div>
                      <div className="cq-summary-guarantee-item">
                        <SparklesIcon size={16} color="#2ECDBF" />
                        <span>Hospital-Grade Eco Disinfectants</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
