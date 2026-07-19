import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, RoleName } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: RoleName[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />; // Or to a 403 Forbidden page
    }
  }

  return <Outlet />;
};
