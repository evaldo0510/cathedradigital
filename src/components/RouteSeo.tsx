import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SEO_CONFIG } from '@/config/seo';
import { resolveRouteMeta } from '@/config/routeMeta';

/**
 * Emite defaults padronizados de <title>, description, canonical e og:*
 * baseados no pathname atual. Páginas que declaram <Helmet> próprio
 * sobrescrevem via dedupe do react-helmet-async (última montada vence).
 *
 * Deve ser montado UMA vez dentro do BrowserRouter, antes de <Routes>.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const meta = resolveRouteMeta(pathname);
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const canonicalPath = meta?.canonicalPath ?? cleanPath;
  const url = `${SEO_CONFIG.BASE_URL}${canonicalPath}`;

  // Fallback quando a rota não está mapeada: mantém o title do index.html
  // mas garante canonical self-referencing para evitar duplicidade.
  const title = meta?.title;
  const description = meta?.description;
  const noindex = meta?.noindex === true;

  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta name="twitter:url" content={url} />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}
      />
    </Helmet>
  );
}
