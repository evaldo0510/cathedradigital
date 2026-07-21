/**
 * BreviaryShareButtons — copiar/compartilhar deep link exato da Hora atual.
 *
 * O link inclui `h` (hora), `d` (data ISO) e, quando disponível, `b` (blockId
 * do cursor atual) — restaurando exatamente a posição de leitura, mesmo após
 * refresh ou navegação offline entrada por outro dispositivo.
 */
import React, { useCallback, useMemo } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  hourSlug: string;
  isoDate: string;
  isToday: boolean;
  /** Título usado no Web Share API (fallback quando copiar). */
  shareTitle: string;
  /** Fonte da verdade para posição — persistida por hora+data em localStorage. */
  bookmarkKey: string;
}

function buildShareUrl(hour: string, isoDate: string, isToday: boolean, blockId: string | null) {
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://www.cathedradigital.com.br';
  const params = new URLSearchParams();
  params.set('h', hour);
  if (!isToday) params.set('d', isoDate);
  if (blockId) params.set('b', blockId);
  return `${origin}/breviary?${params.toString()}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fallback abaixo */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
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
}

export const BreviaryShareButtons: React.FC<Props> = ({
  hourSlug, isoDate, isToday, shareTitle, bookmarkKey,
}) => {
  const url = useMemo(() => {
    let blockId: string | null = null;
    try { blockId = localStorage.getItem(bookmarkKey); } catch { /* silent */ }
    return buildShareUrl(hourSlug, isoDate, isToday, blockId);
  // Recomputa quando bookmarkKey ou params mudam (blockId é lido a cada click de
  // qualquer forma via handler para pegar valor fresco).
  }, [bookmarkKey, hourSlug, isoDate, isToday]);

  const freshUrl = useCallback(() => {
    let blockId: string | null = null;
    try { blockId = localStorage.getItem(bookmarkKey); } catch { /* silent */ }
    return buildShareUrl(hourSlug, isoDate, isToday, blockId);
  }, [bookmarkKey, hourSlug, isoDate, isToday]);

  const handleCopy = useCallback(async () => {
    const link = freshUrl();
    const ok = await copyToClipboard(link);
    if (ok) toast.success('Link copiado com data e marcação exata.');
    else toast.error('Não foi possível copiar o link.');
  }, [freshUrl]);

  const handleShare = useCallback(async () => {
    const link = freshUrl();
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({ title: shareTitle, url: link });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    const ok = await copyToClipboard(link);
    if (ok) toast.success('Link copiado (compartilhamento indisponível).');
  }, [freshUrl, shareTitle]);

  return (
    <div className="flex items-center gap-spacing-2xs" data-testid="breviary-share" aria-label={`Compartilhar link do trecho — ${shareTitle}`}>
      <Button
        type="button"
        variant="pill"
        size="pill"
        onClick={handleCopy}
        aria-label="Copiar link deste trecho"
        title={url}
      >
        <Copy aria-hidden className="w-4 h-4" />
        Copiar
      </Button>
      <Button
        type="button"
        variant="pill"
        size="pill"
        onClick={handleShare}
        aria-label="Compartilhar link deste trecho"
      >
        <Share2 aria-hidden className="w-4 h-4" />
        Compartilhar
      </Button>
    </div>
  );
};

export default BreviaryShareButtons;
