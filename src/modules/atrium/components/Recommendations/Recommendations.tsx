import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useAtriumProfile, useRecommendations } from '../../hooks';

const KIND_LABEL: Record<string, string> = {
  reading: 'Leitura',
  formation: 'Formação',
  lectio: 'Lectio',
  saint: 'Santo',
  magisterium: 'Magistério',
};

const Recommendations: React.FC = () => {
  const user = useAtriumProfile();
  const items = useRecommendations(user.profile);
  if (!items.length) return null;

  return (
    <section data-atrium-block="P5" aria-labelledby="atrium-recs">
      <h2 id="atrium-recs" className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Recomendações
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((r) => (
          <li key={r.id}>
            <a
              href={r.targetPath}
              className="flex items-center justify-between gap-3 p-3 rounded-md border border-border hover:bg-muted transition"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {KIND_LABEL[r.kind] ?? r.kind}
                </span>
                <span className="text-sm truncate">{r.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Recommendations;
