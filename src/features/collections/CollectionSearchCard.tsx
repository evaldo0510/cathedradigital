/**
 * CollectionSearchCard — card compacto para resultados de busca do Acervo.
 * Exibe capa, título, subtítulo, tempo estimado, nível e badge de certificado.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, GraduationCap, Award, ScrollText, ArrowRight } from 'lucide-react';
import type { CollectionSearchHit } from './searchCollections';
import { trackCollectionEvent } from './collectionAnalytics';

const LEVEL_LABEL: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

export const CollectionSearchCard: React.FC<{ hit: CollectionSearchHit }> = ({ hit }) => {
  const duration = formatDuration(hit.estimated_reading_time_minutes);
  const level = hit.difficulty_level ? LEVEL_LABEL[hit.difficulty_level] ?? hit.difficulty_level : null;

  return (
    <Link
      to={`/colecoes/${hit.slug}`}
      onClick={() =>
        trackCollectionEvent('collection_search_result_clicked', {
          collection_slug: hit.slug,
          collection_title: hit.title,
          difficulty_level: hit.difficulty_level ?? null,
          estimated_reading_time_minutes: hit.estimated_reading_time_minutes ?? null,
          has_certificate: Boolean(hit.certificate_eligible),
          extra: { track: hit.track ?? null },
        })
      }
      className="group flex gap-spacing-md p-spacing-md rounded-premium border border-border bg-card hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      data-testid="collection-search-card"
    >
      <div className="w-16 h-20 rounded-md overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
        {hit.cover ? (
          <img
            src={hit.cover}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <ScrollText className="w-6 h-6 text-primary/60" aria-hidden />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-spacing-2xs">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
          Coleção {hit.track ? `· ${hit.track.replace(/-/g, ' ')}` : ''}
        </p>
        <h3 className="font-serif text-premium-md text-foreground group-hover:text-primary transition-colors leading-tight">
          {hit.title}
        </h3>
        {hit.subtitle && (
          <p className="text-premium-sm text-muted-foreground line-clamp-2">
            {hit.subtitle}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-spacing-sm pt-spacing-2xs text-premium-xs text-muted-foreground">
          {duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden />
              {duration}
            </span>
          )}
          {level && (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="w-3 h-3" aria-hidden />
              {level}
            </span>
          )}
          {hit.certificate_eligible && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Award className="w-3 h-3" aria-hidden />
              Certificado
            </span>
          )}
        </div>
      </div>
      <ArrowRight
        className="w-4 h-4 text-primary self-center flex-shrink-0 group-hover:translate-x-1 transition-transform"
        aria-hidden
      />
    </Link>
  );
};

export default CollectionSearchCard;
