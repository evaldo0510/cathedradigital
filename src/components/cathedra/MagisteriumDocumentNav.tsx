import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '@/constants';
import { MAGISTERIUM_DOCUMENTS, type MagisteriumDocument } from '@/data/magisterium-urls';

interface MagisteriumDocumentNavProps {
  currentId: string;
}

const MAX_RELATED = 6;

const DocLink: React.FC<{ doc: MagisteriumDocument; hint?: string }> = ({ doc, hint }) => (
  <Link
    to={`/magisterium/${doc.id}`}
    className="group block rounded-premium border border-primary/10 bg-primary/[0.02] p-spacing-md hover:border-primary/30 hover:bg-primary/[0.04] transition-colors"
  >
    {hint && (
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-spacing-2xs">
        {hint}
      </p>
    )}
    <p className="font-serif text-premium-base text-primary leading-snug group-hover:underline">
      {doc.title}
    </p>
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80 mt-spacing-2xs">
      {doc.author}
      {doc.year ? ` · ${doc.year}` : ''}
    </p>
  </Link>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-spacing-sm" aria-label={title}>
    <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">{title}</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-sm">{children}</div>
  </section>
);

/**
 * STAB-004.3 — Navegação documental derivada de MAGISTERIUM_DOCUMENTS.
 * Sem chamadas de rede. Blocos sem itens são omitidos.
 */
const MagisteriumDocumentNav: React.FC<MagisteriumDocumentNavProps> = ({ currentId }) => {
  const { current, prev, next, samePope, sameCategory, related } = useMemo(() => {
    const idx = MAGISTERIUM_DOCUMENTS.findIndex((d) => d.id === currentId);
    if (idx === -1) {
      return { current: null, prev: null, next: null, samePope: [], sameCategory: [], related: [] };
    }
    const cur = MAGISTERIUM_DOCUMENTS[idx];
    const prevDoc = idx > 0 ? MAGISTERIUM_DOCUMENTS[idx - 1] : null;
    const nextDoc = idx < MAGISTERIUM_DOCUMENTS.length - 1 ? MAGISTERIUM_DOCUMENTS[idx + 1] : null;

    const samePopeList = MAGISTERIUM_DOCUMENTS.filter(
      (d) => d.id !== cur.id && d.author === cur.author
    ).slice(0, MAX_RELATED);

    const sameCategoryList = MAGISTERIUM_DOCUMENTS.filter(
      (d) => d.id !== cur.id && d.category === cur.category
    ).slice(0, MAX_RELATED);

    const themeSet = new Set(cur.themes || []);
    const relatedList = MAGISTERIUM_DOCUMENTS
      .filter((d) => d.id !== cur.id && d.author !== cur.author && d.category !== cur.category)
      .map((d) => ({
        doc: d,
        overlap: (d.themes || []).filter((t) => themeSet.has(t)).length,
      }))
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, MAX_RELATED)
      .map((x) => x.doc);

    return {
      current: cur,
      prev: prevDoc,
      next: nextDoc,
      samePope: samePopeList,
      sameCategory: sameCategoryList,
      related: relatedList,
    };
  }, [currentId]);

  if (!current) return null;

  return (
    <nav
      className="w-full max-w-[70ch] mx-auto px-spacing-md md:px-spacing-0 mt-spacing-3xl mb-spacing-2xl space-y-spacing-2xl"
      aria-label="Navegação entre documentos do Magistério"
    >
      {/* Anterior / Próximo */}
      {(prev || next) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-sm">
          {prev ? (
            <Link
              to={`/magisterium/${prev.id}`}
              className="group flex items-start gap-spacing-sm rounded-premium border border-primary/10 bg-primary/[0.02] p-spacing-md hover:border-primary/30 hover:bg-primary/[0.04] transition-colors"
            >
              <Icons.ArrowLeft className="w-spacing-md h-spacing-md text-primary/60 mt-spacing-3xs shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-spacing-2xs">
                  Documento anterior
                </p>
                <p className="font-serif text-premium-base text-primary leading-snug group-hover:underline truncate">
                  {prev.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next && (
            <Link
              to={`/magisterium/${next.id}`}
              className="group flex items-start gap-spacing-sm rounded-premium border border-primary/10 bg-primary/[0.02] p-spacing-md hover:border-primary/30 hover:bg-primary/[0.04] transition-colors sm:text-right"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-spacing-2xs">
                  Próximo documento
                </p>
                <p className="font-serif text-premium-base text-primary leading-snug group-hover:underline truncate">
                  {next.title}
                </p>
              </div>
              <Icons.ArrowRight className="w-spacing-md h-spacing-md text-primary/60 mt-spacing-3xs shrink-0" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {samePope.length > 0 && (
        <Section title={`Outros documentos de ${current.author}`}>
          {samePope.map((d) => <DocLink key={d.id} doc={d} />)}
        </Section>
      )}

      {sameCategory.length > 0 && (
        <Section title={`Outros documentos em ${current.category}`}>
          {sameCategory.map((d) => <DocLink key={d.id} doc={d} />)}
        </Section>
      )}

      {related.length > 0 && (
        <Section title="Documentos relacionados">
          {related.map((d) => <DocLink key={d.id} doc={d} />)}
        </Section>
      )}
    </nav>
  );
};

export default React.memo(MagisteriumDocumentNav);
