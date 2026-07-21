/**
 * PrayerPortalStandalone — wrapper do PrayerPortal para orações que NÃO
 * usam o Prayer Engine v2 (Via Sacra, Liturgia das Horas seletor, etc).
 *
 * Constrói um objeto `Prayer` sintético mínimo e desabilita a seção de
 * sessão (Continuar/Recomeçar) — que só faz sentido dentro do Engine.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PrayerPortal, { type PortalHighlight } from './PrayerPortal';
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
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Prayer sintético — id nil garante que `usePrayerEngineSession` não
  // encontre linha (hasOpenSession = false) sem quebrar o hook.
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
    />
  );
};

export default PrayerPortalStandalone;
