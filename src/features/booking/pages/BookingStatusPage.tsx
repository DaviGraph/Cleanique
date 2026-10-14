import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getBookingStatus } from '../lib/bookingApi';
import type { BookingStatusResponse, BookingStatus } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BankDetailsCard } from '../components/BankDetailsCard';
import { ReceiptUpload } from '../components/ReceiptUpload';
import {
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  PaperclipIcon,
  CheckIcon,
  RefreshCwIcon,
  CopyIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
} from '../components/Icons';

export const BookingStatusPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || '';

  const [booking, setBooking] = useState<BookingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      if (!reference) return;
      try {
        setIsLoading(true);
        const data = await getBookingStatus(reference, token);
        if (isMounted) {
          setBooking(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve booking status.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [reference, token]);

  const handleRefreshStatus = async () => {
    if (!reference) return;
    try {
      setIsLoading(true);
      const data = await getBookingStatus(reference, token);
      setBooking(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve booking status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTrackingLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const getStatusBadgeClass = (status: BookingStatus | string) => {
    switch (status) {
      case 'pending_payment':
        return 'cq-status-badge-payment';
      case 'pending_verification':
        return 'cq-status-badge-verification';
      case 'confirmed':
      case 'completed':
        return 'cq-status-badge-confirmed';
      case 'cancelled':
        return 'cq-status-badge-cancelled';
      default:
        return 'cq-status-badge-verification';
    }
  };

  return (
    <div className="cq-page-wrapper">
      <Navbar />

      <main className="cq-status-page-main">
        <div className="cq-container">
          {isLoading ? (
            <div className="cq-loading-state">
              <div className="cq-spinner" />
              <p>Fetching booking verification status...</p>
            </div>
          ) : error || !booking ? (
            <div className="cq-status-card cq-status-error-card">
              <p className="cq-error-msg">{error || 'Booking record could not be found.'}</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                Please verify that you are using the exact tracking link provided during booking confirmation.
              </p>
              <Link to="/book" className="cq-btn cq-btn-secondary" style={{ marginTop: '16px' }}>
                Create New Booking
              </Link>
            </div>
          ) : (
            <div className="cq-status-card">
              {/* Header with reference code and mapped status badge */}
              <div className="cq-status-card-header">
                <div className="cq-status-ref-wrap">
                  <span className="cq-status-ref-label">Booking Reference</span>
                  <h2 className="cq-status-ref-code">{booking.reference}</h2>
                </div>

                <div className="cq-status-badge-box">
                  <span className={`cq-status-pill ${getStatusBadgeClass(booking.booking_status)}`}>
                    <span className="cq-status-dot" />
                    {booking.status_label}
                  </span>

                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    className="cq-refresh-btn"
                    title="Refresh booking status"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCwIcon size={13} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="cq-status-banner-box">
                {booking.booking_status === 'pending_payment' && (
                  <div className="cq-status-info-banner cq-banner-pending-payment">
                    <ClockIcon size={22} color="#102A29" />
                    <div>
                      <div className="cq-banner-title">Awaiting Deposit Payment</div>
                      <div className="cq-banner-desc">
                        Please transfer the 50% initial deposit (₦
                        {booking.deposit_amount?.toLocaleString() || '0'}) using reference{' '}
                        <strong>{booking.reference}</strong> as narration, then attach your receipt below.
                      </div>
                    </div>
                  </div>
                )}

                {booking.booking_status === 'pending_verification' && (
                  <div className="cq-status-info-banner cq-banner-pending-verification">
                    <ShieldCheckIcon size={22} color="#102A29" />
                    <div>
                      <div className="cq-banner-title">Awaiting Verification</div>
                      <div className="cq-banner-desc">
                        {/* EXACT phrase mandated by AGENT_RULES.md */}
                        Your payment details have been submitted. Your booking will be confirmed after Cleanique verifies the payment.
                      </div>
                    </div>
                  </div>
                )}

                {booking.booking_status === 'confirmed' && (
                  <div className="cq-status-info-banner cq-banner-confirmed">
                    <SparklesIcon size={22} color="#102A29" />
                    <div>
                      <div className="cq-banner-title">Booking Verified &amp; Confirmed</div>
                      <div className="cq-banner-desc">
                        Payment verification is complete. The Cleanique cleaning team is scheduled for{' '}
                        {new Date(booking.scheduled_date).toLocaleDateString('en-NG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        {booking.scheduled_time && `(${booking.scheduled_time})`}.
                      </div>
                    </div>
                  </div>
                )}

                {booking.booking_status === 'completed' && (
                  <div className="cq-status-info-banner cq-banner-confirmed">
                    <SparklesIcon size={22} color="#102A29" />
                    <div>
                      <div className="cq-banner-title">Cleaning Service Completed</div>
                      <div className="cq-banner-desc">
                        Your cleaning session has been completed. Thank you for choosing Cleanique!
                      </div>
                    </div>
                  </div>
                )}

                {booking.booking_status === 'cancelled' && (
                  <div className="cq-status-info-banner cq-banner-cancelled">
                    <div>
                      <div className="cq-banner-title">Booking Cancelled</div>
                      <div className="cq-banner-desc">
                        This booking has been cancelled. For further assistance, please contact Cleanique support.
                      </div>
                    </div>
                  </div>
                )}

                {booking.quote_message && (
                  <div className="cq-status-info-banner" style={{ marginTop: '12px', background: 'rgba(46,205,191,0.08)', borderColor: '#2ECDBF' }}>
                    <div>
                      <div className="cq-banner-title">Cleanique Quote Proposal</div>
                      <div className="cq-banner-desc">{booking.quote_message}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Server Financial Totals */}
              {booking.total_amount && booking.deposit_amount && (
                <div className="cq-status-amounts-box">
                  <div className="cq-status-amount-row">
                    <span className="cq-status-amount-label">50% Deposit Required</span>
                    <span className="cq-status-amount-val cq-status-val-deposit">
                      ₦{booking.deposit_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="cq-status-amount-row">
                    <span className="cq-status-amount-label">Total Server Rate</span>
                    <span className="cq-status-amount-val">
                      ₦{booking.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Prominent Save Status Link Button */}
              <div className="cq-status-link-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#102A29', fontSize: '0.98rem' }}>
                      Save your status link
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#556' }}>
                      Use this link anytime to check your payment verification status and updates.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyTrackingLink}
                    className="cq-btn cq-btn-primary"
                    id="save-status-link-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
                  >
                    {copiedLink ? (
                      <>
                        <CheckIcon size={16} color="#102A29" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon size={16} />
                        <span>Save status link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bank Details & Receipt Upload for Awaiting Payment */}
              {booking.booking_status === 'pending_payment' && (
                <>
                  <BankDetailsCard reference={booking.reference} />
                  <ReceiptUpload
                    reference={booking.reference}
                    accessToken={booking.access_token}
                    onUploadSuccess={handleRefreshStatus}
                  />
                </>
              )}

              {/* Show attached receipt info if pending verification */}
              {booking.booking_status === 'pending_verification' && booking.receipt_filename && (
                <div className="cq-status-receipt-submitted" style={{ marginBottom: '24px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <PaperclipIcon size={16} color="#2ECDBF" />
                    <span>Receipt submitted: <strong>{booking.receipt_filename}</strong></span>
                  </span>
                  {booking.receipt_uploaded_at && (
                    <span className="cq-receipt-time-sub">
                      on {new Date(booking.receipt_uploaded_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Booked Items (Loaded via get_booking_items RPC) */}
              <div className="cq-status-details-section">
                <h3 className="cq-status-section-title">Booked Cleaning Items</h3>

                {booking.items && booking.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
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
                ) : (
                  <p style={{ fontSize: '0.88rem', color: '#667', marginBottom: '20px' }}>
                    {booking.service_name} {booking.package_name ? `(${booking.package_name})` : ''}
                  </p>
                )}

                {/* Customer Details */}
                <h3 className="cq-status-section-title">Customer Details</h3>
                <dl className="cq-meta-list">
                  <div className="cq-meta-row">
                    <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={14} color="#888" /> Name
                    </dt>
                    <dd>{booking.customer_name}</dd>
                  </div>
                  <div className="cq-meta-row">
                    <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PhoneIcon size={14} color="#888" /> Phone
                    </dt>
                    <dd>{booking.customer_phone}</dd>
                  </div>
                  {booking.customer_email && (
                    <div className="cq-meta-row">
                      <dt>Email</dt>
                      <dd>{booking.customer_email}</dd>
                    </div>
                  )}
                  {booking.customer_whatsapp && (
                    <div className="cq-meta-row">
                      <dt>WhatsApp</dt>
                      <dd>{booking.customer_whatsapp}</dd>
                    </div>
                  )}
                  <div className="cq-meta-row">
                    <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarIcon size={14} color="#888" /> Scheduled Date
                    </dt>
                    <dd>
                      {new Date(booking.scheduled_date).toLocaleDateString('en-NG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                  {booking.scheduled_time && (
                    <div className="cq-meta-row">
                      <dt>Arrival Window</dt>
                      <dd>{booking.scheduled_time}</dd>
                    </div>
                  )}
                  <div className="cq-meta-row" style={{ gridColumn: 'span 2' }}>
                    <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPinIcon size={14} color="#888" /> Service Address
                    </dt>
                    <dd>{booking.service_address}</dd>
                  </div>
                  {booking.quote_details && (
                    <div className="cq-meta-row" style={{ gridColumn: 'span 2' }}>
                      <dt>Space Details</dt>
                      <dd>{booking.quote_details}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Navigation Actions */}
              <div className="cq-status-footer-bar">
                <Link to="/" className="cq-btn cq-btn-secondary">
                  Return to Home
                </Link>
                <Link to="/book" className="cq-btn cq-btn-outline">
                  Book Another Service
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
