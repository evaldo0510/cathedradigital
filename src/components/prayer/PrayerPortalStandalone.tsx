/**
 * PrayerPortalStandalone — wrapper do PrayerPortal para orações que NÃO
 * usam o Prayer Engine v2 (Via Sacra, Liturgia das Horas seletor, etc).
 *
 * Constrói um objeto `Prayer` sintético mínimo e desabilita a seção de
 * sessão (Continuar/Recomeçar) — que só faz sentido dentro do Engine.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import PrayerPortal, { type PortalHighlight, type PrayerPortalTheme } from './PrayerPortal';
import type { Prayer } from '@/hooks/usePrayers';

interface Props {
  slug: string;
  title: string;
  estimatedSeconds?: number;
  kicker: string;
  highlight?: PortalHighlight;
  quote?: { text: string; ref: string };
  showRhythm?: boolean;
  backHref?: string;
  backLabel?: string;
  onEnter?: () => void;
  theme?: PrayerPortalTheme;
  accentIcon?: LucideIcon;
}

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

const PrayerPortalStandalone: React.FC<Props> = ({
  slug,
  title,
  estimatedSeconds,
  kicker,
  highlight,
  quote,
  showRhythm = true,
  backHref,
  backLabel,
  onEnter,
  theme,
  accentIcon,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const stubPrayer: Prayer = {
    id: NIL_UUID,
    slug,
    title,
    subtitle: null,
    kind: 'devotional',
    estimated_seconds: estimatedSeconds ?? null,
  } as unknown as Prayer;

  const defaultOnEnter = () => {
    const next = new URLSearchParams(searchParams);
    next.set('enter', '1');
    setSearchParams(next, { replace: true });
  };

  return (
    <PrayerPortal
      prayer={stubPrayer}
      kicker={kicker}
      highlight={highlight}
      quote={quote}
      showRhythm={showRhythm}
      backHref={backHref}
      backLabel={backLabel}
      onEnter={onEnter ?? defaultOnEnter}
      theme={theme}
      accentIcon={accentIcon}
    />
  );
};

export default PrayerPortalStandalone;

