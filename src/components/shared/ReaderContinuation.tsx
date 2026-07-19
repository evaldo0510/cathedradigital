/**
 * ReaderContinuation — bloco de continuidade ao final de qualquer leitura.
 *
 * Objetivo (Sprint 1 — Fechar Dead-Ends): nenhuma tela termina sem uma
 * próxima ação clara. Componente único e agnóstico, plugado ao final de:
 * Bíblia, Catecismo, Magistério, Santos e Etapa de Jornada.
 *
 * Renderiza 2–3 CTAs contextuais + fallback universal ("Continuar Jornada" /
 * "Voltar à Biblioteca"). Respeita tokens Logos 2030 (Cormorant + Karla,
 * borda dourada fina), tap targets ≥44px e foco visível.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import {
  resolveContinuation,
  type ContinuationSuggestion,
  type KnowledgeNodeId,
} from '@/core/knowledge';
import { INTENT_ICON, KIND_GRAPH_TITLE } from './ReaderContinuation.presets';
import { telemetry } from '@/utils/navigation-telemetry';

export type ReaderContinuationKind =
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'saint'
  | 'journey-step'
  | 'prayer'
  | 'glossary-term';

export interface ReaderContinuationContext {
  kind: ReaderContinuationKind;
  /** ID canônico (ex.: "gen-1", "142", "gaudium-et-spes", "sao-francisco", "step-uuid"). */
  id?: string;
  /**
   * ID canônico do nó no KnowledgeGraph (Sprint 2). Se presente e
   * resolvível, o motor de continuidade tenta gerar sugestões reais
   * antes de cair no fallback editorial.
   */
  graphNodeId?: KnowledgeNodeId;
  /** Temas associados (Sprint 2). Enriquece a resolução do grafo. */
  themeIds?: KnowledgeNodeId[];
  /** Metadados opcionais usados para calcular o próximo item (fallback). */
  meta?: {
    bookAbbr?: string;
    chapter?: number;
    totalChapters?: number;
    paragraph?: number;
    nextParagraph?: number;
    journeyId?: string;
    nextStepId?: string;
    theme?: string;
    /** Slug da próxima oração (para kind='prayer'). */
    nextPrayerSlug?: string;
    /** Categoria atual da oração (para agrupar sugestões). */
    prayerCategory?: string;
  };
}

interface Suggestion {
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary';
  onClick?: () => void;
}

