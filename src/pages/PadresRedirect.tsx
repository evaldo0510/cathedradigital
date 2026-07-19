import { Navigate, useParams } from 'react-router-dom';

/**
 * Rota canônica /biblioteca/padres/:slug — redireciona para /santos/:slug.
 * Os Padres/Doutores da Igreja estão na tabela `saints` (category='doctor').
 * Mantemos a URL bonita e evitamos duplicação de páginas.
 */
export default function PadresRedirect() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/santos" replace />;
  return <Navigate to={`/santos/${encodeURIComponent(slug)}`} replace />;
}
