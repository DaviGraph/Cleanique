import React, { useState } from 'react';
import type { CreateBookingResponse } from '../types';
import { PaymentInstructionsStep } from './PaymentInstructionsStep';
import { SparklesIcon, ShieldCheckIcon, CheckIcon } from './Icons';

interface BookingResultScreenProps {
  booking: CreateBookingResponse;
  onReset: () => void;
}

export const BookingResultScreen: React.FC<BookingResultScreenProps> = ({
  booking,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  // If this is a fixed-price package booking, show the real Payment Instructions & Receipt Upload flow!
  if (!booking.is_quote) {
    return <PaymentInstructionsStep booking={booking} />;
  }

  // Quote Requested Result Screen
  const handleCopyReference = () => {
    navigator.clipboard?.writeText(booking.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cq-result-card">
      <div className="cq-result-header">
        <div className="cq-result-icon-badge">
          <SparklesIcon size={32} color="#102A29" />
        </div>

        <span className="cq-badge cq-badge-turquoise">Status: Pending Verification</span>

        <h2 className="cq-result-title">Quote requested</h2>

        <p className="cq-result-subtitle">
          We have received your space specifications. Our operations team is assessing your
          request and will reach out with a personalized quote.
        </p>
      </div>

      <div className="cq-reference-box">
        <div className="cq-reference-label">Your Quote Reference</div>
        <div className="cq-reference-code-row">
          <span className="cq-reference-code">{booking.reference}</span>
          <button
            type="button"
            onClick={handleCopyReference}
            className="cq-copy-btn"
            title="Copy Reference"
            aria-label="Copy quote reference"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? (
              <>
                <CheckIcon size={13} color="#2ECDBF" />
                <span>Copied</span>
              </>
            ) : (
              'Copy'
            )}
          </button>
        </div>
        <div className="cq-reference-note">
          Please keep this reference for tracking your inquiry status.
        </div>
      </div>

      <div className="cq-amount-due-card">
        <h3 className="cq-amount-heading">Inquiry Summary</h3>
        <div className="cq-quote-details-box">
          <div className="cq-quote-field">
            <span className="cq-quote-field-label">Service:</span>
            <span className="cq-quote-field-val">{booking.service_name}</span>
          </div>
          {booking.quoteDetails && (
            <div className="cq-quote-field">
              <span className="cq-quote-field-label">Space Details:</span>
              <p className="cq-quote-field-text">{booking.quoteDetails}</p>
            </div>
          )}
        </div>

        <div className="cq-instructions-placeholder-box">
          <div className="cq-instructions-icon">
            <ShieldCheckIcon size={20} color="#2ECDBF" />
          </div>
          <div>
            <div className="cq-instructions-title">What Happens Next</div>
            <div className="cq-instructions-text">
              A Cleanique operations coordinator will contact you at {booking.customerPhone} to verify
              measurements, discuss specific requirements, and provide a full estimate before scheduling.
            </div>
          </div>
        </div>
      </div>

      <div className="cq-booking-meta-card">
        <h4 className="cq-meta-title">Client Details</h4>
        <dl className="cq-meta-list">
          <div className="cq-meta-row">
            <dt>Client Name</dt>
            <dd>{booking.customerName}</dd>
          </div>
          <div className="cq-meta-row">
            <dt>Phone Number</dt>
            <dd>{booking.customerPhone}</dd>
          </div>
          {booking.customerEmail && (
            <div className="cq-meta-row">
              <dt>Email Address</dt>
              <dd>{booking.customerEmail}</dd>
            </div>
          )}
          <div className="cq-meta-row">
            <dt>Service Address</dt>
            <dd>{booking.serviceAddress}</dd>
          </div>
          <div className="cq-meta-row">
            <dt>Preferred Date</dt>
            <dd>{booking.scheduledDate}</dd>
          </div>
        </dl>
      </div>

      <div className="cq-result-actions">
        <a href="/" className="cq-btn cq-btn-secondary">
          Return to Home
        </a>
        <button
          type="button"
          onClick={onReset}
          className="cq-btn cq-btn-outline"
        >
          Book Another Service
        </button>
      </div>
    </div>
  );
};
