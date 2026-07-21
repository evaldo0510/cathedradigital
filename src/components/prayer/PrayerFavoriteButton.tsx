/**
 * PrayerFavoriteButton — marca/desmarca uma oração como favorita usando
 * `useDevotionalFavorites`. Reutilizável em todos os leitores de oração.
 * Exige autenticação; quando o usuário não estiver logado, o botão fica
 * inerte e comunica o motivo via `title`/`aria-label`.
 *
 * P1 — Botão consolidado no Design System via `<Button variant="pill*">`.
 */
import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDevotionalFavorites } from '@/hooks/useDevotionalFavorites';
import { Button } from '@/components/ui/button';
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
    <Button
      type="button"
      variant={active ? 'pill-toned' : 'pill'}
      size="pill"
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
      className={cn(disabled && 'cursor-not-allowed opacity-50')}
    >
      {active ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
      {active ? 'Salva' : 'Salvar'}
    </Button>
  );
};

export default PrayerFavoriteButton;
