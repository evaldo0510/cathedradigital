/**
 * PrayerFavoriteButton — marca/desmarca uma oração como favorita usando
 * `useDevotionalFavorites`. Reutilizável em todos os leitores de oração.
 * Exige autenticação; quando o usuário não estiver logado, o botão fica
 * inerte e comunica o motivo via `title`/`aria-label`.
 */
import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDevotionalFavorites } from '@/hooks/useDevotionalFavorites';
import { cn } from '@/lib/utils';

interface Props {
  contentType: string;
  contentId: string;
  title: string;
  url?: string;
}

export const PrayerFavoriteButton: React.FC<Props> = ({ contentType, contentId, title, url }) => {
  const { user } = useAuth();
  const { toggle, isFavorited } = useDevotionalFavorites(contentType);
  const active = isFavorited(contentType, contentId);
  const disabled = !user;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      aria-label={
        disabled
          ? 'Entrar para salvar esta oração'
          : active
            ? 'Remover dos favoritos'
            : 'Salvar nos favoritos'
      }
      title={disabled ? 'Faça login para salvar' : active ? 'Remover dos favoritos' : 'Salvar'}
      onClick={() =>
        !disabled &&
        toggle({ contentType, contentId, title, url }).catch(() => {
          /* silenciado — feedback via aria-pressed */
        })
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-stitch-body text-[11px] uppercase tracking-widest transition-colors',
        active
          ? 'border-stitch-secondary/60 bg-stitch-secondary/10 text-stitch-secondary'
          : 'border-stitch-outline-variant/40 text-stitch-on-surface-variant hover:border-stitch-secondary/50 hover:text-stitch-on-surface',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {active ? <BookmarkCheck className="h-3.5 w-3.5" aria-hidden /> : <Bookmark className="h-3.5 w-3.5" aria-hidden />}
      {active ? 'Salva' : 'Salvar'}
    </button>
  );
};

export default PrayerFavoriteButton;
