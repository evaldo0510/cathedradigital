import { AppRoute } from "@/types";

export interface TrailStep {
  id: string;
  title: string;
  description?: string;
  type: 'catechism' | 'bible' | 'video' | 'quiz';
  ref: string; // e.g., "1324" for catechism, "Gen 1:1" for bible
}

export interface StudyTrail {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  tags: string[];
  steps: TrailStep[];
  imageUrl?: string;
}

export const STUDY_TRAILS: StudyTrail[] = [
  {
    id: 'intro-faith',
    slug: 'introducao-a-fe',
    title: 'Introdução à Fé Católica',
    description: 'Os primeiros passos para compreender o desígnio de amor de Deus.',
    level: 'Iniciante',
    tags: ['introdução', 'fé', 'deus'],
    steps: [
      { id: 'step-1', title: 'O desejo de Deus', type: 'catechism', ref: '27' },
      { id: 'step-2', title: 'A Revelação', type: 'catechism', ref: '50' },
      { id: 'step-3', title: 'A Fé', type: 'catechism', ref: '142' }
    ]
  },
  {
    id: 'eucharist-mystery',
    slug: 'misterio-da-eucaristia',
    title: 'O Mistério da Eucaristia',
    description: 'Aprofunde-se no Sacramento que é o centro da vida da Igreja.',
    level: 'Intermediário',
    tags: ['eucaristia', 'sacramentos'],
    steps: [
      { id: 'step-1', title: 'Fonte e Cume', type: 'catechism', ref: '1324' },
      { id: 'step-2', title: 'Presença Real', type: 'catechism', ref: '1373' }
    ]
  }
];

export const getTrails = () => STUDY_TRAILS;
export const getTrailBySlug = (slug: string) => STUDY_TRAILS.find(t => t.slug === slug);
