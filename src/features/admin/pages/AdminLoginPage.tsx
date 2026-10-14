import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminLogin } from '../lib/adminApi';
import { SparklesIcon } from '../../booking/components/Icons';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await adminLogin(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cq-admin-login-wrapper">
      <div className="cq-admin-login-card">
        <div className="cq-admin-login-header">
          <div className="cq-admin-login-icon">
            <SparklesIcon size={28} color="#102A29" />
          </div>
          <span className="cq-badge cq-badge-turquoise">Cleanique Operations</span>
          <h1 className="cq-admin-login-title">Owner Dashboard Login</h1>
          <p className="cq-admin-login-sub">
            Internal access for booking management, PalmPay payment verification, and quote generation.
          </p>
        </div>

        {error && (
          <div className="cq-error-banner" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* Email and Password form ONLY. No sign-up. No forgot-password. Per AGENT_RULES.md */}
        <form onSubmit={handleSubmit} className="cq-admin-login-form" noValidate>
          <div className="cq-form-group">
            <label htmlFor="admin-email" className="cq-form-label">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@admin.com"
              className="cq-input"
              autoComplete="username"
            />
          </div>

          <div className="cq-form-group">
            <label htmlFor="admin-password" className="cq-form-label">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              className="cq-input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cq-btn cq-btn-primary cq-admin-login-btn"
            id="admin-submit-login-btn"
          >
            {isLoading ? (
              <>
                <div className="cq-spinner-sm" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="cq-admin-login-notice">
          <span>Administrator Access:</span> Authorized Cleanique management portal. Default credentials: <code>admin@admin.com</code> / <code>admin</code>
        </div>
      </div>
    </div>
  );
};
