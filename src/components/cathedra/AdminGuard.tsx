import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={AppRoute.LOGIN} replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }


  return <>{children}</>;
};

export default AdminGuard;
