import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';

import { getAdminSession } from '../lib/adminApi';

interface AdminRouteGuardProps {
  children: React.ReactElement;
}

/**
 * Checks for a valid admin session.
 * Admin-only — no sign-up, per AGENT_RULES.md.
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      const session = await getAdminSession();
      if (isMounted) {
        setIsAuthenticated(!!session);
        setChecking(false);
      }
    }

    verifyAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        if (session?.user) {
          setIsAuthenticated(true);
        } else {
          const current = await getAdminSession();
          setIsAuthenticated(!!current);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="cq-loading-state" style={{ minHeight: '100vh' }}>
        <div className="cq-spinner" />
        <p>Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};