function buildSuggestions(ctx: ReaderContinuationContext): Suggestion[] {
  const out: Suggestion[] = [];
  const { kind, meta = {} } = ctx;

  switch (kind) {
    case 'bible': {
      const { bookAbbr, chapter, totalChapters, paragraph } = meta;
      if (bookAbbr && chapter && (!totalChapters || chapter < totalChapters)) {
        out.push({
          label: `Próximo capítulo`,
          description: `${bookAbbr.toUpperCase()} ${chapter + 1}`,
          href: `/bible?book=${bookAbbr}&chapter=${chapter + 1}`,
          icon: Icons.ChevronRight,
          variant: 'primary',
        });
      }
      if (paragraph) {
        out.push({
          label: 'Abrir no Catecismo',
          description: `§${paragraph}`,
          href: `/catechism?p=${paragraph}`,
          icon: Icons.Church,
          variant: 'secondary',
        });
      }
      out.push({
        label: 'Rezar agora',
        description: 'Levar a leitura à oração',
        href: '/oracao',
        icon: Icons.Flame,
        variant: 'secondary',
      });
      break;
    }
    case 'catechism': {
      const { paragraph, nextParagraph } = meta;
      const next = nextParagraph ?? (paragraph ? paragraph + 1 : undefined);
      if (next) {
        out.push({
          label: 'Próximo parágrafo',
          description: `§${next}`,
          href: `/catechism?p=${next}`,
          icon: Icons.ChevronRight,
          variant: 'primary',
        });
      }
      out.push({
        label: 'Ver na Bíblia',
        description: 'Referências da Sagrada Escritura',
        href: '/bible',
        icon: Icons.Book,
        variant: 'secondary',
      });
      out.push({
        label: 'Aprofundar em jornada',
        description: 'Estudo guiado sobre este tema',
        href: '/jornadas',
        icon: Icons.Map,
        variant: 'secondary',
      });
      break;
    }
    case 'magisterium': {
      out.push({
        label: 'Aprofundar em jornada',
        description: 'Estudos guiados relacionados',
        href: '/jornadas',
        icon: Icons.Map,
        variant: 'primary',
      });
      out.push({
        label: 'Explorar temas',
        description: 'Buscar assuntos deste documento',
        href: meta.theme ? `/buscar?q=${encodeURIComponent(meta.theme)}` : '/buscar',
        icon: Icons.Search,
        variant: 'secondary',
      });
      out.push({
        label: 'Rezar agora',
        description: 'Meditar a doutrina em oração',
        href: '/oracao',
        icon: Icons.Flame,
        variant: 'secondary',
      });
      break;
    }
    case 'saint': {
      out.push({
        label: 'Próximo santo',
        description: 'Continuar pelo santoral',
        href: '/santos',
        icon: Icons.ChevronRight,
        variant: 'primary',
      });
      out.push({
        label: 'Rezar com este santo',
        description: 'Orações da tradição',
        href: '/oracao',
        icon: Icons.Flame,
        variant: 'secondary',
      });
      out.push({
        label: 'Vidas relacionadas',
        description: 'Padres e mestres espirituais',
        href: '/santos',
        icon: Icons.User,
        variant: 'secondary',
      });
      break;
    }
    case 'journey-step': {
      const { journeyId, nextStepId } = meta;
      if (journeyId && nextStepId) {
        out.push({
          label: 'Próxima etapa',
          description: 'Continuar o itinerário',
          href: `/jornadas/${journeyId}/step?step=${nextStepId}`,
          icon: Icons.ChevronRight,
          variant: 'primary',
        });
      }
      out.push({
        label: 'Jornadas relacionadas',
        description: 'Outros caminhos de formação',
        href: '/jornadas',
        icon: Icons.Map,
        variant: 'secondary',
      });
      out.push({
        label: 'Rezar agora',
        description: 'Recolher-se em oração',
        href: '/oracao',
        icon: Icons.Flame,
        variant: 'secondary',
      });
      break;
    }
    case 'prayer': {
      const { nextPrayerSlug } = meta;
      if (nextPrayerSlug) {
        out.push({
          label: 'Próxima oração',
          description: 'Continuar no Livro de Orações',
          href: `/oracao/${nextPrayerSlug}`,
          icon: Icons.ChevronRight,
          variant: 'primary',
        });
      }
      out.push({
        label: 'Voltar ao índice',
        description: 'Livro de Orações',
        href: '/oracao',
        icon: Icons.Book,
        variant: 'secondary',
      });
      out.push({
        label: 'Meditar na Escritura',
        description: 'Buscar passagens relacionadas',
        href: '/bible',
        icon: Icons.Flame,
        variant: 'secondary',
      });
      break;
    }
  }

  // Fallback universal — sempre presente ao menos como âncora.
  if (out.length === 0) {
    out.push(
      {
        label: 'Continuar Jornada',
        description: 'Retomar o estudo',
        href: '/jornadas',
        icon: Icons.Map,
        variant: 'primary',
      },
      {
        label: 'Voltar à Biblioteca',
        description: 'Explorar outros conteúdos',
        href: '/biblioteca',
        icon: Icons.Library,
        variant: 'secondary',
      },
    );
  }

  return out.slice(0, 3);
}

const KIND_TITLE: Record<ReaderContinuationKind, string> = {
  bible: 'Continuar seu estudo',
  catechism: 'Próximo passo',
  magisterium: 'Aprofundar a contemplação',
  saint: 'Continuar pela comunhão dos santos',
  'journey-step': 'Seguir na formação',
  prayer: 'Continuar na oração',
};

const KIND_EPIGRAPH: Record<ReaderContinuationKind, string> = {
  bible: '“A tua palavra é lâmpada para os meus pés.” — Sl 119,105',
  catechism: '“A leitura busca, a meditação encontra.” — Guigo, o Cartuxo',
  magisterium: '“Fides quaerens intellectum.” — Sto. Anselmo',
  saint: '“Ide, e fazei o mesmo.” — Lc 10,37',
  'journey-step': '“Corramos com perseverança a prova que nos está proposta.” — Hb 12,1',
  prayer: '“Orai sem cessar.” — 1Ts 5,17',
};

export interface ReaderContinuationProps {
  context: ReaderContinuationContext;
  className?: string;
  /** Callback opcional para telemetria quando um CTA é acionado. */
  onCtaClick?: (suggestion: { label: string; href: string; kind: string }) => void;
}

/**
 * Adapta uma sugestão vinda do KnowledgeGraph para o formato interno
 * de render. Mantém a mesma UI dos CTAs de fallback (zero divergência).
 */
