import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SEO_CONFIG } from '@/config/seo';
import { resolveRouteMeta } from '@/config/routeMeta';
import { useLang } from '@/hooks/useLang';
import {
  buildHreflangAlternates,
  getLocaleDefinition,
  stripLocaleFromPath,
  withLocalePath,
} from '@/lib/i18n/locales';

/**
 * Emite defaults padronizados de <title>, description, canonical, og:* e
 * alternates hreflang baseados no pathname atual. Páginas que declaram
 * <Helmet> próprio sobrescrevem via dedupe do react-helmet-async.
 *
 * Deve ser montado UMA vez dentro do BrowserRouter, antes de <Routes>.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const { lang } = useLang();
  const meta = resolveRouteMeta(pathname);
  const cleanPath = stripLocaleFromPath(pathname.replace(/\/+$/, '') || '/');
  const canonicalPath = meta?.canonicalPath ?? cleanPath;
  // Canonical self-referente: inclui o prefixo do idioma ativo.
  const url = `${SEO_CONFIG.BASE_URL}${withLocalePath(canonicalPath, lang)}`;

  const title = meta?.title ?? 'Cathedra Digital — Mosteiro Digital';
  const description = meta?.description ?? 'Explore o acervo da Cathedra Digital: Bíblia, Catecismo, Magistério e vida de oração em uma experiência contemplativa.';
  const noindex = meta?.noindex === true;
  const localeDef = getLocaleDefinition(lang);
  const alternates = noindex ? [] : buildHreflangAlternates(canonicalPath, SEO_CONFIG.BASE_URL);

  return (
    <Helmet>
      <html lang={localeDef.hreflang} />
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {alternates.map((alt) => (
        <link key={alt.hreflang} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={localeDef.ogLocale} />
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
