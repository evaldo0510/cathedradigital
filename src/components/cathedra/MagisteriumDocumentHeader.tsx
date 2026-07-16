import React from 'react';
import { Icons } from '@/constants';
import type { MagisteriumDocument } from '@/data/magisterium-urls';

interface MagisteriumDocumentHeaderProps {
  doc: MagisteriumDocument;
}

/**
 * STAB-004.2 — Ficha rica do documento.
 * Renderiza apenas os metadados existentes em `MAGISTERIUM_DOCUMENTS`
 * (sem novas fontes de dados, sem chamadas de rede).
 * Blocos sem dado real são omitidos para evitar interfaces vazias.
 */
const formatDate = (iso?: string, year?: number): string | null => {
  if (iso) {
    try {
      const d = new Date(iso + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      }
    } catch { /* noop */ }
  }
  return year ? String(year) : null;
};

const MetaRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-spacing-sm py-spacing-2xs">
      <dt className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 min-w-[92px]">
        {label}
      </dt>
      <dd className="text-premium-sm text-foreground/90 font-medium">{value}</dd>
    </div>
  );
};

const MagisteriumDocumentHeader: React.FC<MagisteriumDocumentHeaderProps> = ({ doc }) => {
  const dateLabel = formatDate(doc.date, doc.year);
  const showPontificate = doc.pontificate && doc.pontificate !== doc.author;

  return (
    <header
      className="w-full max-w-[70ch] mx-auto px-spacing-md md:px-spacing-0 mb-spacing-2xl"
      aria-label="Ficha do documento"
    >
      <div className="rounded-premium border border-primary/10 bg-primary/[0.02] p-spacing-lg md:p-spacing-xl">
        {/* Título + tipo */}
        <div className="space-y-spacing-xs">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">
            {doc.type}
            {doc.abbr && <span className="text-muted-foreground/60"> · {doc.abbr}</span>}
          </p>
          <h1 className="font-serif text-premium-3xl md:text-premium-4xl text-primary leading-tight">
            {doc.title}
          </h1>
          {doc.summary && (
            <p className="text-premium-base text-muted-foreground italic leading-relaxed">
              {doc.summary}
            </p>
          )}
        </div>

        {/* Divisor */}
        <div className="my-spacing-lg border-t border-primary/10" />

        {/* Metadados */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-spacing-xl">
          <MetaRow label="Tipo" value={doc.type} />
          <MetaRow label="Autor" value={doc.author} />
          {showPontificate && <MetaRow label="Pontificado" value={doc.pontificate} />}
          <MetaRow label="Data" value={dateLabel} />
          <MetaRow label="Categoria" value={doc.category} />
          <MetaRow label="Idioma" value="Português (tradução oficial)" />
        </dl>

        {/* Temas */}
        {doc.themes && doc.themes.length > 0 && (
          <>
            <div className="my-spacing-lg border-t border-primary/10" />
            <div className="space-y-spacing-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Temas
              </p>
              <div className="flex flex-wrap gap-spacing-2xs">
                {doc.themes.map((theme) => (
                  <span
                    key={theme}
                    className="inline-flex items-center rounded-premium-full border border-primary/15 bg-background px-spacing-sm py-spacing-3xs text-[10px] font-bold uppercase tracking-widest text-primary/80"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Fonte oficial */}
        {doc.url && (
          <>
            <div className="my-spacing-lg border-t border-primary/10" />
            <div className="flex flex-wrap items-center gap-spacing-md">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Fonte oficial
              </p>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-spacing-2xs text-premium-sm font-bold text-primary hover:underline"
              >
                vatican.va
                <Icons.ExternalLink className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
              </a>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default React.memo(MagisteriumDocumentHeader);
