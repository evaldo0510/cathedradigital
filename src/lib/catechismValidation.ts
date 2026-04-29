/**
 * Utility to ensure consistent usage of Catechism types across the app.
 * Supports both 'catechism' (Nexus/Logic) and 'catecismo' (UI/Portuguese).
 */

export type CatechismType = 'catechism' | 'catecismo';

/**
 * Normalizes any variation of catechism type to the target format.
 */
export function normalizeCatechismType(type: string): 'catechism' {
  const t = type.toLowerCase();
  if (t === 'catechism' || t === 'catecismo' || t === 'cic') {
    return 'catechism';
  }
  return t as any;
}

/**
 * Returns the user-facing label for the catechism type.
 */
export function getCatechismLabel(type: string): string {
  const norm = normalizeCatechismType(type);
  return norm === 'catechism' ? 'Catecismo' : type;
}

/**
 * Validates if a content item is of catechism type.
 */
export function isCatechism(item: { type?: string; tipo?: string }): boolean {
  const type = item.type || item.tipo || '';
  return normalizeCatechismType(type) === 'catechism';
}
