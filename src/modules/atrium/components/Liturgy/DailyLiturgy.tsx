import React from 'react';
import { useLiturgyToday } from '../../hooks';
import { useSaintOfDay } from '@/hooks/useSaintOfDay';

const DailyLiturgy: React.FC = () => {
  const l = useLiturgyToday();
  const { data: saint } = useSaintOfDay();
  if (!l) return null;

  // Prefere o santo real (edge oficial + santoral); mantém adapter como fallback.
  const displayName = saint?.name ?? l.saintOfDay?.name ?? null;
  const displayTitle = saint?.title ?? l.saintOfDay?.title ?? null;

  return (
    <section data-atrium-block="P3" aria-labelledby="atrium-liturgy">
      <h2 id="atrium-liturgy" className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Liturgia do dia
      </h2>
      <a
        href="/liturgia"
        className="block p-4 rounded-md border border-border hover:bg-muted transition"
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2 h-2 rounded-full bg-primary"
            aria-hidden
            data-color-token={l.colorToken}
          />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {l.season} · {l.weekday}
          </span>
        </div>
        {displayName ? (
          <div className="text-sm">
            <span className="font-medium">{displayName}</span>
            {displayTitle && (
              <span className="text-muted-foreground"> — {displayTitle}</span>
            )}
          </div>
        ) : (
          <div className="text-sm font-medium">Abrir liturgia</div>
        )}
      </a>
    </section>
  );
};

export default DailyLiturgy;
