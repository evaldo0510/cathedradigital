/**
 * fallback — rede de segurança da Sprint 1.
 *
 * Quando o grafo não devolve sugestões suficientes (0 candidatos ou todas
 * com `confidence = low`), o Continuation Engine cai neste conjunto
 * editorial fixo. Nenhuma tela termina em dead-end.
 *
 * Puro: só monta URLs a partir de `meta` já validado por `resolveContext`.
 * Nenhuma consulta ao KnowledgeGraph.
 */

import type {
  ContinuationContext,
  ContinuationSuggestion,
} from './types';
import { INTENT_EYEBROW } from './presets';

interface RawFallback {
  intent: ContinuationSuggestion['intent'];
  label: string;
  description?: string;
  href: string;
}

function toSuggestion(raw: RawFallback, index: number): ContinuationSuggestion {
  // Fallback herda confiança "medium" para primeiro item, "low" para o resto.
  // Score decrescente apenas para preservar ordem estável.
  const score = Math.max(10, 50 - index * 10);
  return {
    intent: raw.intent,
    eyebrow: INTENT_EYEBROW[raw.intent],
    label: raw.label,
    description: raw.description,
    href: raw.href,
    score,
    confidence: index === 0 ? 'medium' : 'low',
    reasons: ['fallback editorial'],
    source: 'fallback',
  };
}

export function fallbackSuggestions(
  ctx: ContinuationContext,
): ContinuationSuggestion[] {
  const raw: RawFallback[] = [];
  const meta = ctx.meta;

  switch (ctx.kind) {
    case 'bible': {
      const { bookAbbr, chapter, totalChapters, paragraph } = meta;
      if (bookAbbr && chapter && (!totalChapters || chapter < totalChapters)) {
        raw.push({
          intent: 'study',
          label: 'Próximo capítulo',
          description: `${bookAbbr.toUpperCase()} ${chapter + 1}`,
          href: `/bible?book=${bookAbbr}&chapter=${chapter + 1}`,
        });
      }
      if (paragraph) {
        raw.push({
          intent: 'deepen',
          label: 'Abrir no Catecismo',
          description: `§${paragraph}`,
          href: `/catechism?p=${paragraph}`,
        });
      }
      raw.push({
        intent: 'pray',
        label: 'Rezar agora',
        description: 'Levar a leitura à oração',
        href: '/oracao',
      });
      break;
    }
    case 'catechism': {
      const { paragraph, nextParagraph } = meta;
      const next = nextParagraph ?? (paragraph ? paragraph + 1 : undefined);
      if (next) {
        raw.push({
          intent: 'study',
          label: 'Próximo parágrafo',
          description: `§${next}`,
          href: `/catechism?p=${next}`,
        });
      }
      raw.push({
        intent: 'study',
        label: 'Ver na Bíblia',
        description: 'Referências da Sagrada Escritura',
        href: '/bible',
      });
      raw.push({
        intent: 'apply',
        label: 'Aprofundar em jornada',
        description: 'Estudo guiado sobre este tema',
        href: '/jornadas',
      });
      break;
    }
    case 'magisterium': {
      raw.push({
        intent: 'apply',
        label: 'Aprofundar em jornada',
        description: 'Estudos guiados relacionados',
        href: '/jornadas',
      });
      raw.push({
        intent: 'study',
        label: 'Explorar temas',
        description: 'Buscar assuntos deste documento',
        href: meta.theme ? `/buscar?q=${encodeURIComponent(meta.theme)}` : '/buscar',
      });
      raw.push({
        intent: 'pray',
        label: 'Rezar agora',
        description: 'Meditar a doutrina em oração',
        href: '/oracao',
      });
      break;
    }
    case 'saint': {
      raw.push({
        intent: 'meet',
        label: 'Próximo santo',
        description: 'Continuar pelo santoral',
        href: '/santos',
      });
      raw.push({
        intent: 'pray',
        label: 'Rezar com este santo',
        description: 'Orações da tradição',
        href: '/oracao',
      });
      raw.push({
        intent: 'meet',
        label: 'Vidas relacionadas',
        description: 'Padres e mestres espirituais',
        href: '/santos',
      });
      break;
    }
    case 'journey-step': {
      const { journeyId, nextStepId } = meta;
      if (journeyId && nextStepId) {
        raw.push({
          intent: 'study',
          label: 'Próxima etapa',
          description: 'Continuar o itinerário',
          href: `/jornadas/${journeyId}/step?step=${nextStepId}`,
        });
      }
      raw.push({
        intent: 'apply',
        label: 'Jornadas relacionadas',
        description: 'Outros caminhos de formação',
        href: '/jornadas',
      });
      raw.push({
        intent: 'pray',
        label: 'Rezar agora',
        description: 'Recolher-se em oração',
        href: '/oracao',
      });
      break;
    }
  }

  if (raw.length === 0) {
    raw.push(
      {
        intent: 'apply',
        label: 'Continuar Jornada',
        description: 'Retomar o estudo',
        href: '/jornadas',
      },
      {
        intent: 'study',
        label: 'Voltar à Biblioteca',
        description: 'Explorar outros conteúdos',
        href: '/biblioteca',
      },
    );
  }

  return raw.slice(0, 3).map((r, i) => toSuggestion(r, i));
}
