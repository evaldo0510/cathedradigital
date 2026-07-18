import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '@/constants';
import type { MagisteriumDocument } from '@/data/magisterium-urls';
import PassageActions from '@/components/shared/PassageActions';

interface MagisteriumDocumentHeaderProps {
  doc: MagisteriumDocument;
}


/**
 * STAB-004.2 — Ficha rica do documento.
 * STAB-004.3.1 — Breadcrumb + ações de compartilhamento.
 * Renderiza apenas os metadados existentes em `MAGISTERIUM_DOCUMENTS`
 * (sem novas fontes de dados, sem chamadas de rede).
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
      <dt className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground min-w-[92px]">
        {label}
      </dt>
      <dd className="text-premium-sm text-foreground/90 font-medium">{value}</dd>
    </div>
  );
};

const MagisteriumDocumentHeader: React.FC<MagisteriumDocumentHeaderProps> = ({ doc }) => {
  const dateLabel = formatDate(doc.date, doc.year);
  const showPontificate = doc.pontificate && doc.pontificate !== doc.author;

  const referenceLabel = `${doc.title} — ${doc.author}${doc.year ? ` (${doc.year})` : ''}`;


  return (
    <header
      className="w-full max-w-[70ch] mx-auto px-spacing-md md:px-spacing-0 mb-spacing-2xl"
      aria-label="Ficha do documento"
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Trilha de navegação"
        className="mb-spacing-md flex flex-wrap items-center gap-spacing-2xs text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80"
      >
        <Link to="/magisterium" className="hover:text-primary transition-colors">
          Magistério
        </Link>
        <Icons.ChevronRight className="w-spacing-sm h-spacing-sm opacity-50" aria-hidden="true" />
        <Link
          to={`/magisterium?category=${encodeURIComponent(doc.category)}`}
          className="hover:text-primary transition-colors"
        >
          {doc.category}
        </Link>
        <Icons.ChevronRight className="w-spacing-sm h-spacing-sm opacity-50" aria-hidden="true" />
        <span className="text-primary/80 truncate max-w-[40ch]" aria-current="page">
          {doc.title}
        </span>
      </nav>

      <div className="rounded-premium border border-primary/10 bg-primary/[0.02] p-spacing-lg md:p-spacing-xl">
        {/* Título + tipo */}
        <div className="space-y-spacing-xs">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">
            {doc.type}
            {doc.abbr && <span className="text-muted-foreground"> · {doc.abbr}</span>}
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
          <MetaRow label="Idioma" value="Português" />
        </dl>

        {/* Temas */}
        {doc.themes && doc.themes.length > 0 && (
          <>
            <div className="my-spacing-lg border-t border-primary/10" />
            <div className="space-y-spacing-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
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
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
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

        {/* STAB-004.3.1 — Ações de compartilhamento (via PassageActions) */}
        <div className="mt-spacing-lg pt-spacing-lg border-t border-primary/10">
          <PassageActions
            text={doc.summary || doc.title}
            reference={referenceLabel}
            title={doc.title}
            passage={{ kind: 'magisterium', id: doc.id, highlight: doc.abbr || doc.title }}
            size="sm"
          />
        </div>
      </div>
    </header>
  );
};

export default React.memo(MagisteriumDocumentHeader);
