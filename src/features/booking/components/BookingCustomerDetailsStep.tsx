import React, { useState } from 'react';
import type { Service, Package, CreateBookingPayload } from '../types';
import {
  bookingCustomerDetailsSchema,
  quoteCustomerDetailsSchema,
} from '../lib/bookingValidation';
import { SparklesIcon, ShieldCheckIcon, ClockIcon } from './Icons';

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

  // Form field state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceAddress: '',
    scheduledDate: '',
    scheduledTime: '09:00 AM - 12:00 PM (Morning)',
    notes: '',
    quoteDetails: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Minimum allowed date is today in YYYY-MM-DD
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

    // Clear error for field upon typing
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

    // Select the appropriate Zod schema
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
      return;
    }

    // Submit payload adhering to AGENT_RULES.md: NEVER send prices from client!
    onSubmit({
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      customerEmail: formData.customerEmail.trim() || undefined,
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
        <span className="cq-badge cq-badge-turquoise">Step 3 of 3</span>
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
              />
              {errors.customerPhone && (
                <p className="cq-error-msg">{errors.customerPhone}</p>
              )}
            </div>
          </div>

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
            />
            {errors.customerEmail && (
              <p className="cq-error-msg">{errors.customerEmail}</p>
            )}
          </div>

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
            />
            {errors.serviceAddress && (
              <p className="cq-error-msg">{errors.serviceAddress}</p>
            )}
          </div>

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
          </div>
        </aside>
      </div>
    </div>
  );
};
