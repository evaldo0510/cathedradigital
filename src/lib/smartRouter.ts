/**
 * Smart Routing Engine
 * Analyzes user reflection text and routes to the most relevant module.
 */

import { AppRoute } from '@/types';

export interface RouteRecommendation {
  route: string;
  label: string;
  icon: string;
  reason: string;
}

const EMOTION_KEYWORDS = [
  'ansiedade', 'ansioso', 'medo', 'triste', 'tristeza', 'angústia', 'angustia',
  'dor', 'sofrimento', 'choro', 'chorei', 'solidão', 'solidao', 'vazio',
  'cansado', 'cansaço', 'exausto', 'perdido', 'confuso', 'raiva', 'culpa',
  'vergonha', 'depressão', 'depressao', 'desespero', 'saudade', 'luto',
  'ferida', 'ferido', 'machucado', 'abandonado', 'rejeitado', 'frustração',
];

const DOUBT_KEYWORDS = [
  'dúvida', 'duvida', 'não entendo', 'nao entendo', 'por que', 'porque',
  'como assim', 'será que', 'sera que', 'não sei', 'nao sei', 'questiono',
  'questão', 'questao', 'pergunta', 'sentido', 'significado', 'razão',
  'explicar', 'explicação', 'teologia', 'filosofia', 'lógica', 'logica',
];

const MORAL_KEYWORDS = [
  'pecado', 'pecador', 'errado', 'certo', 'moral', 'ética', 'etica',
  'consciência', 'consciencia', 'conflito', 'dilema', 'tentação', 'tentacao',
  'perdão', 'perdao', 'confissão', 'confissao', 'arrependimento', 'justiça',
  'justica', 'mandamento', 'lei', 'dever', 'obrigação', 'virtude', 'vício',
];

const SPIRITUAL_KEYWORDS = [
  'oração', 'oracao', 'rezar', 'missa', 'eucaristia', 'sacramento',
  'presença', 'presenca', 'Deus', 'Jesus', 'Espírito', 'espirito',
  'sagrado', 'divino', 'contemplação', 'contemplacao', 'silêncio', 'silencio',
  'adoração', 'adoracao', 'louvor', 'liturgia', 'comunhão', 'comunhao',
  'graça', 'graca', 'bênção', 'bencao', 'consagração', 'vocação',
];

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, kw) => count + (lower.includes(kw) ? 1 : 0), 0);
}

export function detectCategories(text: string) {
  return {
    emotion: countMatches(text, EMOTION_KEYWORDS),
    doubt: countMatches(text, DOUBT_KEYWORDS),
    moral: countMatches(text, MORAL_KEYWORDS),
    spiritual: countMatches(text, SPIRITUAL_KEYWORDS),
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
      case 'emotion':
        routes.push({
          route: AppRoute.JORNADAS,
          label: 'Jornada de Transformação',
          icon: '🌱',
          reason: 'Para acolher o que você sente',
        });
        routes.push({
          route: AppRoute.SAINTS,
          label: 'Santos que viveram isso',
          icon: '🌟',
          reason: 'Encontre identificação',
        });
        break;
      case 'doubt':
        routes.push({
          route: AppRoute.AQUINAS_OPERA,
          label: 'Aquinas — Clareza',
          icon: '🧠',
          reason: 'Para iluminar suas dúvidas',
        });
        routes.push({
          route: AppRoute.GLOSSARY,
          label: 'Glossário Teológico',
          icon: '📖',
          reason: 'Entenda os termos',
        });
        break;
      case 'moral':
        routes.push({
          route: AppRoute.CATECHISM,
          label: 'Catecismo',
          icon: '📘',
          reason: 'O que a Igreja ensina',
        });
        routes.push({
          route: AppRoute.MAGISTERIUM,
          label: 'Magistério',
          icon: '🧭',
          reason: 'Direção segura',
        });
        break;
      case 'spiritual':
        routes.push({
          route: `${AppRoute.LITURGIA}?tab=liturgia`,
          label: 'Liturgia Viva',
          icon: '🕊️',
          reason: 'Viva o mistério',
        });
        routes.push({
          route: AppRoute.ORACAO,
          label: 'Oração',
          icon: '🙏',
          reason: 'Aprofunde sua oração',
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
        icon: '🌱',
        reason: 'Continue sua transformação',
      },
      {
        route: AppRoute.LECTIO_DIVINA,
        label: 'Nova Lectio',
        icon: '📖',
        reason: 'Aprofunde na Palavra',
      },
      {
        route: AppRoute.COMMUNITY,
        label: 'Comunidade',
        icon: '🤝',
        reason: 'Compartilhe sua experiência',
      },
    );
  }

  // Always add community as last if not already there
  if (!routes.find(r => r.route === AppRoute.COMMUNITY)) {
    routes.push({
      route: AppRoute.COMMUNITY,
      label: 'Compartilhar',
      icon: '🤝',
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
