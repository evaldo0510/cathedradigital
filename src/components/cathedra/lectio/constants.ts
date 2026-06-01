import { Icons } from '@/constants';


export type Step = 'intro' | 'lectio' | 'meditatio' | 'oratio' | 'contemplatio' | 'actio' | 'conclusio';

export const STEPS = [
  {
    id: 'lectio' as const,
    title: 'Leitura',
    latin: 'Lectio',
    instruction: 'Leia o texto sagrado com atenção, lentamente, como quem escuta a voz de Deus. Repita a leitura quantas vezes precisar.',
    prompt: 'O que diz o texto? Quais palavras ou frases chamam sua atenção?',
    icon: Book,
    color: 'text-primary bg-primary/10',
    duration: '5-10 min',
  },
  {
    id: 'meditatio' as const,
    title: 'Meditação',
    latin: 'Meditatio',
    instruction: 'Reflita sobre o que leu. Mastigue a Palavra como um alimento espiritual. Deixe-a penetrar no coração e na mente.',
    prompt: 'O que Deus está me dizendo através deste texto? Como isso se aplica à minha vida?',
    icon: Brain,
    color: 'text-secondary bg-secondary/10',
    duration: '10-15 min',
  },
  {
    id: 'oratio' as const,
    title: 'Oração',
    latin: 'Oratio',
    instruction: 'Responda a Deus com a oração que brota do coração. Fale com Ele sobre o que a meditação suscitou em você.',
    prompt: 'O que desejo dizer a Deus? Que graça pedir? Que louvor ou agradecimento oferecer?',
    icon: Sparkles,
    color: 'text-secondary bg-secondary/10',
    duration: '5-10 min',
  },
  {
    id: 'contemplatio' as const,
    title: 'Contemplação',
    latin: 'Contemplatio',
    instruction: 'Faça silêncio interior. Repouse na presença de Deus sem palavras, sem pensamentos, apenas acolhendo Seu amor.',
    prompt: 'Descanse em Deus. Não é preciso pensar nem falar — apenas estar.',
    icon: Sun,
    color: 'text-secondary bg-secondary/10',
    duration: '5-15 min',
  },
  {
    id: 'actio' as const,
    title: 'Ação',
    latin: 'Actio',
    instruction: 'Leve a Palavra para a vida concreta. Que resolução prática você faz a partir deste encontro com Deus?',
    prompt: 'O que vou fazer hoje como resposta à Palavra de Deus?',
    icon: Zap,
    color: 'text-primary bg-primary/10',
    duration: '2-5 min',
  },
];

export const SUGGESTED_PASSAGES = [
  { ref: 'Jo 1,1-18', title: 'Prólogo de São João' },
  { ref: 'Sl 23', title: 'O Senhor é meu pastor' },
  { ref: 'Lc 1,26-38', title: 'Anunciação' },
  { ref: 'Mt 5,1-12', title: 'Bem-aventuranças' },
  { ref: 'Rm 8,28-39', title: 'Nada nos separará do amor de Deus' },
  { ref: 'Is 55,1-11', title: 'Convite à água viva' },
  { ref: 'Jo 15,1-17', title: 'A videira e os ramos' },
  { ref: 'Fl 2,5-11', title: 'Hino cristológico' },
];

// Daily passage suggestion based on day of year
export function getDailyPassage() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return SUGGESTED_PASSAGES[dayOfYear % SUGGESTED_PASSAGES.length];
}
