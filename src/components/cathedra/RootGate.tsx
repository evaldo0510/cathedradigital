import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { resolveAuthHome } from '@/lib/lastRoute';

const PublicLanding = lazy(() => import('@/pages/PublicLanding'));

/**
 * Gate da rota raiz "/".
 *
 * - Sessão válida  → redireciona ao Átrio (ou última rota visitada).
 * - Sem sessão     → renderiza a Landing pública.
 * - Carregando     → fallback silencioso (evita flash da Landing p/ logados).
 */
const RootGate: React.FC = () => {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Carregando"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to={resolveAuthHome()} replace />;
  }

  return (
    <Suspense fallback={null}>
      <PublicLanding />
    </Suspense>
  );
};

export default RootGate;
