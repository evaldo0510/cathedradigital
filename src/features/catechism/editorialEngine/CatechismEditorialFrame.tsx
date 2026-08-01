/**
 * CatechismEditorialFrame — moldura editorial do Catecismo.
 *
 * NÃO é um Reader, nem um layout. É composição presentacional pura,
 * renderizada DENTRO do slot de conteúdo do <ReaderShell/> congelado,
 * exatamente como os blocos do motor editorial dos Santos.
 *
 * Regras respeitadas:
 *  - zero fetch, zero rota hardcoded (links via `resolveNexusHref`);
 *  - tipografia e espaçamento apenas por escala/token do Reader V2;
 *  - nenhum primitivo do Design System é duplicado.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '@/constants';
import { resolveNexusHref } from '@/lib/nexusHref';
import type { CatechismEditorial } from './catechismEditorial';
import type { CatechismLocation } from './catechismStructure';

interface FrameProps {
  location: CatechismLocation;
  editorial: CatechismEditorial;
}

const Passage: React.FC<{ label: string; children: React.ReactNode; icon?: React.ReactNode }> = ({
  label,
  children,
  icon,
}) => (
  <section className="space-y-spacing-2xs">
    <div className="flex items-center gap-spacing-xs type-rubrica text-secondary/80">
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </div>
    <p className="reader-text text-premium-sm md:text-premium-base leading-relaxed text-foreground/80">
      {children}
    </p>
  </section>
);

/**
 * Abertura editorial: introdução + contexto histórico + contexto doutrinário.
 * Vai antes dos parágrafos do CIC.
 */
export const CatechismEditorialOpening: React.FC<FrameProps> = ({ location, editorial }) => (
  <div
    data-testid="catechism-editorial-opening"
    className="space-y-spacing-lg border-l-2 border-secondary/25 pl-spacing-md md:pl-spacing-lg mb-spacing-2xl"
  >
    <Passage label="Introdução" icon={<Icons.BookOpen className="w-spacing-sm h-spacing-sm" />}>
      {editorial.introduction}
    </Passage>
    <Passage label="Contexto histórico">{editorial.historicalContext}</Passage>
    <Passage label="Contexto doutrinário">{editorial.doctrinalContext}</Passage>
    <p className="text-premium-xs italic text-muted-foreground">
      {location.part} · {location.section} · §{location.articleRange[0]}–§{location.articleRange[1]}
    </p>
  </div>
);

/**
 * Leitura complementar — Escritura, Padres, Magistério, santos e orações.
 * Todos os links são internos (SPA) e resolvidos pelo Nexus.
 */
export const CatechismFurtherReading: React.FC<{ editorial: CatechismEditorial }> = ({
  editorial,
}) => {
  const items = editorial.furtherReading
    .map((r) => ({ ...r, href: resolveNexusHref(r.kind, r.ref) }))
    .filter((r): r is typeof r & { href: string } => Boolean(r.href));

  if (items.length === 0) return null;

  return (
    <section
      data-testid="catechism-further-reading"
      aria-label="Leitura complementar"
      className="mt-spacing-2xl space-y-spacing-sm"
    >
      <h2 className="type-rubrica text-secondary/80">Leitura complementar</h2>
      <ul className="space-y-spacing-2xs">
        {items.map((r) => (
          <li key={`${r.kind}-${r.ref}`}>
            <Link
              to={r.href}
              className="flex min-h-[44px] items-center gap-spacing-xs rounded-premium px-spacing-xs -mx-spacing-xs text-premium-sm text-foreground/85 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icons.ChevronRight className="w-spacing-sm h-spacing-sm shrink-0 text-secondary/60" aria-hidden="true" />
              <span>
                {r.label}
                {r.note && <span className="text-muted-foreground italic"> — {r.note}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
