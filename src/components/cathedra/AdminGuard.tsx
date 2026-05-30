import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminGuardProps {
  children: React.ReactNode;
}

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Carregando">
    <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
  </div>
);

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setVerified(null);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      if (!cancelled) setVerified(!error && data === true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/" replace />;
  if (verified === null) return <Spinner />;
  if (!verified) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default AdminGuard;
