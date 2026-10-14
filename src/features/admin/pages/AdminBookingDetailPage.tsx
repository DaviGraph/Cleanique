import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getAdminBookingById,
  createSignedReceiptUrl,
  ownerReviewPayment,
  ownerSetQuote,
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
} from '../../booking/components/Icons';

export const AdminBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Receipt Opening State
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

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

  // Click handler for View receipt — calls createSignedUrl ONLY on click, opens in new tab with noopener
  const handleViewReceiptClick = async (receiptPath: string, paymentId: string) => {
    if (!receiptPath) {
      setActionError('Receipt file path is missing.');
      return;
    }

    try {
      setLoadingReceiptId(paymentId);
      setActionError(null);

      const signedUrl = await createSignedReceiptUrl(receiptPath);

      // Open immediately in a new tab with noopener
      const newWin = window.open(signedUrl, '_blank', 'noopener,noreferrer');
      if (!newWin) {
        setActionError('Pop-up blocked. Please allow pop-ups for this site to view receipts.');
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not generate signed receipt URL.'
      );
    } finally {
      setLoadingReceiptId(null);
    }
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

  const phoneDigits = booking.customer_phone ? booking.customer_phone.replace(/[^0-9]/g, '') : '';
  const whatsappDigits = booking.customer_whatsapp ? booking.customer_whatsapp.replace(/[^0-9]/g, '') : phoneDigits;

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
                <span className="cq-admin-field-val">{booking.customer_name}</span>
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
                  <span className="cq-admin-field-val">—</span>
                )}
              </div>

              {/* Tappable WhatsApp Link */}
              <div className="cq-admin-field">
                <span className="cq-admin-field-label">WhatsApp</span>
                {whatsappDigits ? (
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cq-admin-phone-link cq-whatsapp-link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <MessageCircleIcon size={14} />
                    <span>{booking.customer_whatsapp || booking.customer_phone}</span>
                  </a>
                ) : (
                  <span className="cq-admin-field-val">—</span>
                )}
              </div>

              {booking.customer_email && (
                <div className="cq-admin-field">
                  <span className="cq-admin-field-label">Email Address</span>
                  <a href={`mailto:${booking.customer_email}`} className="cq-admin-phone-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MailIcon size={14} />
                    <span>{booking.customer_email}</span>
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
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {booking.scheduled_time && ` (${booking.scheduled_time})`}
                </span>
              </div>

              <div className="cq-admin-field" style={{ gridColumn: 'span 2' }}>
                <span className="cq-admin-field-label">Service Address</span>
                <span className="cq-admin-field-val">{booking.service_address || '—'}</span>
              </div>

              {booking.notes && (
                <div className="cq-admin-field" style={{ gridColumn: 'span 2' }}>
                  <span className="cq-admin-field-label">Notes</span>
                  <p className="cq-admin-field-text">{booking.notes}</p>
                </div>
              )}

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

          {/* Receipts Section (Lists every payments row for the booking) */}
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
                  <div key={payment.id} className="cq-admin-receipt-row" style={{ borderBottom: '1px solid #EAEAEA', padding: '12px 0' }}>
                    <div className="cq-receipt-meta-box">
                      <span className="cq-receipt-icon-tag">{payment.file_type.toUpperCase()}</span>
                      <div>
                        <div className="cq-receipt-name">
                          Submitted {new Date(payment.submitted_at).toLocaleString()}
                        </div>
                        <div className="cq-receipt-time">
                          Size: {payment.size_formatted} &bull; Status: <strong>{payment.status}</strong>
                          {payment.verified_amount > 0 && ` &bull; Verified: ₦${payment.verified_amount.toLocaleString()}`}
                          {payment.rejection_reason && ` &bull; Reason: ${payment.rejection_reason}`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewReceiptClick(payment.receipt_path, payment.id)}
                      disabled={loadingReceiptId === payment.id}
                      className="cq-btn cq-btn-secondary cq-btn-sm"
                      id={`view-receipt-btn-${payment.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {loadingReceiptId === payment.id ? (
                        'Generating URL...'
                      ) : (
                        <>
                          <span>View receipt</span>
                          <ExternalLinkIcon size={13} />
                        </>
                      )}
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

            {/* Tappable Contact Links */}
            <div className="cq-admin-quick-contact">
              <h4 className="cq-admin-card-title" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                Contact Customer
              </h4>
              <div className="cq-admin-contact-links" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {booking.customer_phone && (
                  <a href={`tel:${booking.customer_phone}`} className="cq-contact-link cq-contact-phone">
                    <PhoneIcon size={14} /> Call {booking.customer_phone}
                  </a>
                )}
                {whatsappDigits && (
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
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
    </div>
  );
};
