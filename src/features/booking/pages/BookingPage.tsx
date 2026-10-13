import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getServices, getPackages, createBooking } from '../lib/bookingApi';
import type { Service, Package, CreateBookingPayload, CreateBookingResponse } from '../types';
import { useCart } from '../context/CartContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
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
} from '../components/Icons';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalAmount,
    depositAmount,
    hasQuoteItems,
    totalCount,
  } = useCart();

  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<CreateBookingResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showAddSelector, setShowAddSelector] = useState<boolean>(false);

  // Customer Details Form State
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

  // Fetch initial services & packages, and handle query parameters
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

          // If query param specifies a package, auto-add to cart if empty
          const packageQuery = searchParams.get('package');
          if (packageQuery) {
            const foundPkg = fetchedPackages.find(
              (p) => p.id === packageQuery || p.id === `pkg_${packageQuery}`
            );
            if (foundPkg) {
              addToCart({
                itemId: foundPkg.id,
                name: foundPkg.name,
                category: 'Residential',
                price: foundPkg.price,
                formattedPrice: foundPkg.formattedPrice,
                isQuote: false,
                features: foundPkg.features,
                itemType: 'package',
              });
            }
          }

          // If query param specifies a service, auto-add to cart if empty
          const serviceQuery = searchParams.get('service');
          if (serviceQuery) {
            const foundService = fetchedServices.find(
              (s) => s.id === serviceQuery || s.id === `srv_${serviceQuery}`
            );
            if (foundService) {
              const isDish = foundService.category === 'add_on' || foundService.name.toLowerCase().includes('dish');
              const isQuote = foundService.pricingType === 'quote';
              addToCart({
                itemId: foundService.id,
                name: foundService.name,
                category: foundService.categoryLabel,
                price: isDish ? 3000 : isQuote ? null : 20000,
                formattedPrice: foundService.displayPrice,
                isQuote: isQuote,
                features: foundService.features,
                itemType: 'service',
              });
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

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setSubmitError('Your cart is empty. Please select at least one package or service to proceed.');
      return;
    }

    // Validate with zod schema
    const schema = hasQuoteItems ? quoteCustomerDetailsSchema : bookingCustomerDetailsSchema;
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
      const firstError = document.querySelector('.is-invalid');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Find primary package or service id
      const firstPkgItem = items.find((i) => i.itemType === 'package');
      const firstServiceItem = items.find((i) => i.itemType === 'service');

      // Submit booking with complete cart items array!
      const bookingPayload: CreateBookingPayload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        customerWhatsapp: formData.customerWhatsapp.trim() || undefined,
        serviceAddress: formData.serviceAddress.trim(),
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        notes: formData.notes.trim() || undefined,
        quoteDetails: hasQuoteItems ? formData.quoteDetails.trim() : undefined,
        packageId: firstPkgItem?.itemId,
        serviceId: firstServiceItem?.itemId || 'srv_residential',
        items: items.map((it) => ({
          id: it.itemId,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          formattedPrice: it.formattedPrice,
          isQuote: it.isQuote,
        })),
      };

      const resultBooking = await createBooking(bookingPayload);

      // Clear cart upon successful order creation
      clearCart();

      setBookingResult(resultBooking);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'An error occurred while creating your booking.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBookingResult(null);
    setSubmitError(null);
    navigate('/book');
  };

  return (
    <div className="cq-page-wrapper">
      <Navbar />

      <main className="cq-booking-page-main">
        <div className="cq-container">
          {submitError && (
            <div className="cq-error-banner" role="alert" style={{ marginBottom: '24px' }}>
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 2 / CONFIRMATION RESULT */}
          {bookingResult ? (
            <BookingResultScreen booking={bookingResult} onReset={handleReset} />
          ) : isLoadingData ? (
            <div className="cq-loading-state">
              <div className="cq-spinner" />
              <p>Loading Cleanique checkout & services...</p>
            </div>
          ) : items.length === 0 ? (
            /* EMPTY CART: BUILD YOUR ORDER VIEW */
            <div className="cq-empty-cart-checkout">
              <div className="cq-step-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
                <span className="cq-badge cq-badge-turquoise">Build Your Order</span>
                <h1 className="cq-step-title">Select Services to Add to Cart</h1>
                <p className="cq-step-subtitle" style={{ maxWidth: '640px', margin: '0 auto' }}>
                  Add the cleaning packages and specialized services you need. Your booking checkout will be ready immediately.
                </p>
              </div>

              {/* Residential Packages Grid */}
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#102A29', marginBottom: '16px' }}>
                  Residential Cleaning Packages
                </h2>
                <div className="cq-pkg-grid">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="cq-pkg-card">
                      <div className="cq-pkg-header">
                        <span className="cq-pkg-recommended">{pkg.recommendedFor}</span>
                        <h3 className="cq-pkg-title">{pkg.name}</h3>
                        <p className="cq-pkg-desc">{pkg.description}</p>
                      </div>
                      <div className="cq-pkg-price-box">
                        <div className="cq-pkg-price-amount">{pkg.formattedPrice}</div>
                        <div className="cq-pkg-price-guarantee">Standard residential session</div>
                      </div>
                      <div className="cq-pkg-divider" />
                      <button
                        type="button"
                        onClick={() => {
                          addToCart({
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
                        className="cq-btn cq-btn-primary cq-pkg-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <ShoppingCartIcon size={16} />
                        <span>Add to Cart & Checkout</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons & Specialized Services */}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#102A29', marginBottom: '16px' }}>
                  Add-Ons & Specialized Services
                </h2>
                <div className="cq-services-grid">
                  {services
                    .filter((s) => s.category !== 'residential')
                    .map((srv) => {
                      const isDish = srv.category === 'add_on' || srv.name.toLowerCase().includes('dish');
                      const isQuote = srv.pricingType === 'quote';
                      return (
                        <div key={srv.id} className="cq-service-card">
                          <div className="cq-service-card-top">
                            <span className="cq-badge cq-badge-turquoise">{srv.categoryLabel}</span>
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
                              onClick={() => {
                                addToCart({
                                  itemId: srv.id,
                                  name: srv.name,
                                  category: srv.categoryLabel,
                                  price: isDish ? 3000 : isQuote ? null : 20000,
                                  formattedPrice: srv.displayPrice,
                                  isQuote: isQuote,
                                  features: srv.features,
                                  itemType: 'service',
                                });
                              }}
                              className="cq-btn cq-btn-primary cq-service-btn"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                              <ShoppingCartIcon size={16} />
                              <span>{isQuote ? 'Add Quote Request to Cart' : 'Add to Cart'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE CART CHECKOUT VIEW (The booking is the checkout) */
            <div className="cq-checkout-view">
              <div className="cq-step-header" style={{ marginBottom: '28px' }}>
                <span className="cq-badge cq-badge-turquoise">Booking Checkout</span>
                <h1 className="cq-step-title">Complete Your Booking & Schedule</h1>
                <p className="cq-step-subtitle">
                  Review your cart items on the right and fill in your customer details below to confirm your appointment.
                </p>
              </div>

              <div className="cq-form-layout">
                {/* Form Column */}
                <form className="cq-booking-form" onSubmit={handleCheckoutSubmit} noValidate>
                  {/* Space Details (if any quote item) */}
                  {hasQuoteItems && (
                    <div className="cq-form-group">
                      <label htmlFor="quoteDetails" className="cq-form-label">
                        Space & Facility Details <span className="cq-req">*</span>
                      </label>
                      <textarea
                        id="quoteDetails"
                        name="quoteDetails"
                        rows={4}
                        value={formData.quoteDetails}
                        onChange={handleChange}
                        placeholder="Describe your space dimensions (e.g. 4-bedroom duplex, 300 sqm office, renovation state), specific problem areas, and urgent requirements..."
                        className={`cq-textarea ${errors.quoteDetails ? 'is-invalid' : ''}`}
                      />
                      {errors.quoteDetails && (
                        <p className="cq-error-msg">{errors.quoteDetails}</p>
                      )}
                    </div>
                  )}

                  {/* Customer Full Name & Phone Number */}
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

                  {/* WhatsApp Number & Email Address */}
                  <div className="cq-form-row">
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
                      <p className="cq-input-hint">Used for prompt confirmation & team arrival notifications</p>
                    </div>

                    <div className="cq-form-group">
                      <label htmlFor="customerEmail" className="cq-form-label">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <MailIcon size={15} color="#2ECDBF" />
                          <span>Email Address</span> <span className="cq-opt">(Optional)</span>
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
                  </div>

                  {/* Complete Service Address */}
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

                  {/* Scheduled Date & Arrival Window */}
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
                      Additional Notes / Gate & Parking Instructions <span className="cq-opt">(Optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="e.g. Call at security gate, parking available on compound, pet on premises..."
                      className="cq-textarea"
                    />
                  </div>

                  {/* Submission Action */}
                  <div className="cq-step-nav-bar" style={{ marginTop: '28px' }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="cq-btn cq-btn-primary cq-submit-booking-btn"
                      id="confirm-booking-checkout-btn"
                      style={{ width: '100%', padding: '16px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="cq-spinner-sm" />
                          <span>Confirming Booking Order...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon size={18} />
                          <span>
                            {hasQuoteItems
                              ? 'Submit Booking & Quote Request'
                              : `Confirm Booking (50% Deposit: ₦${depositAmount.toLocaleString()})`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Sidebar Cart & Order Summary */}
                <aside className="cq-booking-sidebar">
                  <div className="cq-summary-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 className="cq-summary-heading" style={{ margin: 0 }}>
                        <ShoppingCartIcon size={18} color="#2ECDBF" />
                        <span>Cart Items ({totalCount})</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddSelector(!showAddSelector)}
                        className="cq-btn cq-btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      >
                        {showAddSelector ? 'Done Adding' : '+ Add More'}
                      </button>
                    </div>

                    {/* Collapsible Add More Panel */}
                    {showAddSelector && (
                      <div style={{ background: '#FFFFFF', border: '1px solid #DCE5E3', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#102A29', marginBottom: '8px' }}>
                          Quick Add Services / Packages:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                          {packages.map((pkg) => (
                            <div key={pkg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid #F0F4F3' }}>
                              <span>{pkg.name} ({pkg.formattedPrice})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  addToCart({
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
                                style={{ background: '#2ECDBF', border: 'none', color: '#102A29', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Add
                              </button>
                            </div>
                          ))}
                          {services.filter(s => s.category !== 'residential').map((srv) => (
                            <div key={srv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid #F0F4F3' }}>
                              <span>{srv.name} ({srv.displayPrice})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const isDish = srv.category === 'add_on' || srv.name.toLowerCase().includes('dish');
                                  const isQuote = srv.pricingType === 'quote';
                                  addToCart({
                                    itemId: srv.id,
                                    name: srv.name,
                                    category: srv.categoryLabel,
                                    price: isDish ? 3000 : isQuote ? null : 20000,
                                    formattedPrice: srv.displayPrice,
                                    isQuote: isQuote,
                                    features: srv.features,
                                    itemType: 'service',
                                  });
                                }}
                                style={{ background: '#2ECDBF', border: 'none', color: '#102A29', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ordered Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {items.map((item) => (
                        <div key={item.id} className="cq-cart-sidebar-item">
                          <div style={{ flex: 1 }}>
                            <div className="cq-cart-sidebar-item-name">{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#889' }}>
                              {item.category} • {item.formattedPrice}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {!item.isQuote && (
                              <div className="cq-cart-qty-controls" style={{ padding: '1px 4px' }}>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="cq-cart-qty-btn"
                                  aria-label="Decrease"
                                >
                                  <MinusIcon size={10} />
                                </button>
                                <span className="cq-cart-qty-val" style={{ fontSize: '0.75rem' }}>{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="cq-cart-qty-btn"
                                  aria-label="Increase"
                                >
                                  <PlusIcon size={10} />
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px' }}
                              title="Remove item"
                            >
                              <TrashIcon size={14} color="#e53935" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    {totalAmount > 0 ? (
                      <div className="cq-summary-price-box">
                        <div className="cq-summary-price-row">
                          <span>Total Order Rate</span>
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
                          Transferred via PalmPay to confirm booking; balance settled upon completion.
                        </div>
                      </div>
                    ) : (
                      <div className="cq-summary-price-box">
                        <div className="cq-summary-price-row">
                          <span>Pricing Mode</span>
                          <span className="cq-summary-price-highlight">Custom Quote</span>
                        </div>
                        <div className="cq-summary-deposit-note">
                          No upfront charge. An estimate will be prepared following review.
                        </div>
                      </div>
                    )}

                    <div className="cq-summary-guarantees">
                      <div className="cq-summary-guarantee-item">
                        <ShieldCheckIcon size={16} color="#2ECDBF" />
                        <span>Verified Cleanique Hygiene Protocol</span>
                      </div>
                      <div className="cq-summary-guarantee-item">
                        <ClockIcon size={16} color="#2ECDBF" />
                        <span>Zero payment required until review & confirmation</span>
                      </div>
                    </div>

                    {/* Contact preview hints */}
                    <div className="cq-summary-contact-hints">
                      {formData.customerEmail && (
                        <div className="cq-summary-contact-hint" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MailIcon size={14} color="#2ECDBF" />
                          <span>Email confirmation will be sent</span>
                        </div>
                      )}
                      {formData.customerWhatsapp && (
                        <div className="cq-summary-contact-hint" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MessageCircleIcon size={14} color="#25D366" />
                          <span>WhatsApp updates enabled</span>
                        </div>
                      )}
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
