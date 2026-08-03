/**
 * NextPathPanel — apresentação das recomendações do Nexus Intelligence.
 *
 * Só renderiza o que o `nextPathEngine` decidiu, incluindo o MOTIVO de
 * cada recomendação. Reaproveita os tokens stitch-* já usados em
 * /jornadas e na conclusão — nenhum token novo, nenhuma cor literal.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';

import type { NextPathRecommendation } from '@/core/knowledge/intelligence/nextPathEngine';

const SIGNAL_EYEBROW: Record<NextPathRecommendation['signal'], string> = {
  nexus: 'Conexão no Nexus',
  category: 'Mesmo eixo formativo',
  tags: 'Temas em continuidade',
  progression: 'Próximo grau',
  catalog: 'Sugestão do catálogo',
};

export interface NextPathPanelProps {
  recommendations: readonly NextPathRecommendation[];
  title?: string;
  className?: string;
}

export const NextPathPanel: React.FC<NextPathPanelProps> = ({
  recommendations,
  title = 'Continue sua caminhada',
  className,
}) => {
  if (recommendations.length === 0) return null;

  return (
    <section className={className} data-testid="next-path-panel" aria-label={title}>
      <div className="mb-4 flex items-baseline gap-2">
        <Sparkles className="h-4 w-4 text-stitch-secondary" aria-hidden />
        <h2 className="font-stitch-display text-[22px] italic text-stitch-primary md:text-[26px]">
          {title}
        </h2>
      </div>

      <ul className="space-y-3">
        {recommendations.map((rec, index) => (
          <li key={rec.journey.id}>
            <Link
              to={`/jornadas/${rec.journey.slug ?? rec.journey.id}`}
              data-testid="next-path-item"
              className="group relative flex min-h-[44px] items-center gap-5 border border-stitch-outline-variant/25 bg-stitch-surface-container-lowest p-5 transition-all hover:border-stitch-secondary/50 hover:shadow-sm md:p-6"
            >
              <div className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-stitch-secondary transition-transform group-hover:scale-y-100" />
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-stitch-secondary/10 text-stitch-secondary md:h-14 md:w-14">
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
                  {index === 0 ? 'Próxima Jornada' : SIGNAL_EYEBROW[rec.signal]}
                </p>
                <h3 className="mt-1 font-stitch-display text-[20px] italic text-stitch-primary md:text-[22px]">
                  {rec.journey.title}
                </h3>
                <p className="mt-1 font-stitch-body text-[13px] leading-relaxed text-stitch-on-surface-variant">
                  {rec.reason}
                </p>

                {rec.sharedNodes.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {rec.sharedNodes.slice(0, 4).map((node) => (
                      <li
                        key={node.key}
                        className="border border-stitch-secondary/25 px-2 py-1 font-stitch-body text-[10px] font-bold uppercase tracking-[0.14em] text-stitch-secondary"
                      >
                        {node.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <ChevronRight className="h-5 w-5 flex-shrink-0 text-stitch-on-surface-variant transition-colors group-hover:text-stitch-secondary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default NextPathPanel;
