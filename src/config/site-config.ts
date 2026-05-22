/**
 * Site-wide URL and social media configuration.
 * Centralizing these values ensures consistency and makes updates easier.
 */

export const SOCIAL_LINKS = {
  INSTAGRAM: 'https://www.instagram.com/cathedradigital/',
  YOUTUBE: 'https://www.youtube.com/@cathedradigital',
  TWITTER: 'https://twitter.com/cathedradigital',
  FACEBOOK: 'https://facebook.com/cathedradigital',
  WHATSAPP: 'https://wa.me/5511999999999', // Official number placeholder
} as const;

export const EXTERNAL_URLS = {
  VATICAN: 'https://www.vatican.va',
  VATICAN_NEWS: 'https://www.vaticannews.va/pt.html',
  CNBB: 'https://www.cnbb.org.br',
  CATECHISM_OFFICIAL: 'https://www.vatican.va/archive/ccc/index_po.htm',
} as const;

export const APP_METADATA = {
  NAME: 'Cathedra Digital',
  SLOGAN: 'Digital Sanctuarium',
  CREATOR: 'Evaldo.os',
} as const;
