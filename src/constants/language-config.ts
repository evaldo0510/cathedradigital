/**
 * Nomes próprios ou termos técnicos aceitos que não devem disparar falhas
 * na auditoria de linguagem portuguesa.
 */
export const LANGUAGE_ALLOWLIST = [
  'Cathedra',
  'Logos',
  'Oasis',
  'Nexus',
  'Supabase',
  'Google',
  'GitHub',
  'PWA',
  'ID',
  'IDs',
  'UUID',
  'Cânone',
  'OLED',
  'GA4'
];

/**
 * Termos proibidos que devem disparar alertas
 */
export const FORBIDDEN_ENGLISH_WORDS = [
  'Chapter', 
  'Verse', 
  'Book', 
  'Search', 
  'Loading', 
  'Error', 
  'Settings', 
  'Cancel', 
  'Save', 
  'Delete', 
  'Share', 
  'Back', 
  'Summary'
];
