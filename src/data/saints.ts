import { DeepContent } from '@/types';

export interface SaintWork {
  title: string;
  url?: string;
  year?: string;
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
}
