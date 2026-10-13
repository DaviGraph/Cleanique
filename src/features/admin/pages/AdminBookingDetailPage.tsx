import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getAdminBookingById,
  getReceiptUrl,
  verifyPayment,
  sendQuote,
  updateBookingStatus,
} from '../lib/adminApi';
import type { AdminBooking } from '../types';
import {
  PhoneIcon,
  MessageCircleIcon,
  MailIcon,
  AlertTriangleIcon,
  XIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
} from '../../booking/components/Icons';

export const AdminBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; filename: string; file_type: string } | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  // Payment Verification Panel State
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectField, setShowRejectField] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Quote Panel State
  const [quoteAmount, setQuoteAmount] = useState<string>('');
  const [quoteMessage, setQuoteMessage] = useState<string>('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  // Status Action State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBooking() {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await getAdminBookingById(id);
        if (isMounted) {
          if (data) {
            setBooking(data);
            if (data.deposit_amount && !data.amount_paid) {
              setReceivedAmount(data.deposit_amount.toString());
            }
          } else {
            setError('Booking not found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve booking.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Fetch receipt signed URL only on click
  const handleViewReceipt = async (storagePath: string, filename: string, fileType: string) => {
    try {
      setIsLoadingReceipt(true);
      const res = await getReceiptUrl(storagePath);
      setViewingReceipt({ url: res.url, filename, file_type: fileType });
    } catch {
      setActionError('Could not open receipt document. The signed URL may have expired.');
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  // Payment Verification Approval
  const handleApprovePayment = async () => {
    if (!booking) return;
    const num = parseFloat(receivedAmount);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid amount received in PalmPay.');
      return;
    }

    try {
      setIsVerifying(true);
      setActionError(null);
      const updated = await verifyPayment(booking.id, num, 'approve');
      setBooking(updated);
      setActionSuccess(
        `Payment verified successfully! Status updated to ${
          updated.payment_status === 'fully_paid' ? 'Fully Paid' : 'Partially Paid'
        }.`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Payment Verification Rejection
  const handleRejectPayment = async () => {
    if (!booking) return;
    if (!showRejectField) {
      setShowRejectField(true);
      return;
    }

    if (!rejectReason.trim()) {
      setActionError('A reason is required to reject payment.');
      return;
    }

    try {
      setIsVerifying(true);
      setActionError(null);
      const updated = await verifyPayment(booking.id, 0, 'reject', rejectReason);
      setBooking(updated);
      setActionSuccess('Payment marked as Rejected. Customer will need to resubmit proof.');
      setShowRejectField(false);
      setRejectReason('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject payment.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Send Quote
  const handleSendQuote = async () => {
    if (!booking) return;
    const num = parseFloat(quoteAmount);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid total quote amount.');
      return;
    }

    try {
      setIsSendingQuote(true);
      setActionError(null);
      const updated = await sendQuote(booking.id, num, quoteMessage);
      setBooking(updated);
      setActionSuccess(`Quote of ₦${num.toLocaleString()} issued successfully! Booking is now Awaiting Payment.`);
      setQuoteAmount('');
      setQuoteMessage('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send quote.');
    } finally {
      setIsSendingQuote(false);
    }
  };

  // Status change
  const handleStatusChange = async (newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    if (!booking) return;
    try {
      setIsUpdatingStatus(true);
      setActionError(null);
      const updated = await updateBookingStatus(booking.id, newStatus);
      setBooking(updated);
      setActionSuccess(`Booking status successfully transitioned to ${newStatus}.`);
      setShowCancelConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="cq-container cq-admin-container">
        <div className="cq-loading-state">
          <div className="cq-spinner" />
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="cq-container cq-admin-container">
        <div className="cq-admin-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="cq-error-msg">{error || 'Booking not found.'}</p>
          <Link to="/admin" className="cq-btn cq-btn-secondary" style={{ marginTop: '16px' }}>
            <ChevronLeftIcon size={14} /> Back to All Bookings
          </Link>
        </div>
      </div>
    );
  }

  const parsedReceived = parseFloat(receivedAmount) || 0;
  const isBelowDeposit =
    booking.deposit_amount && parsedReceived > 0 && parsedReceived < booking.deposit_amount;

  const depositCovered = (booking.amount_paid || 0) >= (booking.deposit_amount || 0);
  const canConfirm =
    depositCovered &&
    (booking.deposit_amount || 0) > 0 &&
    booking.booking_status !== 'confirmed' &&
    booking.booking_status !== 'completed' &&
    booking.booking_status !== 'cancelled';

  const canComplete = booking.booking_status === 'confirmed';

  // Resolve display values with safe fallbacks
  const displayName = booking.customer_name && booking.customer_name !== 'Client'
    ? booking.customer_name
    : '—';
  const displayAddress = booking.service_address || '—';

  return (
    <div className="cq-container cq-admin-container">
      {/* Breadcrumb */}
      <div className="cq-admin-detail-top">
        <Link to="/admin" className="cq-admin-back-link">
          <ChevronLeftIcon size={15} /> Back to Bookings List
        </Link>

        <div className="cq-admin-detail-ref-box">
          <span className="cq-admin-ref-tag">Booking Reference</span>
          <h1 className="cq-admin-detail-ref">{booking.reference}</h1>
        </div>
      </div>

      {actionSuccess && (
        <div className="cq-admin-alert-banner is-success" role="alert">
          <span>{actionSuccess}</span>
          <button type="button" onClick={() => setActionSuccess(null)} className="cq-alert-close">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="cq-admin-alert-banner is-error" role="alert">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="cq-alert-close">
            <XIcon size={14} />
          </button>
        </div>
      )}

      <div className="cq-admin-detail-grid">
        {/* Left Column */}
        <div className="cq-admin-detail-main">
          {/* 1. Customer & Service Summary */}
          <section className="cq-admin-card">
            <h2 className="cq-admin-card-title">Customer &amp; Service Overview</h2>

            <div className="cq-admin-fields-grid">
              <div className="cq-admin-field">
                <span className="cq-admin-field-label">Customer Name</span>
                <span className="cq-admin-field-val">{displayName}</span>
              </div>

              <div className="cq-admin-field">
                <span className="cq-admin-field-label">Phone Number</span>
                {booking.customer_phone ? (
                  <a href={`tel:${booking.customer_phone}`} className="cq-admin-phone-link">
                    {booking.customer_phone}
                  </a>
                ) : (
                  <span className="cq-admin-field-val">—</span>
                )}
              </div>

              {booking.customer_email && (
                <div className="cq-admin-field">
                  <span className="cq-admin-field-label">Email Address</span>
                  <a href={`mailto:${booking.customer_email}`} className="cq-admin-phone-link">
                    {booking.customer_email}
                  </a>
                </div>
              )}

              {booking.customer_whatsapp && (
                <div className="cq-admin-field">
                  <span className="cq-admin-field-label">WhatsApp</span>
                  <a
                    href={`https://wa.me/${booking.customer_whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="cq-admin-phone-link cq-whatsapp-link"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {booking.customer_whatsapp}
                  </a>
                </div>
              )}

              <div className="cq-admin-field">
                <span className="cq-admin-field-label">Service</span>
                <span className="cq-admin-field-val">{booking.service_name}</span>
              </div>

              {booking.package_name && (
                <div className="cq-admin-field">
                  <span className="cq-admin-field-label">Package</span>
                  <span className="cq-admin-field-val">{booking.package_name}</span>
                </div>
              )}

              <div className="cq-admin-field">
                <span className="cq-admin-field-label">Preferred Date &amp; Time</span>
                <span className="cq-admin-field-val">
                  {new Date(booking.scheduled_date).toLocaleDateString('en-NG', {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                  })}
                  {booking.scheduled_time && ` (${booking.scheduled_time})`}
                </span>
              </div>

              <div className="cq-admin-field" style={{ gridColumn: 'span 2' }}>
                <span className="cq-admin-field-label">Service Address</span>
                <span className="cq-admin-field-val">{displayAddress}</span>
              </div>

              {booking.notes && (
                <div className="cq-admin-field" style={{ gridColumn: 'span 2' }}>
                  <span className="cq-admin-field-label">Special Notes</span>
                  <p className="cq-admin-field-text">{booking.notes}</p>
                </div>
              )}

              {booking.quote_details && (
                <div className="cq-admin-field" style={{ gridColumn: 'span 2' }}>
                  <span className="cq-admin-field-label">Quote Request Details</span>
                  <p className="cq-admin-field-text">{booking.quote_details}</p>
                </div>
              )}
            </div>
          </section>

          {/* 2. Receipts Section */}
          <section className="cq-admin-card">
            <div className="cq-admin-card-header-row">
              <h2 className="cq-admin-card-title">Submitted Payment Receipts</h2>
              <span className="cq-badge cq-badge-turquoise">{booking.receipts.length} Attached</span>
            </div>

            {booking.receipts.length === 0 ? (
              <div className="cq-admin-receipts-empty">
                <p>No receipt uploaded yet for this booking.</p>
              </div>
            ) : (
              <div className="cq-admin-receipts-list">
                {booking.receipts.map((receipt) => (
                  <div key={receipt.id} className="cq-admin-receipt-row">
                    <div className="cq-receipt-meta-box">
                      <span className="cq-receipt-icon-tag">{receipt.file_type.toUpperCase()}</span>
                      <div>
                        <div className="cq-receipt-name">{receipt.filename}</div>
                        <div className="cq-receipt-time">
                          Uploaded {new Date(receipt.submitted_at).toLocaleString()} &bull; {receipt.file_size_formatted}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewReceipt(receipt.storage_path ?? '', receipt.filename, receipt.file_type)}
                      disabled={isLoadingReceipt}
                      className="cq-btn cq-btn-secondary cq-btn-sm"
                      id={`view-receipt-${receipt.id}`}
                    >
                      {isLoadingReceipt ? 'Loading...' : 'View Receipt'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Payment Verification Panel */}
          <section className="cq-admin-card cq-verify-card">
            <h2 className="cq-admin-card-title">PalmPay Payment Verification Panel</h2>
            <p className="cq-admin-card-desc">
              Cross-check the customer's transfer using narration <strong>{booking.reference}</strong>.
            </p>

            <div className="cq-verify-financials-bar">
              <div className="cq-verify-fin-col">
                <span className="cq-verify-fin-label">50% Deposit Required</span>
                <span className="cq-verify-fin-val cq-fin-deposit">
                  {booking.deposit_amount ? `₦${booking.deposit_amount.toLocaleString()}` : 'N/A'}
                </span>
              </div>

              <div className="cq-verify-fin-col">
                <span className="cq-verify-fin-label">Total Booking Rate</span>
                <span className="cq-verify-fin-val">
                  {booking.total_amount ? `₦${booking.total_amount.toLocaleString()}` : 'Custom Quote'}
                </span>
              </div>

              <div className="cq-verify-fin-col">
                <span className="cq-verify-fin-label">Total Verified Paid</span>
                <span className="cq-verify-fin-val cq-fin-paid">
                  ₦{(booking.amount_paid || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="cq-verify-form-area">
              <div className="cq-form-group">
                <label htmlFor="palmpay-amount-received" className="cq-form-label">
                  Amount received in PalmPay (₦) <span className="cq-req">*</span>
                </label>
                <input
                  id="palmpay-amount-received"
                  type="number"
                  min="0"
                  step="500"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="e.g. 17500"
                  className="cq-input"
                />
              </div>

              {isBelowDeposit && (
                <div className="cq-verify-warning-banner" role="alert">
                  <AlertTriangleIcon size={16} color="currentColor" />
                  <span>
                    <strong>Warning:</strong> Entered amount (₦{parsedReceived.toLocaleString()}) is below
                    the 50% deposit requirement (₦{booking.deposit_amount?.toLocaleString()}). Confirming
                    this booking will remain disabled until the deposit is fully met.
                  </span>
                </div>
              )}

              {showRejectField && (
                <div className="cq-form-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="reject-reason-input" className="cq-form-label">
                    Rejection Reason <span className="cq-req">* (Required)</span>
                  </label>
                  <textarea
                    id="reject-reason-input"
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Transfer slip blurry, transfer not found in PalmPay statement, incorrect narration..."
                    className="cq-textarea"
                  />
                </div>
              )}

              <div className="cq-verify-actions-row">
                <button
                  type="button"
                  onClick={handleApprovePayment}
                  disabled={isVerifying}
                  className="cq-btn cq-btn-primary cq-verify-btn"
                  id="approve-payment-btn"
                >
                  <CheckCircleIcon size={15} />
                  {isVerifying ? 'Verifying...' : 'Approve Payment'}
                </button>

                <button
                  type="button"
                  onClick={handleRejectPayment}
                  disabled={isVerifying}
                  className="cq-btn cq-btn-outline cq-verify-reject-btn"
                  id="reject-payment-btn"
                >
                  <XIcon size={14} />
                  {showRejectField ? 'Confirm Rejection' : 'Reject Payment'}
                </button>

                {showRejectField && (
                  <button
                    type="button"
                    onClick={() => setShowRejectField(false)}
                    className="cq-btn cq-btn-outline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 4. Quote Panel */}
          {booking.booking_status === 'quote_requested' && (
            <section className="cq-admin-card cq-quote-card">
              <h2 className="cq-admin-card-title">Commercial / Specialized Quote Panel</h2>
              <p className="cq-admin-card-desc">
                Review client space specifications and issue an itemized estimate. This will transition the booking to <strong>Pending Payment</strong> with a 50% deposit requirement.
              </p>

              {booking.quote_details && (
                <div className="cq-quote-spec-box">
                  <span className="cq-quote-spec-label">Customer's Space &amp; Scope Details</span>
                  <p className="cq-quote-spec-text">{booking.quote_details}</p>
                </div>
              )}

              <div className="cq-quote-inputs-grid">
                <div className="cq-form-group">
                  <label htmlFor="quote-total-amount" className="cq-form-label">
                    Total Estimated Amount (₦) <span className="cq-req">*</span>
                  </label>
                  <input
                    id="quote-total-amount"
                    type="number"
                    min="1000"
                    step="1000"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="e.g. 75000"
                    className="cq-input"
                  />
                  {parseFloat(quoteAmount) > 0 && (
                    <span className="cq-quote-calc-hint">
                      50% Deposit will be: ₦{(parseFloat(quoteAmount) * 0.5).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="cq-form-group">
                  <label htmlFor="quote-message-input" className="cq-form-label">
                    Message / Proposal Notes for Customer
                  </label>
                  <textarea
                    id="quote-message-input"
                    rows={3}
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    placeholder="e.g. Quote includes 4 industrial HEPA dust extractors, 3 surface specialists, and full trash haul-away."
                    className="cq-textarea"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendQuote}
                disabled={isSendingQuote}
                className="cq-btn cq-btn-primary cq-send-quote-btn"
                id="send-quote-btn"
              >
                {isSendingQuote ? 'Sending Quote...' : 'Send Quote to Customer'}
              </button>
            </section>
          )}
        </div>

        {/* Right Column: Status Controls & Timeline */}
        <aside className="cq-admin-detail-sidebar">
          {/* Status Controls */}
          <div className="cq-admin-card cq-status-controls-card">
            <h3 className="cq-admin-card-title">Booking Status Controls</h3>

            <div className="cq-admin-current-status-box">
              <span className="cq-status-meta-label">Current Booking Status</span>
              <div className="cq-status-meta-val">
                <span className="cq-badge cq-badge-teal">{booking.booking_status.replace(/_/g, ' ').toUpperCase()}</span>
              </div>

              <span className="cq-status-meta-label" style={{ marginTop: '12px' }}>Payment Status</span>
              <div className="cq-status-meta-val">
                <span className="cq-badge cq-badge-turquoise">{booking.payment_status.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
            </div>

            <div className="cq-admin-status-buttons-list">
              <div className="cq-status-btn-wrap">
                <button
                  type="button"
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={!canConfirm || isUpdatingStatus}
                  className="cq-btn cq-btn-primary cq-status-ctrl-btn"
                  id="confirm-booking-status-btn"
                >
                  Confirm Booking
                </button>
                {!depositCovered && booking.booking_status !== 'confirmed' && (
                  <span className="cq-status-btn-hint">
                    Disabled until verified payment covers deposit (₦{(booking.deposit_amount || 0).toLocaleString()}).
                  </span>
                )}
              </div>

              <div className="cq-status-btn-wrap">
                <button
                  type="button"
                  onClick={() => handleStatusChange('completed')}
                  disabled={!canComplete || isUpdatingStatus}
                  className="cq-btn cq-btn-secondary cq-status-ctrl-btn"
                  id="complete-booking-status-btn"
                >
                  Complete Service
                </button>
                {!canComplete && booking.booking_status !== 'completed' && (
                  <span className="cq-status-btn-hint">
                    Available only once booking is in Confirmed status.
                  </span>
                )}
              </div>

              <div className="cq-status-btn-wrap">
                {!showCancelConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={booking.booking_status === 'cancelled' || isUpdatingStatus}
                    className="cq-btn cq-btn-outline cq-status-cancel-btn"
                    id="cancel-booking-init-btn"
                  >
                    Cancel Booking
                  </button>
                ) : (
                  <div className="cq-cancel-confirm-box">
                    <p className="cq-cancel-confirm-text">
                      Are you sure you want to cancel this booking?
                    </p>
                    <div className="cq-cancel-confirm-actions">
                      <button
                        type="button"
                        onClick={() => handleStatusChange('cancelled')}
                        disabled={isUpdatingStatus}
                        className="cq-btn cq-btn-primary cq-cancel-confirm-yes"
                      >
                        Yes, Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="cq-btn cq-btn-outline"
                      >
                        No, Keep
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick contact links */}
            {(booking.customer_phone || booking.customer_whatsapp) && (
              <div className="cq-admin-quick-contact">
                <h4 className="cq-admin-card-title" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Quick Contact</h4>
                <div className="cq-admin-contact-links">
                  {booking.customer_phone && (
                    <a href={`tel:${booking.customer_phone}`} className="cq-contact-link cq-contact-phone">
                      <PhoneIcon size={14} /> Call Customer
                    </a>
                  )}
                  {booking.customer_whatsapp && (
                    <a
                      href={`https://wa.me/${booking.customer_whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="cq-contact-link cq-contact-whatsapp"
                    >
                      <MessageCircleIcon size={14} /> WhatsApp
                    </a>
                  )}
                  {booking.customer_email && (
                    <a href={`mailto:${booking.customer_email}`} className="cq-contact-link cq-contact-email">
                      <MailIcon size={14} /> Email
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="cq-admin-card cq-timeline-card">
            <h3 className="cq-admin-card-title">Activity Timeline</h3>

            {booking.timeline.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#666' }}>No activity logged yet.</p>
            ) : (
              <div className="cq-timeline-list">
                {booking.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="cq-timeline-item">
                    <div className="cq-timeline-marker">
                      <div className="cq-timeline-dot" />
                      {idx < booking.timeline.length - 1 && <div className="cq-timeline-line" />}
                    </div>
                    <div className="cq-timeline-body">
                      <div className="cq-timeline-header">
                        <span className="cq-timeline-title">{event.title}</span>
                        <span className="cq-timeline-time">
                          {new Date(event.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="cq-timeline-desc">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div className="cq-modal-overlay" onClick={() => setViewingReceipt(null)}>
          <div className="cq-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cq-modal-header">
              <h3 className="cq-modal-title">Receipt: {viewingReceipt.filename}</h3>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="cq-modal-close-btn"
                aria-label="Close modal"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="cq-modal-body">
              {viewingReceipt.file_type === 'pdf' ? (
                <iframe
                  src={viewingReceipt.url}
                  title="Receipt PDF"
                  className="cq-modal-receipt-pdf"
                  style={{ width: '100%', height: '500px', border: 'none' }}
                />
              ) : (
                <img
                  src={viewingReceipt.url}
                  alt="Receipt document"
                  className="cq-modal-receipt-img"
                />
              )}
            </div>

            <div className="cq-modal-footer">
              <a
                href={viewingReceipt.url}
                target="_blank"
                rel="noreferrer"
                className="cq-btn cq-btn-secondary"
              >
                Open in New Tab <ExternalLinkIcon size={13} />
              </a>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="cq-btn cq-btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
