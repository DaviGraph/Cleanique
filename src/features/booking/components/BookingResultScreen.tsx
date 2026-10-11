import React, { useState } from 'react';
import type { CreateBookingResponse } from '../types';
import { SparklesIcon, ShieldCheckIcon, ClockIcon } from './Icons';

interface BookingResultScreenProps {
  booking: CreateBookingResponse;
  onReset: () => void;
}

export const BookingResultScreen: React.FC<BookingResultScreenProps> = ({
  booking,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReference = () => {
    navigator.clipboard?.writeText(booking.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isQuote = booking.is_quote;

  return (
    <div className="cq-result-card">
      {/* Status Header */}
      <div className="cq-result-header">
        <div className="cq-result-icon-badge">
          <SparklesIcon size={32} color="#102A29" />
        </div>

        <span className="cq-badge cq-badge-turquoise">Status: Pending Verification</span>

        <h2 className="cq-result-title">
          {isQuote ? 'Quote requested' : 'Payment instructions coming next'}
        </h2>

        <p className="cq-result-subtitle">
          {isQuote
            ? 'We have received your space specifications. Our team is calculating your custom assessment.'
            : 'Your booking details have been registered. Below is your booking reference and amount due.'}
        </p>
      </div>

      {/* Booking Reference Box */}
      <div className="cq-reference-box">
        <div className="cq-reference-label">Your Booking Reference</div>
        <div className="cq-reference-code-row">
          <span className="cq-reference-code">{booking.reference}</span>
          <button
            type="button"
            onClick={handleCopyReference}
            className="cq-copy-btn"
            title="Copy Reference"
            aria-label="Copy booking reference"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div className="cq-reference-note">
          Keep this reference for payment verification and tracking your booking status.
        </div>
      </div>

      {/* Financials & Amounts for Fixed-Price Bookings */}
      {!isQuote && booking.total_amount && booking.deposit_amount && (
        <div className="cq-amount-due-card">
          <h3 className="cq-amount-heading">Amount Due</h3>

          <div className="cq-amount-grid">
            <div className="cq-amount-item">
              <span className="cq-amount-label">50% Deposit Required</span>
              <span className="cq-amount-deposit">
                ₦{booking.deposit_amount.toLocaleString()}
              </span>
              <span className="cq-amount-sub">Due upon payment instructions release</span>
            </div>

            <div className="cq-amount-item cq-amount-item-total">
              <span className="cq-amount-label">Total Booking Amount</span>
              <span className="cq-amount-total">
                ₦{booking.total_amount.toLocaleString()}
              </span>
              <span className="cq-amount-sub">Remaining balance upon service delivery</span>
            </div>
          </div>

          <div className="cq-instructions-placeholder-box">
            <div className="cq-instructions-icon">
              <ClockIcon size={20} color="#2ECDBF" />
            </div>
            <div>
              <div className="cq-instructions-title">Payment instructions coming next</div>
              <div className="cq-instructions-text">
                Cleanique bank transfer accounts and receipt upload functionality will be provided in
                the upcoming phase. Your booking will be confirmed only after Cleanique verifies the payment.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote summary card for quote requests */}
      {isQuote && (
        <div className="cq-amount-due-card">
          <h3 className="cq-amount-heading">Quote Request Summary</h3>
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
              <div className="cq-instructions-title">Next Steps</div>
              <div className="cq-instructions-text">
                Our operations team will review your space details and reach out to {booking.customerPhone} with
                a detailed schedule and price breakdown.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary Metadata */}
      <div className="cq-booking-meta-card">
        <h4 className="cq-meta-title">Booking Details</h4>
        <dl className="cq-meta-list">
          <div className="cq-meta-row">
            <dt>Client Name</dt>
            <dd>{booking.customerName}</dd>
          </div>
          <div className="cq-meta-row">
            <dt>Contact Phone</dt>
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
            <dt>Scheduled Date</dt>
            <dd>{booking.scheduledDate}</dd>
          </div>
          {booking.scheduledTime && (
            <div className="cq-meta-row">
              <dt>Preferred Window</dt>
              <dd>{booking.scheduledTime}</dd>
            </div>
          )}
          {booking.package_name && (
            <div className="cq-meta-row">
              <dt>Selected Package</dt>
              <dd>{booking.package_name}</dd>
            </div>
          )}
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
