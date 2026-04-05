import { useCallback } from 'react';
import { toast } from 'sonner';

interface ShareData {
  title: string;
  text: string;
  url?: string;
}

export const useShare = () => {
  const share = useCallback(async ({ title, text, url }: ShareData) => {
    const shareUrl = url || window.location.href;

    // Try native Web Share API first (mobile / PWA)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // user cancelled
      }
    }

    // Fallback: copy to clipboard
    const fullText = `${title}\n\n${text}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullText);
      toast.success('Copiado para a área de transferência!');
    } catch {
      toast.error('Não foi possível compartilhar.');
    }
  }, []);

  return share;
};
