/**
 * Fonte única dos links institucionais do rodapé público.
 *
 * Regra: só entra aqui o que pode ser exibido a visitante NÃO autenticado.
 * Rotas de conta (Perfil Espiritual, Boas-vindas, Comunidade, Design System)
 * ficam na Área do Usuário — não devem vazar para o footer público.
 *
 * Consumido por `src/components/cathedra/Footer.tsx`.
 */

export interface FooterLink {
  /** Caminho interno (SPA). Para URL externa, usar `href`. */
  path?: string;
  /** URL absoluta (para RSS, feeds externos etc.). */
  href?: string;
  /** Label visível. */
  label: string;
  /** Só aparece se true e usuário for admin. */
  adminOnly?: boolean;
  /** Se true, abre em nova aba. */
  external?: boolean;
  /** aria-label opcional. */
  ariaLabel?: string;
}

/** Links institucionais que aparecem SEMPRE no footer público. */
export const PUBLIC_FOOTER_LINKS: FooterLink[] = [
  { path: '/about', label: 'Sobre' },
  { path: '/manifesto', label: 'Manifesto' },
  { path: '/partners', label: 'Parceiros' },
  { path: '/contato', label: 'Contato' },
  { path: '/legal', label: 'Centro Legal' },
  { path: '/privacy', label: 'Privacidade' },
  { path: '/legal/lgpd', label: 'LGPD' },
  { path: '/terms', label: 'Termos' },
  { path: '/transparencia', label: 'Transparência' },
];

/** Links condicionais — só renderizam se o gate correspondente for verdadeiro. */
export const CONDITIONAL_FOOTER_LINKS: FooterLink[] = [
  {
    path: '/admin/seo',
    label: 'Admin',
    adminOnly: true,
    ariaLabel: 'Painel administrativo',
  },
];

/**
 * Feeds e recursos externos. RSS Léxico só faz sentido enquanto o feed
 * estiver publicado — mantido separado para poder ser ocultado sem
 * mexer no bloco institucional.
 */
export const EXTERNAL_FOOTER_LINKS: FooterLink[] = [
  {
    href: 'https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/glossary-rss?format=rss',
    label: 'RSS Léxico',
    external: true,
    ariaLabel: 'Feed RSS do Léxico Teológico',
  },
];

/** Subconjunto mínimo exibido no rodapé mobile compacto (antes de expandir). */
export const MOBILE_MINIMAL_LINKS: FooterLink[] = PUBLIC_FOOTER_LINKS;
