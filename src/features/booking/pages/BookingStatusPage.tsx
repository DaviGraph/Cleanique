import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  getBookingStatus,
  updateMockBookingStatus,
} from '../lib/bookingApi';
import type { BookingStatusResponse, BookingStatus } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BankDetailsCard } from '../components/BankDetailsCard';
import { ReceiptUpload } from '../components/ReceiptUpload';
import { SparklesIcon, ShieldCheckIcon, ClockIcon } from '../components/Icons';

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

  const handleStatusSwitch = (newStatus: BookingStatus) => {
    if (!reference) return;
    const updated = updateMockBookingStatus(reference, newStatus);
    setBooking(updated);
  };

  const handleCopyTrackingLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Status badge styling helper
  const getStatusBadgeClass = (status: BookingStatus) => {
    switch (status) {
      case 'pending_payment':
        return 'cq-status-badge-payment';
      case 'pending_verification':
        return 'cq-status-badge-verification';
      case 'confirmed':
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
          {/* Dev Mock Status Switcher */}
          <div className="cq-dev-status-toolbar">
            <span className="cq-dev-toolbar-title">🛠️ Dev Mode: Mock Status Switcher</span>
            <div className="cq-dev-status-buttons">
              <button
                type="button"
                className={`cq-dev-btn ${booking?.booking_status === 'pending_payment' ? 'is-active' : ''}`}
                onClick={() => handleStatusSwitch('pending_payment')}
              >
                Awaiting payment
              </button>
              <button
                type="button"
                className={`cq-dev-btn ${booking?.booking_status === 'pending_verification' ? 'is-active' : ''}`}
                onClick={() => handleStatusSwitch('pending_verification')}
              >
                Awaiting verification
              </button>
              <button
                type="button"
                className={`cq-dev-btn ${booking?.booking_status === 'confirmed' ? 'is-active' : ''}`}
                onClick={() => handleStatusSwitch('confirmed')}
              >
                Confirmed
              </button>
              <button
                type="button"
                className={`cq-dev-btn ${booking?.booking_status === 'cancelled' ? 'is-active' : ''}`}
                onClick={() => handleStatusSwitch('cancelled')}
              >
                Cancelled
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="cq-loading-state">
              <div className="cq-spinner" />
              <p>Fetching booking verification status...</p>
            </div>
          ) : error || !booking ? (
            <div className="cq-status-card cq-status-error-card">
              <p className="cq-error-msg">{error || 'Booking record could not be found.'}</p>
              <Link to="/book" className="cq-btn cq-btn-secondary" style={{ marginTop: '16px' }}>
                Create New Booking
              </Link>
            </div>
          ) : (
            <div className="cq-status-card">
              {/* Header with reference and status badge */}
              <div className="cq-status-card-header">
                <div className="cq-status-ref-wrap">
                  <span className="cq-status-ref-label">Booking Reference</span>
                  <h2 className="cq-status-ref-code">{booking.reference}</h2>
                </div>

                <div className="cq-status-badge-box">
                  <span className={`cq-status-pill ${getStatusBadgeClass(booking.booking_status)}`}>
                    <span className="cq-status-dot" />
                    {/* "Awaiting verification" is mapped from pending_verification */}
                    {booking.status_label}
                  </span>
                </div>
              </div>

              {/* Status Explanation Banner */}
              <div className="cq-status-banner-box">
                {booking.booking_status === 'pending_payment' && (
                  <div className="cq-status-info-banner cq-banner-pending-payment">
                    <ClockIcon size={22} color="#102A29" />
                    <div>
                      <div className="cq-banner-title">Awaiting Deposit Payment</div>
                      <div className="cq-banner-desc">
                        Please transfer the 50% deposit (₦{booking.deposit_amount?.toLocaleString()})
                        using your booking reference as narration, then upload your receipt below.
                      </div>
                    </div>
                  </div>
                )}

                {booking.booking_status === 'pending_verification' && (
                  <div className="cq-status-info-banner cq-banner-pending-verification">
                    <ShieldCheckIcon size={22} color="#102A29" />
                    <div>
                      <div className="cq-banner-title">Payment Details Under Verification</div>
                      <div className="cq-banner-desc">
                        {/* EXACT phrase required by AGENT_RULES.md */}
                        Your payment details have been submitted. Your booking will be confirmed after Cleanique verifies the payment.
                      </div>
                    </div>
                  </div>
                )}

                {booking.booking_status === 'confirmed' && (
                  <div className="cq-status-info-banner cq-banner-confirmed">
                    <SparklesIcon size={22} color="#102A29" />
                    <div>
                      <div className="cq-banner-title">Booking Verified & Confirmed</div>
                      <div className="cq-banner-desc">
                        Payment verification is complete. The Cleanique cleaning team will arrive at your
                        address on {booking.scheduled_date} ({booking.scheduled_time}).
                      </div>
                    </div>
                  </div>
                )}

                {booking.booking_status === 'cancelled' && (
                  <div className="cq-status-info-banner cq-banner-cancelled">
                    <div>
                      <div className="cq-banner-title">Booking Cancelled</div>
                      <div className="cq-banner-desc">
                        This booking has been cancelled or declined. For questions, please reach out
                        to Cleanique customer support.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Breakdown if applicable */}
              {booking.total_amount && booking.deposit_amount && (
                <div className="cq-status-amounts-box">
                  <div className="cq-status-amount-row">
                    <span className="cq-status-amount-label">50% Deposit Due</span>
                    <span className="cq-status-amount-val cq-status-val-deposit">
                      ₦{booking.deposit_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="cq-status-amount-row">
                    <span className="cq-status-amount-label">Total Booking Amount</span>
                    <span className="cq-status-amount-val">
                      ₦{booking.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* If still awaiting payment, provide Bank Details & Receipt Upload */}
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

              {/* Booking Details Summary */}
              <div className="cq-status-details-section">
                <h3 className="cq-status-section-title">Service Details</h3>
                <dl className="cq-meta-list">
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
                    <dt>Scheduled Date</dt>
                    <dd>{booking.scheduled_date}</dd>
                  </div>
                  {booking.scheduled_time && (
                    <div className="cq-meta-row">
                      <dt>Arrival Window</dt>
                      <dd>{booking.scheduled_time}</dd>
                    </div>
                  )}
                  <div className="cq-meta-row">
                    <dt>Client Name</dt>
                    <dd>{booking.customer_name}</dd>
                  </div>
                  <div className="cq-meta-row">
                    <dt>Client Phone</dt>
                    <dd>{booking.customer_phone}</dd>
                  </div>
                  <div className="cq-meta-row" style={{ gridColumn: 'span 2' }}>
                    <dt>Service Address</dt>
                    <dd>{booking.service_address}</dd>
                  </div>
                  {booking.receipt_filename && (
                    <div className="cq-meta-row" style={{ gridColumn: 'span 2' }}>
                      <dt>Submitted Receipt</dt>
                      <dd>📎 {booking.receipt_filename}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Tracking Link Copy Bar */}
              <div className="cq-status-footer-bar">
                <button
                  type="button"
                  onClick={handleCopyTrackingLink}
                  className="cq-btn cq-btn-outline"
                >
                  {copiedLink ? '✓ Tracking Link Copied' : 'Copy Tracking Link'}
                </button>
                <Link to="/" className="cq-btn cq-btn-secondary">
                  Return to Home
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
