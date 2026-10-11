import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAdminSession } from '../lib/adminApi';

interface AdminRouteGuardProps {
  children: React.ReactElement;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const session = getAdminSession();
  const location = useLocation();

  if (!session) {
    // Redirect to /admin/login while preserving current location in state
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};
