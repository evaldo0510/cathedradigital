/**
 * NexusPanel — Motor de Conexões Inteligentes (Nexus 2.0).
 *
 * Agora não apenas lista conexões, mas explica a razão teológica de cada uma.
 *
 * Reutilizado por: Bíblia, Catecismo, Glossário, Santos, Missal, Liturgia,
 * Orações, Jornadas, Coleções, Magistério.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { ReaderAutoNexusOutput, ReaderNexusBucket } from '@/core/knowledge/adapters/ReaderAutoNexus';
import { BUCKET_LABEL } from '@/core/knowledge/adapters/ReaderAutoNexus';
import { NexusSourceBadge } from '@/components/nexus/NexusSourceBadge';
import type { ResolvedNode } from '@/core/knowledge/types';
import { cn } from '@/lib/utils';
import { Icons } from '@/constants';


export interface NexusPanelProps {
  /** Saída de qualquer `ReaderAutoNexus` (bible, catechism, glossary…). */
  output: ReaderAutoNexusOutput;
  /** Ordem canônica dos buckets. Default: ordem já presente em `output.byBucket`. */
  order?: readonly ReaderNexusBucket[];
  /** Título do painel — omitido quando vazio. */
  title?: string;
  /** Subtítulo/kicker opcional acima do título. */
  kicker?: string;
  /** Classe extra no container raiz. */
  className?: string;
  /** Limite de itens por bucket (default 4). */
  limitPerBucket?: number;
}

const DEFAULT_LIMIT = 4;

export const NexusPanel: React.FC<NexusPanelProps> = ({
  output,
  order,
  title = 'Nexus Theologicus',
  kicker = 'Conexões desta passagem',
  className,
  limitPerBucket = DEFAULT_LIMIT,
}) => {
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    const handleUnreachable = () => setIsOffline(true);
    window.addEventListener('supabase-unreachable' as any, handleUnreachable);
    return () => window.removeEventListener('supabase-unreachable' as any, handleUnreachable);
  }, []);

  const buckets = (order ?? (Object.keys(output.byBucket) as ReaderNexusBucket[]))
    .filter((b) => (output.byBucket[b]?.length ?? 0) > 0);

  if (buckets.length === 0) {
    return (
      <aside className={cn(
        'w-full max-w-[68ch] mx-auto',
        'rounded-premium border border-primary/10 bg-muted/5',
        'p-spacing-lg space-y-spacing-sm opacity-60',
        className
      )}>
        <header className="flex items-center gap-spacing-sm text-muted-foreground">
          <Icons.Info className="w-5 h-5" />
          <h2 className="font-serif text-premium-base italic">Nexus Theologicus em Processamento</h2>
        </header>
        <p className="text-premium-xs text-muted-foreground/70 font-serif italic">
          O motor do Nexus está mapeando as conexões teológicas desta passagem. As referências aparecerão assim que a indexação for concluída.
        </p>
      </aside>
    );
  }


  const rootClass = [
    'w-full max-w-[68ch] mx-auto',
    'rounded-premium border border-primary/15 bg-card/60 backdrop-blur-sm',
    'p-spacing-lg space-y-spacing-md',
    'shadow-premium/10',
    className ?? '',
  ].join(' ');

  return (
    <aside className={rootClass} aria-label={title} data-nexus-panel>
      <header className="space-y-spacing-2xs">
        {kicker && (
          <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-secondary">
            NEXUS
          </p>
        )}
        {title && (
          <h2 className="font-serif text-premium-lg text-foreground">
            "Por que isso está conectado?"
          </h2>
        )}
        <span className="block h-[1px] w-spacing-3xl bg-gradient-to-r from-secondary/60 to-transparent" />
      </header>

      <div className="space-y-spacing-lg">
        {buckets.map((bucket) => {
          const nodes = (output.byBucket[bucket] ?? []).slice(0, limitPerBucket);
          const label = output.labels[bucket] ?? BUCKET_LABEL[bucket] ?? bucket;
          return (
            <section
              key={bucket}
              data-nexus-bucket={bucket}
              className="space-y-spacing-xs"
            >
              <h3 className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-secondary">
                CONEXÕES RELACIONADAS
              </h3>
              <ul className="space-y-spacing-xs">
                {nodes.map((r) => (
                  <NexusItem key={r.node.id} node={r} bucket={bucket} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
};

interface NexusItemProps {
  node: ResolvedNode;
  bucket: ReaderNexusBucket;
}

const NexusItem: React.FC<NexusItemProps> = ({ node, bucket }) => {
  const href = node.url;
  const label = node.node.label;
  const summary = node.node.summary;
  const nexusExplanation = (node.node as any).nexusExplanation;

  const body = (
    <>
      <div className="flex flex-col gap-spacing-2xs">
        <span className="font-semibold text-primary/90 group-hover:text-primary transition-colors">
          {label}
        </span>
        {nexusExplanation && (
          <p className="text-[10px] md:text-[11px] font-reader italic text-primary/80 leading-relaxed border-l-2 border-gold-text/40 pl-spacing-sm py-spacing-xs bg-gold/5 rounded-r-premium shadow-sm transition-all group-hover:bg-gold/10">
            {nexusExplanation}
          </p>
        )}
      </div>
      {summary && (
        <p className="mt-spacing-xs text-premium-xs text-muted-foreground/80 leading-relaxed font-reader">
          {summary}
        </p>
      )}
      <NexusSourceBadge node={node.node} />
    </>
  );

  return (
    <li
      className="flex gap-spacing-xs items-baseline"
      data-nexus-type={bucket}
    >
      <span
        aria-hidden
        className="mt-spacing-3xs inline-block w-spacing-2xs h-spacing-2xs rounded-premium-full bg-secondary/70"
      />
      <div className="flex-1 min-w-0">
        {href ? (
          <Link
            to={href}
            className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
            aria-label={`Abrir ${label}`}
          >
            {body}
          </Link>
        ) : (
          <div>{body}</div>
        )}
      </div>
    </li>
  );
};

export default NexusPanel;