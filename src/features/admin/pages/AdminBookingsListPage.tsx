import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminBookings } from '../lib/adminApi';
import type { AdminBooking, AdminBookingStatus, PaymentStatus } from '../types';

export const AdminBookingsListPage: React.FC = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const data = await getAdminBookings({
          bookingStatus: bookingStatusFilter,
          paymentStatus: paymentStatusFilter,
          searchQuery: searchQuery,
        });
        if (isMounted) {
          setBookings(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load bookings.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [bookingStatusFilter, paymentStatusFilter, searchQuery]);

  // Status badge helpers
  const getBookingStatusBadge = (status: AdminBookingStatus) => {
    switch (status) {
      case 'pending_verification':
        return <span className="cq-admin-pill cq-pill-verification">Pending Verification</span>;
      case 'quote_requested':
        return <span className="cq-admin-pill cq-pill-quote">Quote Requested</span>;
      case 'pending_payment':
        return <span className="cq-admin-pill cq-pill-pending-payment">Pending Payment</span>;
      case 'confirmed':
        return <span className="cq-admin-pill cq-pill-confirmed">Confirmed</span>;
      case 'completed':
        return <span className="cq-admin-pill cq-pill-completed">Completed</span>;
      case 'cancelled':
        return <span className="cq-admin-pill cq-pill-cancelled">Cancelled</span>;
      default:
        return <span className="cq-admin-pill">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'pending_verification':
        return <span className="cq-admin-pill cq-pill-verification">Pending Review</span>;
      case 'partially_paid':
        return <span className="cq-admin-pill cq-pill-partial">Partially Paid</span>;
      case 'fully_paid':
        return <span className="cq-admin-pill cq-pill-paid">Fully Paid</span>;
      case 'rejected':
        return <span className="cq-admin-pill cq-pill-cancelled">Rejected</span>;
      case 'unpaid':
        return <span className="cq-admin-pill cq-pill-unpaid">Unpaid</span>;
      default:
        return <span className="cq-admin-pill">{status}</span>;
    }
  };

  // Metrics overview
  const pendingVerificationCount = bookings.filter((b) => b.booking_status === 'pending_verification').length;
  const quoteRequestedCount = bookings.filter((b) => b.booking_status === 'quote_requested').length;
  const confirmedCount = bookings.filter((b) => b.booking_status === 'confirmed').length;

  return (
    <div className="cq-container cq-admin-container">
      {/* Page Title & Metrics */}
      <div className="cq-admin-page-header">
        <div>
          <span className="cq-badge cq-badge-turquoise">Overview</span>
          <h1 className="cq-admin-page-title">Operations & Bookings</h1>
          <p className="cq-admin-page-sub">
            Monitor incoming client bookings, verify PalmPay bank receipts, and issue custom commercial quotes.
          </p>
        </div>

        <div className="cq-admin-stats-row">
          <div className="cq-admin-stat-box">
            <span className="cq-admin-stat-num">{pendingVerificationCount}</span>
            <span className="cq-admin-stat-label">Pending Verification</span>
          </div>
          <div className="cq-admin-stat-box">
            <span className="cq-admin-stat-num">{quoteRequestedCount}</span>
            <span className="cq-admin-stat-label">Quotes Needed</span>
          </div>
          <div className="cq-admin-stat-box">
            <span className="cq-admin-stat-num">{confirmedCount}</span>
            <span className="cq-admin-stat-label">Confirmed Jobs</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cq-admin-filters-bar">
        <div className="cq-admin-search-wrap">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, client name, or phone..."
            className="cq-input cq-admin-search-input"
            id="admin-search-input"
          />
        </div>

        <div className="cq-admin-dropdowns-wrap">
          {/* Booking Status Filter */}
          <div className="cq-admin-filter-item">
            <label htmlFor="filter-booking-status" className="cq-admin-filter-label">
              Booking Status:
            </label>
            <select
              id="filter-booking-status"
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="cq-select cq-admin-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="quote_requested">Quote Requested</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="cq-admin-filter-item">
            <label htmlFor="filter-payment-status" className="cq-admin-filter-label">
              Payment Status:
            </label>
            <select
              id="filter-payment-status"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="cq-select cq-admin-filter-select"
            >
              <option value="all">All Payments</option>
              <option value="pending_verification">Pending Review</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="fully_paid">Fully Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content: Table & Mobile Cards */}
      {isLoading ? (
        <div className="cq-loading-state">
          <div className="cq-spinner" />
          <p>Loading bookings...</p>
        </div>
      ) : error ? (
        <div className="cq-error-banner" role="alert">
          <span>{error}</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="cq-admin-empty-state">
          <h3>No bookings match your filters</h3>
          <p>Try resetting the search query or status filters.</p>
          <button
            type="button"
            onClick={() => {
              setBookingStatusFilter('all');
              setPaymentStatusFilter('all');
              setSearchQuery('');
            }}
            className="cq-btn cq-btn-outline"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="cq-admin-table-container">
            <table className="cq-admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Service / Package</th>
                  <th>Preferred Date</th>
                  <th>Total Rate</th>
                  <th>Booking Status</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const hasPrice = typeof booking.total_amount === 'number';

                  return (
                    <tr key={booking.id} className="cq-admin-table-row">
                      <td className="cq-table-cell-ref">
                        <Link
                          to={`/admin/bookings/${booking.id}`}
                          className="cq-admin-ref-link"
                        >
                          {booking.reference}
                        </Link>
                      </td>
                      <td>
                        <div className="cq-table-customer">
                          <span className="cq-table-customer-name">{booking.customer_name}</span>
                          <span className="cq-table-customer-phone">{booking.customer_phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cq-table-service">
                          <span className="cq-table-service-name">{booking.service_name}</span>
                          {booking.package_name && (
                            <span className="cq-table-service-pkg">{booking.package_name}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="cq-table-date">
                          <span>{booking.scheduled_date}</span>
                          {booking.scheduled_time && (
                            <span className="cq-table-time-sub">{booking.scheduled_time}</span>
                          )}
                        </div>
                      </td>
                      <td className="cq-table-cell-amount">
                        {hasPrice ? (
                          <span className="cq-amount-strong">
                            ₦{booking.total_amount?.toLocaleString()}
                          </span>
                        ) : (
                          <span className="cq-quote-needed-tag">Quote Needed</span>
                        )}
                      </td>
                      <td>{getBookingStatusBadge(booking.booking_status)}</td>
                      <td>{getPaymentStatusBadge(booking.payment_status)}</td>
                      <td>
                        <Link
                          to={`/admin/bookings/${booking.id}`}
                          className="cq-btn cq-btn-secondary cq-table-manage-btn"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="cq-admin-mobile-cards">
            {bookings.map((booking) => (
              <div key={booking.id} className="cq-admin-mobile-card">
                <div className="cq-mobile-card-top">
                  <Link
                    to={`/admin/bookings/${booking.id}`}
                    className="cq-admin-ref-link"
                  >
                    {booking.reference}
                  </Link>
                  <div className="cq-mobile-card-badges">
                    {getBookingStatusBadge(booking.booking_status)}
                  </div>
                </div>

                <div className="cq-mobile-card-row">
                  <span className="cq-mobile-label">Client</span>
                  <div className="cq-mobile-val">
                    <strong>{booking.customer_name}</strong>
                    <span className="cq-mobile-sub">{booking.customer_phone}</span>
                  </div>
                </div>

                <div className="cq-mobile-card-row">
                  <span className="cq-mobile-label">Service</span>
                  <div className="cq-mobile-val">
                    <span>{booking.service_name}</span>
                    {booking.package_name && (
                      <span className="cq-mobile-sub">{booking.package_name}</span>
                    )}
                  </div>
                </div>

                <div className="cq-mobile-card-row">
                  <span className="cq-mobile-label">Date</span>
                  <div className="cq-mobile-val">{booking.scheduled_date}</div>
                </div>

                <div className="cq-mobile-card-row">
                  <span className="cq-mobile-label">Total</span>
                  <div className="cq-mobile-val">
                    {booking.total_amount ? (
                      <strong>₦{booking.total_amount.toLocaleString()}</strong>
                    ) : (
                      <span className="cq-quote-needed-tag">Quote Needed</span>
                    )}
                  </div>
                </div>

                <div className="cq-mobile-card-row">
                  <span className="cq-mobile-label">Payment</span>
                  <div className="cq-mobile-val">
                    {getPaymentStatusBadge(booking.payment_status)}
                  </div>
                </div>

                <div className="cq-mobile-card-footer">
                  <Link
                    to={`/admin/bookings/${booking.id}`}
                    className="cq-btn cq-btn-primary cq-mobile-card-btn"
                  >
                    Manage Booking →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
