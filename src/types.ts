export type Language = 'pt' | 'en' | 'es' | 'la' | 'it' | 'fr' | 'de';

export enum AppRoute {
  HOME = '/',
  DASHBOARD = '/dashboard',
  STUDY_MODE = '/study',
  BIBLE = '/bible',
  CATECHISM = '/catechism',
   SAINTS = '/santos',
   SAINT_DETAIL = '/santos/:id',
  MAGISTERIUM = '/magisterium',
  MAGISTERIUM_DOC = '/magisterium/:id',
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
  LITURGIA = '/liturgia',
  BREVIARY = '/breviary',
  FAVORITES = '/favorites',
  DIAGNOSTICS = '/diagnostics',
  ABOUT = '/about',
  TRILHAS = '/trilhas',
  ORACAO = '/oracao',
  ADMIN = '/admin',
  GLOSSARY = '/glossary',
  APARICOES = '/aparicoes',
  ONBOARDING = '/onboarding',
  ACHIEVEMENTS = '/achievements',
  CHECKOUT_RESULT = '/checkout/result',
  TERMS = '/terms',
  PRIVACY = '/privacy',
  PRICING = '/pricing',
  DIAGNOSTICO = '/diagnostico',
  HOJE = '/hoje',
  JORNADAS = '/jornadas',
  JORNADA_DETAIL = '/jornadas/:id',
  JORNADA_STEP = '/jornadas/:id/step',
  JORNADA_COMPLETE = '/jornadas/:id/complete',
  BIBLIOTECA = '/biblioteca',
  PARTNERS = '/partners',
  UPGRADE = '/upgrade',
  TEMAS = '/temas',
  TEMA_DETAIL = '/temas/:slug',
  ENCYCLOPEDIA = '/encyclopedia',
  AZ_FAITH = '/az-faith',
  MODULES_GUIDE = '/guia-modulos',
  POPES = '/papas',
  BUSCAR = '/buscar',
  TRANSACTIONS = '/transactions',
  A11Y_AUDIT = '/a11y-audit',
  SECURITY_AUDIT = '/security-audit',
  SELLER = '/vendedor',
  CATECHISM_INTEGRITY = '/catechism/integrity',
  CATECHISM_EXPLORER = '/catechism/explorer',
  CATECHISM_HEALTH = '/catechism/health',
  TRANSPARENCY = '/transparencia'
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

export interface DeepContent {
  textoBase: string;
  explicacao: string;
  interpretacaoProfunda: string;
  aplicacaoPratica: string;
  reflexaoFinal: string;
  exercicio: string;
}

export interface Verse extends Partial<DeepContent> {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface CatechismParagraph extends Partial<DeepContent> {
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

export interface SavedItem extends Partial<DeepContent> {
  id: string;
  type: 'verse' | 'catechism' | 'dogma' | 'study' | 'liturgy' | 'prayer' | 'aquinas' | 'apparition';
  title: string;
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface Prayer extends Partial<DeepContent> {
  id: string;
  title: string;
  latin?: string;
  vernacular: string;
  category: string;
}
