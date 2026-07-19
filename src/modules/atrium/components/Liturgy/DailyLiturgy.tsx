import React from 'react';
import { useLiturgyToday } from '../../hooks';

const DailyLiturgy: React.FC = () => {
  const l = useLiturgyToday();
  if (!l) return null;

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
        {l.saintOfDay ? (
          <div className="text-sm">
            <span className="font-medium">{l.saintOfDay.name}</span>
            {l.saintOfDay.title && (
              <span className="text-muted-foreground"> — {l.saintOfDay.title}</span>
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
