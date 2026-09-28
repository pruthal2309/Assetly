import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { useCan } from '../../shared/hooks/useCan';
import { Skeleton } from '../../shared/ui/Toast';

export const RequireAuth = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
        <Skeleton height="40px" style={{ marginBottom: '1rem' }} />
        <Skeleton height="200px" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const RequirePermission = ({ perm, children }) => {
  const { can } = useCan();

  if (!can(perm)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};
