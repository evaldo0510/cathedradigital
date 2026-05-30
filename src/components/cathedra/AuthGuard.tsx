import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = React.forwardRef<HTMLDivElement, AuthGuardProps>(({ children }, ref) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div ref={ref} className="flex items-center justify-center min-h-[60vh]">
        <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to={AppRoute.LOGIN} state={{ from: location }} replace />;
  }

  return <div ref={ref}>{children}</div>;
});

AuthGuard.displayName = 'AuthGuard';

export default AuthGuard;
