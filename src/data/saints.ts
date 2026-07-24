import { DeepContent } from '@/types';

export interface SaintWork {
  title: string;
  url?: string;
  year?: string;
}

// Sanctorum 2.0 — estruturas editoriais expandidas
export type SaintContentStatus = 'stub' | 'partial' | 'complete';

export type SaintTimelineEventType =
  | 'birth'
  | 'conversion'
  | 'formation'
  | 'mission'
  | 'work'
  | 'miracle'
  | 'martyrdom'
  | 'death'
  | 'canonization'
  | 'feast';

export interface SaintTimelineEvent {
  year?: string | number;
  event: string;
  type?: SaintTimelineEventType;
  place?: string;
}

export interface SaintBiographyBlocks {
  origem?: string;
  chamado?: string;
  conversao?: string;
  missao?: string;
  fidelidade?: string;
  testemunho?: string;
  heranca?: string;
  aprendizado?: string;
}

export interface SaintKeyEvent {
  year?: string | number;
  title: string;
  description?: string;
  place?: string;
}

export interface SaintQuoteRich {
  text: string;
  source?: string;
  reference?: string;
}

export interface SaintSource {
  title: string;
  author?: string;
  url?: string;
  year?: string;
}

export interface SaintIconographyData {
  symbols?: string[];
  attributes?: string[];
  colors?: string[];
  vestments?: string[];
}

export interface SaintSpiritualPracticeData {
  live_today?: string;
  prayer?: string;
  purpose?: string;
  examination?: string[];
  practice?: string;
}

export interface SaintMiracle {
  title?: string;
  description: string;
  year?: string | number;
  place?: string;
}

export interface Saint extends Partial<DeepContent> {
  id: string;
  name: string;
  title: string;
  feastDay: string;
  feastMonth: number;
  feastDayNum: number;
  born: string;
  died: string;
  patronOf: string[];
  bio: string;
  fullBio?: string;
  works: SaintWork[];
  quotes: string[];
  category: 'apostle' | 'martyr' | 'doctor' | 'virgin' | 'confessor' | 'pope' | 'founder' | 'mystic';
  image?: string;
  prayer?: string;
  virtues?: string[];
  bibleRefs?: { ref: string; label: string }[];
  catechismRefs?: number[];
  churchDocRefs?: { title: string; url: string }[];
  // Sanctorum 2.0
  biographyFull?: SaintBiographyBlocks;
  historicalContext?: string;
  century?: number;
  timeline?: SaintTimelineEvent[];
  miracles?: SaintMiracle[];
  iconography?: SaintIconographyData;
  patronages?: string[];
  curiosities?: string[];
  sources?: SaintSource[];
  spiritualPractice?: SaintSpiritualPracticeData;
  quotesRich?: SaintQuoteRich[];
  contentStatus?: SaintContentStatus;
  // v3 — Biblioteca Viva
  country?: string;
  vocation?: string;
  aiReflection?: SaintAIReflection;
  // Onda 2 — complementos editoriais (TEXT)
  // Onda 2 — complementos editoriais (TEXT)
  conversionStory?: string;
  mission?: string;
  legacy?: string;
  // Sprint 3.2.1 — narrativa espiritual
  spiritualitySummary?: string;
  keyEvents?: SaintKeyEvent[];
}


export interface SaintAIReflectionTeaching {
  title: string;
  body: string;
  source?: string;
}

export interface SaintAIReflectionCitation {
  type: 'quote' | 'work' | 'biography' | 'virtue';
  text: string;
  used_in?: 'summary' | 'teaching' | 'meditation' | 'prayer';
}

export interface SaintAIReflection {
  version: number;
  summary: string;
  teachings: SaintAIReflectionTeaching[];
  meditation: string;
  meditation_sources?: string[];
  prayer: string;
  citations?: SaintAIReflectionCitation[];
  model?: string;
  provider?: string;
  generated_at?: string;
}
