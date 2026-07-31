/**
 * Multi-idioma — configuração central de locales, prefixos de rota e hreflang.
 *
 * Estratégia: o idioma vive no primeiro segmento da URL (`/en/bible`).
 * O português é o idioma padrão e NÃO usa prefixo (`/bible`), preservando
 * todas as URLs já indexadas.
 *
 * O prefixo é aplicado via `basename` do BrowserRouter, de modo que a árvore
 * de rotas existente continua idêntica e todos os links internos permanecem
 * dentro do idioma ativo.
 */
import type { Language } from '@/types';

export interface LocaleDefinition {
  /** Código curto usado na URL e no atributo lang. */
  code: Language;
  /** Nome no próprio idioma (para o seletor). */
  nativeName: string;
  /** Código BCP-47 usado em hreflang e og:locale. */
  hreflang: string;
  /** Locale completo para og:locale. */
  ogLocale: string;
}

export const DEFAULT_LOCALE: Language = 'pt';

export const SUPPORTED_LOCALES: LocaleDefinition[] = [
  { code: 'pt', nativeName: 'Português', hreflang: 'pt-BR', ogLocale: 'pt_BR' },
  { code: 'en', nativeName: 'English', hreflang: 'en', ogLocale: 'en_US' },
  { code: 'es', nativeName: 'Español', hreflang: 'es', ogLocale: 'es_ES' },
  { code: 'it', nativeName: 'Italiano', hreflang: 'it', ogLocale: 'it_IT' },
  { code: 'la', nativeName: 'Latina', hreflang: 'la', ogLocale: 'la' },
];

export const SUPPORTED_LOCALE_CODES = SUPPORTED_LOCALES.map((l) => l.code);

/** Locales com prefixo na URL (todos, exceto o padrão). */
export const PREFIXED_LOCALE_CODES = SUPPORTED_LOCALE_CODES.filter(
  (code) => code !== DEFAULT_LOCALE,
);

export function isSupportedLocale(value: string | null | undefined): value is Language {
  return !!value && (SUPPORTED_LOCALE_CODES as string[]).includes(value);
}

export function getLocaleDefinition(code: Language): LocaleDefinition {
  return SUPPORTED_LOCALES.find((l) => l.code === code) ?? SUPPORTED_LOCALES[0];
}

/** Extrai o idioma do pathname completo (`/en/bible` → `en`). */
export function detectLocaleFromPath(pathname: string): Language {
  const segment = pathname.split('/').filter(Boolean)[0];
  return isSupportedLocale(segment) && segment !== DEFAULT_LOCALE ? segment : DEFAULT_LOCALE;
}

/** Remove o prefixo de idioma do pathname (`/en/bible` → `/bible`). */
export function stripLocaleFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isSupportedLocale(parts[0]) && parts[0] !== DEFAULT_LOCALE) {
    parts.shift();
  }
  return `/${parts.join('/')}`.replace(/\/{2,}/g, '/');
}

/** Aplica o prefixo do idioma a um caminho sem prefixo. */
export function withLocalePath(pathname: string, locale: Language): string {
  const clean = stripLocaleFromPath(pathname);
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * `basename` do router para a URL atual. Deve ser calculado uma única vez
 * no boot da aplicação.
 */
export function resolveRouterBasename(pathname: string = window.location.pathname): string {
  const locale = detectLocaleFromPath(pathname);
  return locale === DEFAULT_LOCALE ? '/' : `/${locale}`;
}

/** Alternates hreflang para um caminho canônico (já sem prefixo). */
export function buildHreflangAlternates(
  basePath: string,
  baseUrl: string,
): Array<{ hreflang: string; href: string }> {
  const clean = stripLocaleFromPath(basePath);
  const alternates = SUPPORTED_LOCALES.map((locale) => ({
    hreflang: locale.hreflang,
    href: `${baseUrl}${withLocalePath(clean, locale.code)}`,
  }));
  alternates.push({ hreflang: 'x-default', href: `${baseUrl}${clean}` });
  return alternates;
}
