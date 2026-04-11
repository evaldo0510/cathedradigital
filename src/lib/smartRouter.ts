/**
 * Smart Routing Engine
 * Analyzes user reflection text and routes to the most relevant module.
 */

import { AppRoute } from '@/types';

export interface RouteRecommendation {
  route: string;
  label: string;
  icon: string; // Key for Icons component
  reason: string;
}

const ANSIEDADE_KEYWORDS = [
  'ansiedade', 'ansioso', 'ansiosa', 'agitação', 'agitacao', 'agitado', 'agitada',
  'pressa', 'correndo', 'acelerado', 'acelerada', 'controle', 'controlar', 'impaciência',
  'impaciencia', 'impaciente', 'nervoso', 'nervosa', 'preocupação', 'preocupado',
];

const CONFUSAO_KEYWORDS = [
  'confusão', 'confusao', 'confuso', 'confusa', 'falta de clareza', 'dúvida', 'duvida',
  'incerteza', 'não sei', 'nao sei', 'perdido', 'perdida', 'desorientado', 'desorientada',
  'obscuro', 'obscura', 'questionamento', 'não entendo', 'nao entendo',
];

const DOR_EMOCIONAL_KEYWORDS = [
  'dor', 'sofrimento', 'tristeza', 'triste', 'angústia', 'angustia', 'culpa', 'culpado',
  'culpada', 'medo', 'temor', 'vazio', 'solidão', 'solidao', 'ferida', 'ferido',
  'ferida', 'abandono', 'abandonado', 'rejeição', 'rejeitado', 'desespero', 'sofrer',
];

const BUSCA_ESPIRITUAL_KEYWORDS = [
  'sentido', 'significado', 'crescimento', 'crescer', 'profundidade', 'profundo',
  'profunda', 'propósito', 'proposito', 'Deus', 'Jesus', 'Espírito', 'espirito',
  'oração', 'oracao', 'alma', 'interior', 'transcendência', 'transcendencia',
  'busca', 'buscando', 'encontrar', 'verdade',
];

const VIRTUDES_E_MISSAO_KEYWORDS = [
  'fé', 'fe', 'esperança', 'esperanca', 'caridade', 'virtude', 'santidade', 'santo', 'santa',
  'humildade', 'humilde', 'missão', 'missao', 'vocação', 'vocacao', 'chamado', 'perdão',
  'perdao', 'misericórdia', 'misericordia', 'amor', 'caridade',
];

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, kw) => count + (lower.includes(kw) ? 1 : 0), 0);
}

export function detectCategories(text: string) {
  return {
    ansiedade: countMatches(text, ANSIEDADE_KEYWORDS),
    confusao: countMatches(text, CONFUSAO_KEYWORDS),
    dor_emocional: countMatches(text, DOR_EMOCIONAL_KEYWORDS),
    busca_espiritual: countMatches(text, BUSCA_ESPIRITUAL_KEYWORDS),
  };
}

export function routeUser(reflectionText: string): RouteRecommendation[] {
  const scores = detectCategories(reflectionText);

  const routes: RouteRecommendation[] = [];

  // Sort by score and build recommendations
  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  for (const [category] of ranked) {
    switch (category) {
      case 'ansiedade':
        routes.push({
          route: AppRoute.JORNADAS,
          label: 'Rotina de Transformação',
          icon: 'Calendar',
          reason: 'Para desacelerar e encontrar paz',
        });
        routes.push({
          route: AppRoute.ORACAO,
          label: 'Oração e Silêncio',
          icon: 'Sparkles',
          reason: 'Acalme seu coração',
        });
        break;
      case 'confusao':
        routes.push({
          route: AppRoute.CATECHISM,
          label: 'Fundamentos da Fé',
          icon: 'FileText',
          reason: 'Para trazer clareza à sua busca',
        });
        routes.push({
          route: AppRoute.AQUINAS_OPERA,
          label: 'Aquinas — Razão',
          icon: 'Brain',
          reason: 'Luz para o intelecto',
        });
        break;
      case 'dor_emocional':
        routes.push({
          route: AppRoute.JORNADAS,
          label: 'Caminho de Cura',
          icon: 'Heart',
          reason: 'Para tratar as feridas da alma',
        });
        routes.push({
          route: AppRoute.SAINTS,
          label: 'Exemplos de Superação',
          icon: 'Star',
          reason: 'Você não está sozinho',
        });
        break;
      case 'busca_espiritual':
        routes.push({
          route: AppRoute.LECTIO_DIVINA,
          label: 'Lectio Divina',
          icon: 'BookOpen',
          reason: 'Aprofunde-se na Palavra',
        });
        routes.push({
          route: AppRoute.JORNADAS,
          label: 'Jornada Mística',
          icon: 'Dove',
          reason: 'Busque a união com Deus',
        });
        break;
    }
  }

  // If no keywords matched, give default suggestions
  if (routes.length === 0) {
    routes.push(
      {
        route: AppRoute.JORNADAS,
        label: 'Iniciar uma Jornada',
        icon: 'Compass',
        reason: 'Continue sua transformação',
      },
      {
        route: AppRoute.LECTIO_DIVINA,
        label: 'Nova Lectio',
        icon: 'BookOpen',
        reason: 'Aprofunde na Palavra',
      },
      {
        route: AppRoute.COMMUNITY,
        label: 'Comunidade',
        icon: 'Users',
        reason: 'Compartilhe sua experiência',
      },
    );
  }

  // Always add community as last if not already there
  if (!routes.find(r => r.route === AppRoute.COMMUNITY)) {
    routes.push({
      route: AppRoute.COMMUNITY,
      label: 'Compartilhar',
      icon: 'Users',
      reason: 'Conecte-se com outros',
    });
  }

  // Return max 4 unique routes
  const seen = new Set<string>();
  return routes.filter(r => {
    if (seen.has(r.route)) return false;
    seen.add(r.route);
    return true;
  }).slice(0, 4);
}