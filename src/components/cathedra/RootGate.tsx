import React, { lazy, Suspense, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { resolveAuthHome } from '@/lib/lastRoute';
import { hasStoredSupabaseSession } from '@/lib/storedSession';
import { trackEvent } from '@/lib/analytics';

const PublicLanding = lazy(() => import('@/pages/PublicLanding'));

/**
 * Gate da rota raiz "/".
 *
 * - Sessão persistida (localStorage) → redireciona IMEDIATAMENTE ao Átrio,
 *   sem carregar Landing nem por um frame. Elimina o flash entre `/` e
 *   `/atrium` para usuários autenticados.
 * - Sessão válida resolvida → redireciona ao Átrio (ou última rota).
 * - Sem sessão                → renderiza a Landing pública.
 * - Carregando sem sessão persistida → fallback silencioso.
 */
const RootGate: React.FC = () => {
  const { authenticated, loading } = useAuth();
  // Snapshot síncrono ANTES do primeiro render do useAuth.
  const hasPersistedSession = useMemo(() => hasStoredSupabaseSession(), []);
  const target = authenticated || hasPersistedSession ? resolveAuthHome() : null;

  useEffect(() => {
    if (loading && !hasPersistedSession) return;
    if ((authenticated || hasPersistedSession) && target) {
      trackEvent('atrium_redirect', { target, via: authenticated ? 'auth' : 'persisted' });
    } else if (!loading && !authenticated) {
      trackEvent('landing_view', { path: '/' });
    }
  }, [authenticated, loading, target, hasPersistedSession]);

  // 1. Sessão persistida → redireciona no primeiro frame, sem Landing.
  if (hasPersistedSession && target) {
    return <Navigate to={target} replace />;
  }

  // 2. Sem sessão persistida mas ainda carregando → placeholder neutro.
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

  // 3. Auth resolveu como logado (raro cair aqui, #1 já cobre) → redireciona.
  if (authenticated && target) {
    return <Navigate to={target} replace />;
  }

  // 4. Visitante — Landing pública.
  return (
    <Suspense fallback={null}>
      <PublicLanding />
    </Suspense>
  );
};

export default RootGate;
