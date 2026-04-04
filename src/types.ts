export type Language = 'pt' | 'en' | 'es' | 'la' | 'it' | 'fr' | 'de';

export enum AppRoute {
  HOME = '/',
  DASHBOARD = '/dashboard',
  STUDY_MODE = '/study',
  BIBLE = '/bible',
  CATECHISM = '/catechism',
  SAINTS = '/saints',
  MAGISTERIUM = '/magisterium',
  DOGMAS = '/dogmas',
  DAILY_LITURGY = '/daily-liturgy',
  LITURGICAL_CALENDAR = '/calendar',
  AQUINAS_OPERA = '/aquinas',
  PROFILE = '/profile',
  LOGIN = '/login',
  CHECKOUT = '/checkout',
  CERTAMEN = '/quiz',
  POENITENTIA = '/confession',
  ORDO_MISSAE = '/mass',
  ROSARY = '/rosary',
  VIA_CRUCIS = '/viacrucis',
  LITANIES = '/litanies',
  PRAYERS = '/prayers',
  LECTIO_DIVINA = '/lectio',
  COMMUNITY = '/community',
  MISSAL = '/missal',
  BREVIARY = '/breviary',
  FAVORITES = '/favorites',
  DIAGNOSTICS = '/diagnostics',
  ABOUT = '/about',
  TRILHAS = '/trilhas',
  ORACAO = '/oracao',
  ADMIN = '/admin',
  GLOSSARY = '/glossary'
}

export interface TrackStep {
  type: 'biblia' | 'cic' | 'documento' | 'video' | 'quiz';
  ref: string;
  label?: string;
}

export interface TrackModule {
  id: string;
  title: string;
  content: TrackStep[];
}

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  modules: TrackModule[];
  icon?: string;
  image?: string;
}

export interface ReadingProgress {
  lastBibleChapter?: { book: string; chapter: number };
  lastCatechismPara?: number;
  streak: number;
  totalMinutesRead: number;
  completedBooks: string[];
  xp: number;
  level: number;
  badges: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'pilgrim' | 'scholar' | 'admin';
  isPremium?: boolean;
  joinedAt: string;
  avatar?: string;
  progress: ReadingProgress;
  stats: {
    versesSaved: number;
    studiesPerformed: number;
    daysActive: number;
    quizScore?: number;
  };
}

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface CatechismParagraph {
  number: number;
  content: string;
  context?: string;
}

export interface StudyResult {
  topic: string;
  summary: string;
  bibleVerses: Verse[];
  catechismParagraphs: CatechismParagraph[];
  magisteriumDocs: any[];
  saintsQuotes: any[];
}

export interface SavedItem {
  id: string;
  type: 'verse' | 'catechism' | 'dogma' | 'study' | 'liturgy' | 'prayer' | 'aquinas';
  title: string;
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface Prayer {
  id: string;
  title: string;
  latin?: string;
  vernacular: string;
  category: string;
}
