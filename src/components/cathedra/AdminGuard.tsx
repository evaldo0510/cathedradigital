import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { canUserAccess, logUnauthorizedAccess } from '@/utils/auth-utils';
import AccessDenied from './AccessDenied';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && profile && !canUserAccess(profile.role, location.pathname)) {
      logUnauthorizedAccess(user.id, location.pathname);
    }
  }, [loading, user, profile, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-premium-sm animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={AppRoute.LOGIN} state={{ from: location }} replace />;
  }

  if (!canUserAccess(profile?.role, location.pathname)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

export default AdminGuard;
