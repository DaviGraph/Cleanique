import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getAdminBookingById,
  createSignedReceiptUrl,
  ownerReviewPayment,
  ownerSetQuote,
  updateBookingStatus,
  updatePaymentStatus,
} from '../lib/adminApi';
import type { AdminBooking, PaymentRow } from '../types';
import {
  PhoneIcon,
  MessageCircleIcon,
  MailIcon,
  XIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  PaperclipIcon,
} from '../../booking/components/Icons';

interface ActiveReceiptModal {
  paymentId: string;
  receiptPath: string;
  fileType: 'image' | 'pdf';
  submittedAt: string;
  sizeFormatted: string;
}

export const AdminBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Receipt Modal State
  const [activeModalReceipt, setActiveModalReceipt] = useState<ActiveReceiptModal | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isFetchingSignedUrl, setIsFetchingSignedUrl] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Payment Verification Panel State
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectField, setShowRejectField] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Quote Panel State
  const [quoteAmount, setQuoteAmount] = useState<string>('');
  const [quoteMessage, setQuoteMessage] = useState<string>('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  // Direct Status Override State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
            if (data.deposit_amount) {
              setReceivedAmount(data.deposit_amount.toString());
            }
            if (data.payments && data.payments.length > 0) {
              setSelectedPaymentId(data.payments[0].id);
            }
          } else {
            setError('Booking not found in database.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve booking details.');
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

  // Handle Escape key to close modal
  useEffect(() => {
    if (!activeModalReceipt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeReceiptModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModalReceipt]);

  // Click handler for View receipt — calls createSignedUrl ONLY inside click handler
  const handleOpenReceiptModal = async (payment: PaymentRow) => {
    if (!payment.receipt_path) {
      setActionError('Receipt file path is missing.');
      return;
    }

    const modalData: ActiveReceiptModal = {
      paymentId: payment.id,
      receiptPath: payment.receipt_path,
      fileType: payment.file_type,
      submittedAt: payment.submitted_at,
      sizeFormatted: payment.size_formatted,
    };

    setActiveModalReceipt(modalData);
    setSignedUrl(null);
    setModalError(null);
    setIsFetchingSignedUrl(true);

    try {
      const url = await createSignedReceiptUrl(payment.receipt_path);
      setSignedUrl(url);
    } catch (err) {
      // Display real error message if createSignedUrl fails
      setModalError(err instanceof Error ? err.message : 'Failed to generate signed receipt URL.');
    } finally {
      setIsFetchingSignedUrl(false);
    }
  };

  const closeReceiptModal = () => {
    setActiveModalReceipt(null);
    setSignedUrl(null); // Drop reference to revoke
    setModalError(null);
  };

  const reloadBooking = async () => {
    if (!id) return;
    const refreshed = await getAdminBookingById(id);
    if (refreshed) {
      setBooking(refreshed);
      if (refreshed.payments && refreshed.payments.length > 0) {
        setSelectedPaymentId(refreshed.payments[0].id);
      }
    }
  };

  // Payment Verification Approval
  const handleApprovePayment = async () => {
    if (!booking) return;

    const num = parseFloat(receivedAmount);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid amount received in PalmPay (₦).');
      return;
    }

    const payId = selectedPaymentId || (booking.payments && booking.payments[0]?.id) || booking.id;

    try {
      setIsVerifying(true);
      setActionError(null);
      await ownerReviewPayment({
        paymentId: payId,
        approve: true,
        verifiedAmount: num,
      });

      await reloadBooking();
      setActionSuccess(`Payment of ₦${num.toLocaleString()} approved successfully in database!`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Payment verification approval failed.');
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
      setActionError('Rejection reason is required to reject a payment.');
      return;
    }

    const payId = selectedPaymentId || (booking.payments && booking.payments[0]?.id) || booking.id;

    try {
      setIsVerifying(true);
      setActionError(null);
      await ownerReviewPayment({
        paymentId: payId,
        approve: false,
        verifiedAmount: 0,
        reason: rejectReason.trim(),
      });

      await reloadBooking();
      setActionSuccess('Payment rejected successfully. Rejection reason recorded in database.');
      setShowRejectField(false);
      setRejectReason('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Payment rejection failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Send Quote
  const handleSendQuote = async () => {
    if (!booking) return;

    const num = parseFloat(quoteAmount);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid quote amount.');
      return;
    }

    try {
      setIsSendingQuote(true);
      setActionError(null);
      await ownerSetQuote({
        bookingId: booking.id,
        amount: num,
        message: quoteMessage.trim(),
      });

      await reloadBooking();
      setActionSuccess(`Quote of ₦${num.toLocaleString()} saved in database and issued to booking.`);
      setQuoteAmount('');
      setQuoteMessage('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to issue quote.');
    } finally {
      setIsSendingQuote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="cq-container cq-admin-container">
        <div className="cq-loading-state">
          <div className="cq-spinner" />
          <p>Loading booking details from Supabase...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="cq-container cq-admin-container">
        <div className="cq-admin-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="cq-error-msg">{error || 'Booking record not found in database.'}</p>
          <Link to="/admin" className="cq-btn cq-btn-secondary" style={{ marginTop: '16px' }}>
            <ChevronLeftIcon size={14} /> Back to All Bookings
          </Link>
        </div>
      </div>
    );
  }

  const rawWaNumber = booking.customer_whatsapp || booking.customer_phone || '';
  const normalizeWhatsAppNumber = (numStr: string): string => {
    if (!numStr) return '';
    let cleaned = numStr.replace(/[\s\-]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1);
    }
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.slice(1);
    }
    return cleaned;
  };

  const normalizedWaNumber = normalizeWhatsAppNumber(rawWaNumber);

  const getWhatsAppMessage = (b: AdminBooking): string => {
    const name = b.customer_name || 'Client';
    const ref = b.reference;

    if (b.payment_status === 'fully_paid' || b.payment_status === 'partially_paid') {
      const amountPaid = (b.amount_paid || 0).toLocaleString();
      return `Hello ${name}, Cleanique has verified your payment of ₦${amountPaid} for booking ${ref}. We will confirm your appointment shortly.`;
    }

    if (b.payment_status === 'rejected') {
      return `Hello ${name}, we could not verify the receipt for booking ${ref}. Please send a clear screenshot of your transfer.`;
    }

    if (b.booking_status === 'confirmed') {
      return `Hello ${name}, your Cleanique booking ${ref} is confirmed for ${b.scheduled_date}.`;
    }

    return `Hello ${name}, regarding your Cleanique booking ${ref}.`;
  };

  const waMessage = getWhatsAppMessage(booking);

  const isModalPdf = activeModalReceipt
    ? activeModalReceipt.fileType.toLowerCase().includes('pdf') ||
      activeModalReceipt.receiptPath.toLowerCase().endsWith('.pdf')
    : false;

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
          {/* Customer & Service Overview */}
          <section className="cq-admin-card">
            <h2 className="cq-admin-card-title">Customer &amp; Service Details</h2>

            <div className="cq-admin-fields-grid">
              <div className="cq-admin-field">
                <span className="cq-admin-field-label">Customer Name</span>
                <span className="cq-admin-field-val">{booking.customer_name || 'Not provided'}</span>
              </div>

              {/* Tappable Phone Link */}
              <div className="cq-admin-field">
                <span className="cq-admin-field-label">Phone Number</span>
                {booking.customer_phone ? (
                  <a href={`tel:${booking.customer_phone}`} className="cq-admin-phone-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <PhoneIcon size={14} />
                    <span>{booking.customer_phone}</span>
                  </a>
                ) : (
                  <span className="cq-admin-field-val">Not provided</span>
                )}
              </div>

              {/* Tappable WhatsApp Link & Button */}
              <div className="cq-admin-field">
                <span className="cq-admin-field-label">WhatsApp</span>
                {normalizedWaNumber ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href={`https://wa.me/${normalizedWaNumber}?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cq-admin-phone-link cq-whatsapp-link"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <MessageCircleIcon size={14} />
                      <span>{booking.customer_whatsapp || booking.customer_phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${normalizedWaNumber}?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cq-btn cq-btn-secondary cq-btn-sm"
                      id="msg-on-whatsapp-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      <MessageCircleIcon size={13} />
                      <span>Message on WhatsApp</span>
                    </a>
                  </div>
                ) : (
                  <span className="cq-admin-field-val">Not provided</span>
                )}
              </div>

              <div className="cq-admin-field">
                <span className="cq-admin-field-label">Email Address</span>
                {booking.customer_email ? (
                  <a href={`mailto:${booking.customer_email}`} className="cq-admin-phone-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MailIcon size={14} />
                    <span>{booking.customer_email}</span>
                  </a>
                ) : (
                  <span className="cq-admin-field-val">Not provided</span>
                )}
              </div>

              <div className="cq-admin-field">
                <span className="cq-admin-field-label">Service</span>
                <span className="cq-admin-field-val">{booking.service_name || 'Not provided'}</span>
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
                  {booking.scheduled_date ? (
                    <>
                      {new Date(booking.scheduled_date).toLocaleDateString('en-NG', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {booking.scheduled_time && ` (${booking.scheduled_time})`}
                    </>
                  ) : (
                    'Not provided'
                  )}
                </span>
              </div>

              <div className="cq-admin-field" style={{ gridColumn: 'span 2' }}>
                <span className="cq-admin-field-label">Service Address</span>
                <span className="cq-admin-field-val">{booking.service_address || 'Not provided'}</span>
              </div>

              <div className="cq-admin-field" style={{ gridColumn: 'span 2' }}>
                <span className="cq-admin-field-label">Notes</span>
                <span className="cq-admin-field-val">
                  {booking.notes || 'Not provided'}
                </span>
              </div>

              {booking.quote_details && (
                <div className="cq-admin-field" style={{ gridColumn: 'span 2' }}>
                  <span className="cq-admin-field-label">Space &amp; Scope Specifications</span>
                  <p className="cq-admin-field-text">{booking.quote_details}</p>
                </div>
              )}
            </div>
          </section>

          {/* Booked Items List */}
          {booking.items && booking.items.length > 0 && (
            <section className="cq-admin-card">
              <h2 className="cq-admin-card-title">Booked Items ({booking.items.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {booking.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#F5F9F8',
                      borderRadius: '8px',
                      border: '1px solid #E0ECE8',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#102A29' }}>
                      {item.quantity}x {item.name}
                    </span>
                    <span style={{ color: '#2ECDBF', fontWeight: 700 }}>
                      {item.formattedPrice}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Receipts Section with File Type, Size, and Submitted Time metadata */}
          <section className="cq-admin-card">
            <div className="cq-admin-card-header-row">
              <h2 className="cq-admin-card-title">Submitted Receipts</h2>
              <span className="cq-badge cq-badge-turquoise">
                {booking.payments ? booking.payments.length : 0} Record(s)
              </span>
            </div>

            {!booking.payments || booking.payments.length === 0 ? (
              <div className="cq-admin-receipts-empty" style={{ padding: '24px 0' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#667' }}>No receipt uploaded yet</p>
              </div>
            ) : (
              <div className="cq-admin-receipts-list">
                {booking.payments.map((payment: PaymentRow) => (
                  <div
                    key={payment.id}
                    className="cq-admin-receipt-row"
                    style={{
                      borderBottom: '1px solid #EAEAEA',
                      padding: '14px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div className="cq-receipt-meta-box">
                      <span className="cq-receipt-icon-tag">{payment.file_type.toUpperCase()}</span>
                      <div>
                        <div className="cq-receipt-name">
                          Submitted {new Date(payment.submitted_at).toLocaleString()}
                        </div>
                        <div className="cq-receipt-time">
                          Type: <strong>{payment.file_type.toUpperCase()}</strong> &bull; Size: <strong>{payment.size_formatted}</strong> &bull; Status: <strong>{payment.status}</strong>
                          {payment.verified_amount > 0 && ` &bull; Verified: ₦${payment.verified_amount.toLocaleString()}`}
                          {payment.rejection_reason && ` &bull; Reason: ${payment.rejection_reason}`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenReceiptModal(payment)}
                      className="cq-btn cq-btn-secondary cq-btn-sm"
                      id={`view-receipt-btn-${payment.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <PaperclipIcon size={14} />
                      <span>View receipt</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Payment Verification Panel */}
          <section className="cq-admin-card cq-verify-card">
            <h2 className="cq-admin-card-title">PalmPay Payment Verification Panel</h2>
            <p className="cq-admin-card-desc">
              Cross-check incoming PalmPay transfer for reference <strong>{booking.reference}</strong>.
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
                <span className="cq-verify-fin-label">Total Verified Amount</span>
                <span className="cq-verify-fin-val cq-fin-paid">
                  ₦{(booking.amount_paid || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="cq-verify-form-area">
              <div className="cq-form-group">
                <label htmlFor="palmpay-amount-received" className="cq-form-label">
                  Amount received in PalmPay (₦) <span className="cq-req">* (Required)</span>
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

              {showRejectField && (
                <div className="cq-form-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="reject-reason-input" className="cq-form-label">
                    Rejection Reason <span className="cq-req">* (Required for rejection)</span>
                  </label>
                  <textarea
                    id="reject-reason-input"
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Transfer not reflected in PalmPay account statement, incorrect narration..."
                    className="cq-textarea"
                  />
                </div>
              )}

              <div className="cq-verify-actions-row" style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleApprovePayment}
                  disabled={isVerifying}
                  className="cq-btn cq-btn-primary cq-verify-btn"
                  id="approve-payment-btn"
                >
                  <CheckCircleIcon size={15} />
                  {isVerifying ? 'Processing...' : 'Approve Payment'}
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

          {/* Quote Panel */}
          {booking.booking_status === 'quote_requested' && (
            <section className="cq-admin-card cq-quote-card">
              <h2 className="cq-admin-card-title">Commercial / Specialized Quote Panel</h2>
              <p className="cq-admin-card-desc">
                Set total rate for this quote request. This calls owner_set_quote in Supabase.
              </p>

              <div className="cq-quote-inputs-grid">
                <div className="cq-form-group">
                  <label htmlFor="quote-total-amount" className="cq-form-label">
                    Total Estimated Rate (₦) <span className="cq-req">*</span>
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
                </div>

                <div className="cq-form-group">
                  <label htmlFor="quote-message-input" className="cq-form-label">
                    Proposal Note for Customer
                  </label>
                  <textarea
                    id="quote-message-input"
                    rows={3}
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    placeholder="e.g. Includes 3 surface specialists and full eco-disinfection package..."
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
                {isSendingQuote ? 'Submitting Quote...' : 'Set Quote in Database'}
              </button>
            </section>
          )}
        </div>

        {/* Right Sidebar Status Cards */}
        <aside className="cq-admin-detail-sidebar">
          <div className="cq-admin-card cq-status-controls-card">
            <h3 className="cq-admin-card-title">Booking Status</h3>

            <div className="cq-admin-current-status-box" style={{ marginBottom: '16px' }}>
              <span className="cq-status-meta-label">Booking Status</span>
              <div className="cq-status-meta-val" style={{ marginTop: '4px' }}>
                <span className="cq-badge cq-badge-teal">
                  {booking.booking_status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              <span className="cq-status-meta-label" style={{ marginTop: '12px' }}>Payment Status</span>
              <div className="cq-status-meta-val" style={{ marginTop: '4px' }}>
                <span className="cq-badge cq-badge-turquoise">
                  {booking.payment_status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Direct Status Management Controls */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E0ECE8' }}>
              <h4 className="cq-admin-card-title" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
                Update Booking Status
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select
                  value={booking.booking_status}
                  disabled={isUpdatingStatus}
                  onChange={async (e) => {
                    const newSt = e.target.value;
                    try {
                      setIsUpdatingStatus(true);
                      setActionError(null);
                      await updateBookingStatus(booking.id, newSt);
                      await reloadBooking();
                      setActionSuccess(`Booking status updated to ${newSt.replace(/_/g, ' ')}!`);
                    } catch (err) {
                      setActionError(err instanceof Error ? err.message : 'Failed to update status.');
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}
                  className="cq-select"
                  style={{ fontSize: '0.88rem' }}
                >
                  <option value="pending_payment">Pending Payment</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="quote_requested">Quote Requested</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <label className="cq-admin-field-label" style={{ marginTop: '8px' }}>Update Payment Status</label>
                <select
                  value={booking.payment_status}
                  disabled={isUpdatingStatus}
                  onChange={async (e) => {
                    const newPaySt = e.target.value;
                    try {
                      setIsUpdatingStatus(true);
                      setActionError(null);
                      await updatePaymentStatus(booking.id, newPaySt);
                      await reloadBooking();
                      setActionSuccess(`Payment status updated to ${newPaySt.replace(/_/g, ' ')}!`);
                    } catch (err) {
                      setActionError(err instanceof Error ? err.message : 'Failed to update payment status.');
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}
                  className="cq-select"
                  style={{ fontSize: '0.88rem' }}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Tappable Contact Links */}
            <div className="cq-admin-quick-contact" style={{ marginTop: '20px' }}>
              <h4 className="cq-admin-card-title" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                Contact Customer
              </h4>
              <div className="cq-admin-contact-links" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {booking.customer_phone && (
                  <a href={`tel:${booking.customer_phone}`} className="cq-contact-link cq-contact-phone">
                    <PhoneIcon size={14} /> Call {booking.customer_phone}
                  </a>
                )}
                {normalizedWaNumber && (
                  <a
                    href={`https://wa.me/${normalizedWaNumber}?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cq-contact-link cq-contact-whatsapp"
                  >
                    <MessageCircleIcon size={14} /> WhatsApp ({booking.customer_whatsapp || booking.customer_phone})
                  </a>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* RECEIPT VIEWER IN-PAGE MODAL */}
      {activeModalReceipt && (
        <div className="cq-modal-overlay" onClick={closeReceiptModal}>
          <div
            className="cq-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Payment Receipt Modal"
          >
            {/* Modal Header */}
            <div className="cq-modal-header">
              <div>
                <h3 className="cq-modal-title">Payment Receipt Preview</h3>
                <div style={{ fontSize: '0.78rem', color: '#667', marginTop: '2px' }}>
                  Type: <strong>{activeModalReceipt.fileType.toUpperCase()}</strong> &bull; Size: <strong>{activeModalReceipt.sizeFormatted}</strong> &bull; Submitted: {new Date(activeModalReceipt.submittedAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={closeReceiptModal}
                className="cq-modal-close-btn"
                aria-label="Close modal"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="cq-modal-body">
              {isFetchingSignedUrl ? (
                <div className="cq-loading-state" style={{ padding: '40px 0' }}>
                  <div className="cq-spinner" />
                  <p>Generating secure receipt link...</p>
                </div>
              ) : modalError ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  {/* Show exact real error message if createSignedUrl fails */}
                  <p className="cq-error-msg" style={{ marginBottom: '16px' }}>{modalError}</p>
                  <button
                    type="button"
                    onClick={() => handleOpenReceiptModal({
                      id: activeModalReceipt.paymentId,
                      receipt_path: activeModalReceipt.receiptPath,
                      file_type: activeModalReceipt.fileType,
                      submitted_at: activeModalReceipt.submittedAt,
                      size_formatted: activeModalReceipt.sizeFormatted,
                      size: 0,
                      status: 'pending',
                      verified_amount: 0,
                      rejection_reason: null,
                    })}
                    className="cq-btn cq-btn-secondary"
                  >
                    Retry
                  </button>
                </div>
              ) : signedUrl ? (
                isModalPdf ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <iframe
                      src={signedUrl}
                      title="Receipt PDF Preview"
                      style={{
                        width: '100%',
                        height: '60dvh',
                        border: '1px solid #DCE5E3',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                      }}
                    />
                    <a
                      href={signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cq-btn cq-btn-outline"
                      style={{ fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLinkIcon size={14} />
                      <span>Open PDF</span>
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <img
                      src={signedUrl}
                      alt="Payment Receipt"
                      className="cq-modal-receipt-img"
                      style={{
                        maxHeight: '80dvh',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      }}
                    />
                  </div>
                )
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="cq-modal-footer">
              {signedUrl && (
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cq-btn cq-btn-secondary"
                  id="modal-open-new-tab-link"
                  style={{ fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLinkIcon size={14} />
                  <span>Open in new tab</span>
                </a>
              )}

              <button
                type="button"
                onClick={closeReceiptModal}
                className="cq-btn cq-btn-outline"
                style={{ fontSize: '0.88rem' }}
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
