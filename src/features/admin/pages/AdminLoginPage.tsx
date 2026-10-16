import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminLogin } from '../lib/adminApi';
import { SparklesIcon } from '../../booking/components/Icons';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Incorrect email or password.');
      return;
    }

    try {
      setIsLoading(true);
      await adminLogin(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
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
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="cq-input"
              autoComplete="username"
            />
          </div>

          <div className="cq-form-group">
            <label htmlFor="admin-password" className="cq-form-label">
              Password
            </label>
            <div className="cq-password-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="cq-input"
                style={{ width: '100%', paddingRight: '4rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="cq-btn-toggle-password"
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: '#102A29',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
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
          <span>Administrator Access:</span> Authorized Cleanique management portal.
        </div>
      </div>
    </div>
  );
};
