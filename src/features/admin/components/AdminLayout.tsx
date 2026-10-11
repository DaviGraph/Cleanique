import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { getAdminSession, adminLogout } from '../lib/adminApi';
import { SparklesIcon } from '../../booking/components/Icons';

export const AdminLayout: React.FC = () => {
  const session = getAdminSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="cq-admin-app">
      {/* Admin Header */}
      <header className="cq-admin-nav">
        <div className="cq-container cq-admin-nav-inner">
          <div className="cq-admin-nav-left">
            <Link to="/admin" className="cq-brand" aria-label="Cleanique Admin">
              <div className="cq-brand-icon">
                <SparklesIcon size={20} color="#102A29" />
              </div>
              <div className="cq-brand-text">
                <span className="cq-brand-name">Cleanique</span>
                <span className="cq-brand-tag">OWNER DASHBOARD</span>
              </div>
            </Link>

            <nav className="cq-admin-links">
              <Link to="/admin" className="cq-admin-nav-link">
                All Bookings
              </Link>
              <Link to="/" target="_blank" rel="noreferrer" className="cq-admin-nav-link cq-admin-view-site">
                Customer View ↗
              </Link>
            </nav>
          </div>

          <div className="cq-admin-nav-right">
            {session && (
              <div className="cq-admin-user-pill">
                <span className="cq-admin-user-role">ADMIN</span>
                <span className="cq-admin-user-email">{session.email}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="cq-btn cq-btn-outline cq-admin-logout-btn"
              id="admin-logout-btn"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="cq-admin-content-area">
        <Outlet />
      </main>
    </div>
  );
};
