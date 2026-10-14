import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CreateBookingResponse } from '../types';
import { BankDetailsCard } from './BankDetailsCard';
import { ReceiptUpload } from './ReceiptUpload';
import {
  SparklesIcon,
  CheckIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
} from './Icons';

interface PaymentInstructionsStepProps {
  booking: CreateBookingResponse;
}

export const PaymentInstructionsStep: React.FC<PaymentInstructionsStepProps> = ({
  booking,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const statusPath = `/booking/${booking.reference}?t=${booking.access_token}`;
  const statusFullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${statusPath}`
    : statusPath;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(statusFullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(booking.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="cq-payment-instructions-card">
      {/* Top Header */}
      <div className="cq-payment-header">
        <div className="cq-payment-icon-badge">
          <SparklesIcon size={28} color="#102A29" />
        </div>

        <span className="cq-badge cq-badge-turquoise">Booking Registered</span>

        <h2 className="cq-payment-title">Complete Your 50% Deposit Transfer</h2>

        <p className="cq-payment-subtitle">
          Your cleaning request has been received. Please transfer the 50% initial deposit
          to secure your scheduled time slot, then attach your receipt below.
        </p>
      </div>

      {/* Reference & Amounts Due Grid */}
      <div className="cq-payment-summary-grid">
        {/* Booking Reference Box */}
        <div className="cq-payment-ref-card">
          <span className="cq-payment-box-label">Your Booking Reference</span>
          <div className="cq-ref-display-row">
            <span className="cq-ref-display-code">{booking.reference}</span>
            <button
              type="button"
              onClick={handleCopyRef}
              className="cq-copy-btn"
              aria-label="Copy booking reference"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {copiedRef ? (
                <>
                  <CheckIcon size={13} color="#2ECDBF" />
                  <span>Copied</span>
                </>
              ) : (
                'Copy'
              )}
            </button>
          </div>
          <span className="cq-payment-box-hint">Must be used as bank transfer narration</span>
        </div>

        {/* Financial Amounts */}
        <div className="cq-payment-amounts-card">
          <div className="cq-amount-deposit-box">
            <span className="cq-amount-meta-label">50% Deposit Due</span>
            <span className="cq-amount-meta-val cq-val-deposit">
              ₦{booking.deposit_amount?.toLocaleString() || '0'}
            </span>
            <span className="cq-amount-meta-sub">Pay now to initiate verification</span>
          </div>

          <div className="cq-amount-total-box">
            <span className="cq-amount-meta-label">Total Booking Amount</span>
            <span className="cq-amount-meta-val">
              ₦{booking.total_amount?.toLocaleString() || '0'}
            </span>
            <span className="cq-amount-meta-sub">Balance settled upon service completion</span>
          </div>
        </div>
      </div>

      {/* Customer & Booking Details Card */}
      <div className="cq-booking-meta-card" style={{ marginBottom: '24px' }}>
        <h4 className="cq-meta-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserIcon size={18} color="#2ECDBF" /> Customer & Service Details
        </h4>
        <dl className="cq-meta-list">
          <div className="cq-meta-row">
            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserIcon size={14} color="#888" /> Client Name
            </dt>
            <dd>{booking.customerName || '—'}</dd>
          </div>
          <div className="cq-meta-row">
            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PhoneIcon size={14} color="#888" /> Phone Number
            </dt>
            <dd>{booking.customerPhone || '—'}</dd>
          </div>
          {booking.customerWhatsapp && (
            <div className="cq-meta-row">
              <dt>WhatsApp</dt>
              <dd>{booking.customerWhatsapp}</dd>
            </div>
          )}
          {booking.customerEmail && (
            <div className="cq-meta-row">
              <dt>Email</dt>
              <dd>{booking.customerEmail}</dd>
            </div>
          )}
          <div className="cq-meta-row">
            <dt>Service</dt>
            <dd>{booking.service_name}</dd>
          </div>
          {booking.package_name && (
            <div className="cq-meta-row">
              <dt>Package</dt>
              <dd>{booking.package_name}</dd>
            </div>
          )}
          <div className="cq-meta-row">
            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarIcon size={14} color="#888" /> Scheduled Date
            </dt>
            <dd>{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('en-NG', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            }) : '—'}</dd>
          </div>
          {booking.scheduledTime && (
            <div className="cq-meta-row">
              <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClockIcon size={14} color="#888" /> Arrival Window
              </dt>
              <dd>{booking.scheduledTime}</dd>
            </div>
          )}
          <div className="cq-meta-row" style={{ gridColumn: 'span 2' }}>
            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPinIcon size={14} color="#888" /> Service Address
            </dt>
            <dd>{booking.serviceAddress || '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Official PalmPay Bank Details Card */}
      <BankDetailsCard reference={booking.reference} />

      {/* Status Page Link Box */}
      <div className="cq-status-link-card">
        <div className="cq-status-link-header">
          <span className="cq-status-link-tag">Booking Tracking Link</span>
          <p className="cq-status-link-desc">
            Save this link to view your booking progress, check verification status, or upload your
            receipt later:
          </p>
        </div>

        <div className="cq-status-link-input-row">
          <input
            type="text"
            readOnly
            value={statusFullUrl}
            className="cq-status-link-input"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="cq-btn cq-btn-primary cq-status-copy-btn"
            id="copy-status-link-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {copiedLink ? (
              <>
                <CheckIcon size={14} color="#102A29" />
                <span>Copied</span>
              </>
            ) : (
              'Copy Link'
            )}
          </button>
        </div>

        <div className="cq-status-link-actions">
          <Link
            to={statusPath}
            className="cq-status-direct-link"
          >
            Open Booking Status Page →
          </Link>
        </div>
      </div>

      {/* Receipt Upload Component */}
      <ReceiptUpload
        reference={booking.reference}
        accessToken={booking.access_token}
      />
    </div>
  );
};
