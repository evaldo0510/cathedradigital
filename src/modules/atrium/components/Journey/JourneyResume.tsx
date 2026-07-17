import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useResume } from '../../hooks';

const KIND_LABEL: Record<string, string> = {
  reading: 'Leitura',
  study: 'Estudo',
  formation: 'Formação',
  lectio: 'Lectio',
  note: 'Nota',
  prayer: 'Oração',
};

const JourneyResume: React.FC = () => {
  const items = useResume();
  if (!items.length) return null;

  return (
    <section data-atrium-block="P0" aria-labelledby="atrium-resume">
      <h2 id="atrium-resume" className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Continuar minha caminhada
      </h2>
      <ul className="flex flex-col gap-2">
        {items.slice(0, 3).map((it) => (
          <li key={it.id}>
            <a
              href={it.targetPath}
              className="flex items-center justify-between gap-3 p-3 rounded-md border border-border hover:bg-muted transition"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {KIND_LABEL[it.kind] ?? it.kind}
                </span>
                <span className="text-sm font-medium truncate">{it.label}</span>
                {typeof it.progressPct === 'number' && (
                  <div className="mt-1 h-[2px] bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground/70"
                      style={{ width: `${Math.min(100, Math.max(0, it.progressPct))}%` }}
                    />
                  </div>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default JourneyResume;
