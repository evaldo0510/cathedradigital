/**
 * portalTheme — resolvedor universal de tema/ícone/quote para o PrayerPortal.
 *
 * Onda 1 de B.2.5.d — centraliza o mapeamento por slug de oração para que
 * Rosário, Via Sacra, Breviário, Missal e as orações comuns v2 herdem uma
 * identidade visual coerente sem duplicação nos consumidores.
 */
import {
  Sparkles,
  Cross,
  Sunrise,
  Sun,
  Sunset,
  MoonStar,
  BookOpen,
  Church,
  Flame,
  Feather,
  type LucideIcon,
} from 'lucide-react';
import type { PrayerPortalTheme } from '@/components/prayer/PrayerPortal';

export interface ResolvedPortalTheme {
  theme: PrayerPortalTheme;
  accentIcon: LucideIcon;
  quote?: { text: string; ref: string };
}

/**
 * Mapa por slug conhecido. Slugs não listados caem no default `church` +
 * `Sparkles` (identidade dourada padrão).
 */
const BY_SLUG: Record<string, ResolvedPortalTheme> = {
  // — Devoções contemplativas —
  rosario: { theme: 'church', accentIcon: Sparkles, quote: { text: 'Permanecei em mim, e eu em vós.', ref: 'Jo 15,4' } },
  'via-sacra': { theme: 'passion', accentIcon: Cross, quote: { text: 'Se alguém quer vir após mim, tome a sua cruz.', ref: 'Mt 16,24' } },
  viacrucis: { theme: 'passion', accentIcon: Cross, quote: { text: 'Se alguém quer vir após mim, tome a sua cruz.', ref: 'Mt 16,24' } },

  // — Ofício Divino (hora resolvida dinamicamente em BreviaryPage) —
  'liturgia-das-horas': { theme: 'church', accentIcon: Church, quote: { text: 'Sete vezes por dia eu vos louvo.', ref: 'Sl 118,164' } },

  // — Orações comuns v2 —
  'pai-nosso': { theme: 'church', accentIcon: Sparkles, quote: { text: 'Vós, portanto, orai assim.', ref: 'Mt 6,9' } },
  'ave-maria': { theme: 'church', accentIcon: Sparkles, quote: { text: 'Ave, cheia de graça, o Senhor é contigo.', ref: 'Lc 1,28' } },
  'gloria-ao-pai': { theme: 'church', accentIcon: Sparkles, quote: { text: 'Glória ao Pai, ao Filho e ao Espírito Santo.', ref: 'Doxologia' } },
  credo: { theme: 'church', accentIcon: Church, quote: { text: 'Creio em um só Deus, Pai todo-poderoso.', ref: 'Symbolum' } },
  'salve-rainha': { theme: 'church', accentIcon: Sparkles, quote: { text: 'A vós bradamos, os degredados filhos de Eva.', ref: 'Antífona' } },
  angelus: { theme: 'noon', accentIcon: Sun, quote: { text: 'O Anjo do Senhor anunciou a Maria.', ref: 'Lc 1,26-38' } },
  'regina-caeli': { theme: 'dawn', accentIcon: Sunrise, quote: { text: 'Rainha do céu, alegrai-vos, aleluia!', ref: 'Antífona pascal' } },
  magnificat: { theme: 'sunset', accentIcon: Sunset, quote: { text: 'A minha alma engrandece o Senhor.', ref: 'Lc 1,46' } },
  'te-deum': { theme: 'church', accentIcon: Flame, quote: { text: 'A vós, ó Deus, louvamos.', ref: 'Te Deum' } },
  'veni-creator': { theme: 'church', accentIcon: Flame, quote: { text: 'Vinde, Espírito Criador.', ref: 'Hymnarium Romanum' } },
  'exame-de-consciencia': { theme: 'passion', accentIcon: Cross, quote: { text: 'Se confessarmos os nossos pecados, Ele é fiel e justo para nos perdoar.', ref: '1Jo 1,9' } },
  'oracao-pela-sabedoria': { theme: 'church', accentIcon: Sparkles, quote: { text: 'Enviai-a dos vossos santos céus, para que trabalhe comigo.', ref: 'Sb 9,10' } },

  // — Missal Romano —
  'missa-ordinario': { theme: 'church', accentIcon: Church, quote: { text: 'Fazei isto em memória de mim.', ref: 'Lc 22,19' } },
  missal: { theme: 'church', accentIcon: Church, quote: { text: 'Fazei isto em memória de mim.', ref: 'Lc 22,19' } },

  // — Lectio Divina (preparado para Onda 2) —
  lectio: { theme: 'dawn', accentIcon: BookOpen, quote: { text: 'Fala, Senhor, que teu servo escuta.', ref: '1Sm 3,10' } },
};

/**
 * Resolve o tema visual a partir do slug da oração.
 * Sempre retorna algo — nunca `undefined` — para simplificar o consumidor.
 */
export function resolvePortalTheme(slug: string): ResolvedPortalTheme {
  return BY_SLUG[slug] ?? { theme: 'church', accentIcon: Feather };
}
