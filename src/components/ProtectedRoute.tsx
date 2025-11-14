import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from '@/store/authStore';

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: UserRole[];
  allowManagerOverride?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowManagerOverride = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, reason: 'auth-required' }}
      />
    );
  }

  const managerOverride = allowManagerOverride && user.role === 'manager';

  if (allowedRoles && !allowedRoles.includes(user.role) && !managerOverride) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          from: location.pathname,
          reason: 'role-restricted',
          allowedRoles,
          actualRole: user.role,
        }}
      />
    );
  }

  return children;
}

