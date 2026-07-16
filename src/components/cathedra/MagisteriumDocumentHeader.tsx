import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Icons } from '@/constants';
import type { MagisteriumDocument } from '@/data/magisterium-urls';

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
  const [busy, setBusy] = useState<'link' | 'ref' | 'share' | null>(null);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const reference = `${doc.title}\n${doc.author}${doc.year ? ` · ${doc.year}` : ''}\n\n${shareUrl}`;

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback legado
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyLink = async () => {
    setBusy('link');
    const ok = await copyToClipboard(shareUrl);
    setBusy(null);
    if (ok) toast.success('Link copiado');
    else toast.error('Não foi possível copiar o link');
  };

  const handleCopyReference = async () => {
    setBusy('ref');
    const ok = await copyToClipboard(reference);
    setBusy(null);
    if (ok) toast.success('Referência copiada');
    else toast.error('Não foi possível copiar a referência');
  };

  const handleShare = async () => {
    setBusy('share');
    try {
      if (navigator.share) {
        await navigator.share({ title: doc.title, text: doc.summary || doc.title, url: shareUrl });
      } else {
        const ok = await copyToClipboard(shareUrl);
        if (ok) toast.success('Link copiado para compartilhar');
        else toast.error('Compartilhamento indisponível');
      }
    } catch (err: any) {
      // Usuário cancelou o share nativo — silencioso.
      if (err?.name !== 'AbortError') {
        toast.error('Não foi possível compartilhar');
      }
    } finally {
      setBusy(null);
    }
  };

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
          <MetaRow label="Idioma" value="Português" />
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

        {/* STAB-004.3.1 — Ações de compartilhamento */}
        <div className="mt-spacing-lg pt-spacing-lg border-t border-primary/10 flex flex-wrap gap-spacing-2xs">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={busy === 'link'}
            className="inline-flex items-center gap-spacing-2xs rounded-premium-full border border-primary/15 bg-background px-spacing-md py-spacing-xs text-[10px] font-bold uppercase tracking-widest text-primary/80 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-11"
            aria-label="Copiar link do documento"
          >
            <Icons.Link className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
            Copiar link
          </button>
          <button
            type="button"
            onClick={handleCopyReference}
            disabled={busy === 'ref'}
            className="inline-flex items-center gap-spacing-2xs rounded-premium-full border border-primary/15 bg-background px-spacing-md py-spacing-xs text-[10px] font-bold uppercase tracking-widest text-primary/80 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-11"
            aria-label="Copiar referência bibliográfica"
          >
            <Icons.Quote className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
            Copiar referência
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={busy === 'share'}
            className="inline-flex items-center gap-spacing-2xs rounded-premium-full border border-primary/15 bg-background px-spacing-md py-spacing-xs text-[10px] font-bold uppercase tracking-widest text-primary/80 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-11"
            aria-label="Compartilhar documento"
          >
            <Icons.Share2 className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
            Compartilhar
          </button>
        </div>
      </div>
    </header>
  );
};

export default React.memo(MagisteriumDocumentHeader);
