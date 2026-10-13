import React, { useState } from 'react';
import type { Service, Package, CreateBookingPayload } from '../types';
import {
  bookingCustomerDetailsSchema,
  quoteCustomerDetailsSchema,
} from '../lib/bookingValidation';
import {
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  MailIcon,
  MessageCircleIcon,
} from './Icons';

interface BookingCustomerDetailsStepProps {
  service: Service;
  packageData: Package | null;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: (payload: CreateBookingPayload) => void;
}

export const BookingCustomerDetailsStep: React.FC<BookingCustomerDetailsStepProps> = ({
  service,
  packageData,
  isSubmitting,
  onBack,
  onSubmit,
}) => {
  const isQuote = service.pricingType === 'quote' || !packageData;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const schema = isQuote ? quoteCustomerDetailsSchema : bookingCustomerDetailsSchema;
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
      // Scroll to first error
      const firstError = document.querySelector('.is-invalid');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Submit payload — NEVER send prices from client (AGENT_RULES.md)
    onSubmit({
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      customerEmail: formData.customerEmail.trim() || undefined,
      customerWhatsapp: formData.customerWhatsapp.trim() || undefined,
      serviceAddress: formData.serviceAddress.trim(),
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      notes: formData.notes.trim() || undefined,
      quoteDetails: isQuote ? formData.quoteDetails.trim() : undefined,
      serviceId: service.id,
      packageId: packageData?.id,
    });
  };

  return (
    <div className="cq-step-content">
      <div className="cq-step-header">
        <span className="cq-badge cq-badge-turquoise">Step {isQuote ? '2' : '3'} of {isQuote ? '2' : '3'}</span>
        <h2 className="cq-step-title">
          {isQuote ? 'Request Your Custom Quote' : 'Customer & Scheduling Details'}
        </h2>
        <p className="cq-step-subtitle">
          {isQuote
            ? 'Provide details about your facility so our team can calculate an accurate, itemized assessment.'
            : 'Enter your contact details and preferred date. No payment is taken at this step.'}
        </p>
      </div>

      <div className="cq-form-layout">
        {/* Form Column */}
        <form className="cq-booking-form" onSubmit={handleSubmit} noValidate>
          {isQuote && (
            <div className="cq-form-group">
              <label htmlFor="quoteDetails" className="cq-form-label">
                Space & Requirements Details <span className="cq-req">*</span>
              </label>
              <textarea
                id="quoteDetails"
                name="quoteDetails"
                rows={4}
                value={formData.quoteDetails}
                onChange={handleChange}
                placeholder="Describe your space size (e.g. 3-office suite, 500 sqm warehouse, newly plastered 4-bedroom duplex), existing condition, and any urgent deadlines..."
                className={`cq-textarea ${errors.quoteDetails ? 'is-invalid' : ''}`}
              />
              {errors.quoteDetails && (
                <p className="cq-error-msg">{errors.quoteDetails}</p>
              )}
            </div>
          )}

          {/* Name + Phone */}
          <div className="cq-form-row">
            <div className="cq-form-group">
              <label htmlFor="customerName" className="cq-form-label">
                Full Name <span className="cq-req">*</span>
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
                Phone Number <span className="cq-req">*</span>
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

          {/* Email + WhatsApp */}
          <div className="cq-form-row">
            <div className="cq-form-group">
              <label htmlFor="customerEmail" className="cq-form-label">
                Email Address <span className="cq-opt">(Optional)</span>
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
                <span className="cq-whatsapp-label-inner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Number <span className="cq-opt">(Optional)</span>
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
              <p className="cq-input-hint">Used to send booking updates via WhatsApp</p>
            </div>
          </div>

          {/* Service Address */}
          <div className="cq-form-group">
            <label htmlFor="serviceAddress" className="cq-form-label">
              Service Address / Location <span className="cq-req">*</span>
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

          {/* Date + Time */}
          <div className="cq-form-row">
            <div className="cq-form-group">
              <label htmlFor="scheduledDate" className="cq-form-label">
                Preferred Date (Today or later) <span className="cq-req">*</span>
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
                Preferred Arrival Window <span className="cq-req">*</span>
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

          {/* Notes */}
          <div className="cq-form-group">
            <label htmlFor="notes" className="cq-form-label">
              Additional Notes / Gate Instructions <span className="cq-opt">(Optional)</span>
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

          <div className="cq-step-nav-bar">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="cq-btn cq-btn-outline"
            >
              ← Back
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cq-btn cq-btn-primary cq-submit-booking-btn"
              id="submit-booking-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="cq-spinner-sm" />
                  <span>Submitting to Cleanique...</span>
                </>
              ) : isQuote ? (
                'Submit Quote Request'
              ) : (
                'Confirm Booking Details'
              )}
            </button>
          </div>
        </form>

        {/* Sidebar Summary */}
        <aside className="cq-booking-sidebar">
          <div className="cq-summary-card">
            <h3 className="cq-summary-heading">
              <SparklesIcon size={18} color="#2ECDBF" />
              Booking Summary
            </h3>

            <div className="cq-summary-section">
              <div className="cq-summary-label">Service</div>
              <div className="cq-summary-value">{service.name}</div>
            </div>

            {packageData ? (
              <>
                <div className="cq-summary-section">
                  <div className="cq-summary-label">Package</div>
                  <div className="cq-summary-value">{packageData.name}</div>
                  <div className="cq-summary-sub">{packageData.recommendedFor}</div>
                </div>

                <div className="cq-summary-price-box">
                  <div className="cq-summary-price-row">
                    <span>Total Package Rate</span>
                    <span className="cq-summary-price-highlight">
                      {packageData.formattedPrice}
                    </span>
                  </div>
                  <div className="cq-summary-deposit-note">
                    50% deposit (₦{(packageData.price * 0.5).toLocaleString()}) required after booking review.
                  </div>
                </div>
              </>
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
                <span>Zero charge until review & verification</span>
              </div>
            </div>

            {/* Contact info preview */}
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
  );
};