function fromGraphSuggestion(
  s: ContinuationSuggestion,
  index: number,
): Suggestion {
  const Icon = INTENT_ICON[s.intent] ?? Icons.ChevronRight;
  return {
    label: s.label,
    description: s.eyebrow,
    href: s.target.url ?? '#',
    icon: Icon,
    variant: index === 0 ? 'primary' : 'secondary',
  };
}

export const ReaderContinuation: React.FC<ReaderContinuationProps> = ({
  context,
  className,
  onCtaClick,
}) => {
  // 1) Tenta resolver via KnowledgeGraph (Sprint 2).
  const graphSuggestions = React.useMemo<ContinuationSuggestion[]>(() => {
    if (!context.graphNodeId && (!context.themeIds || context.themeIds.length === 0)) {
      return [];
    }
    return resolveContinuation({
      currentKind: context.kind === 'journey-step' ? 'journey-step' : context.kind,
      currentId: context.graphNodeId,
      themeIds: context.themeIds,
    });
  }, [context.graphNodeId, context.themeIds, context.kind]);

  const usedGraph = graphSuggestions.length > 0;

  // 2) Fallback editorial da Sprint 1 quando o grafo não devolve nada.
  const suggestions = React.useMemo<Suggestion[]>(() => {
    if (usedGraph) return graphSuggestions.map(fromGraphSuggestion);
    return buildSuggestions(context);
  }, [usedGraph, graphSuggestions, context]);

  const title = usedGraph
    ? KIND_GRAPH_TITLE[context.kind] ?? KIND_TITLE[context.kind]
    : KIND_TITLE[context.kind];
  const epigraph = KIND_EPIGRAPH[context.kind];

  // 3) Telemetria: `shown` uma vez por conjunto de sugestões.
  React.useEffect(() => {
    telemetry.log('reader.continuation.shown', 'info', {
      kind: context.kind,
      source: usedGraph ? 'graph' : 'fallback',
      count: suggestions.length,
      intents: usedGraph ? graphSuggestions.map((g) => g.intent) : undefined,
    });
    // Intencional: dispara ao mudar de conteúdo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.kind, context.graphNodeId, context.id, usedGraph]);

  return (
    <aside
      aria-label="Próximos passos de leitura"
      data-reader-continuation={context.kind}
      data-source={usedGraph ? 'graph' : 'fallback'}
      className={cn(
        'reader-continuation w-full max-w-[70ch] mx-auto',
        'mt-spacing-3xl pt-spacing-2xl',
        'border-t border-secondary/30',
        className,
      )}
    >
      <header className="text-center mb-spacing-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/80">
          Itinerarium
        </p>
        <h3 className="mt-spacing-xs font-display text-premium-xl text-foreground">
          {title}
        </h3>
        <p className="mt-spacing-xs text-premium-xs italic text-muted-foreground font-serif">
          {epigraph}
        </p>
      </header>

      <ul className="flex flex-col gap-spacing-sm" role="list">
        {suggestions.map((s, idx) => {
          const Icon = s.icon;
          const isPrimary = s.variant === 'primary';
          const graphIntent = usedGraph ? graphSuggestions[idx]?.intent : undefined;
          return (
            <li key={`${s.label}-${s.href}`}>
              <Link
                to={s.href}
                onClick={() => {
                  telemetry.log('reader.continuation.click', 'info', {
                    kind: context.kind,
                    source: usedGraph ? 'graph' : 'fallback',
                    intent: graphIntent,
                    href: s.href,
                    position: idx,
                  });
                  onCtaClick?.({ label: s.label, href: s.href, kind: context.kind });
                }}
                className={cn(
                  'group flex items-center gap-spacing-md',
                  'min-h-[44px] px-spacing-lg py-spacing-md rounded-premium-lg',
                  'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isPrimary
                    ? 'bg-primary text-primary-foreground shadow-premium hover:brightness-110'
                    : 'border border-primary/10 bg-background/60 text-foreground hover:border-secondary/40 hover:bg-secondary/5',
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-11 h-11 rounded-premium-full flex-shrink-0',
                    isPrimary ? 'bg-primary-foreground/10' : 'bg-primary/5 text-secondary',
                  )}
                  aria-hidden="true"
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex flex-col min-w-0 flex-1 text-left">
                  <span
                    className={cn(
                      'text-premium-sm font-bold uppercase tracking-[0.14em]',
                      isPrimary ? 'text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {s.label}
                  </span>
                  {s.description && (
                    <span
                      className={cn(
                        'text-premium-xs font-serif italic truncate',
                        isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground',
                      )}
                    >
                      {s.description}
                    </span>
                  )}
                </span>
                <Icons.ChevronRight
                  className={cn(
                    'w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5',
                    isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default ReaderContinuation;
