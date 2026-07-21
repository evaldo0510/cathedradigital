/**
 * Biblioteca de imagens contemplativas dos 20 mistérios do Rosário.
 *
 * O banco guarda apenas `image_slug` (identificador estável, ex.: `joyful-1`)
 * e `image_collection` (ex.: `classical`). Trocar toda a coleção artística
 * no futuro = adicionar um novo mapa e apontar `image_collection` para ele,
 * sem tocar nos registros dos mistérios.
 */
import joyful1 from '@/assets/rosary/misterios/joyful/joyful-1.jpg';
import joyful2 from '@/assets/rosary/misterios/joyful/joyful-2.jpg';
import joyful3 from '@/assets/rosary/misterios/joyful/joyful-3.jpg';
import joyful4 from '@/assets/rosary/misterios/joyful/joyful-4.jpg';
import joyful5 from '@/assets/rosary/misterios/joyful/joyful-5.jpg';
import luminous1 from '@/assets/rosary/misterios/luminous/luminous-1.jpg';
import luminous2 from '@/assets/rosary/misterios/luminous/luminous-2.jpg';
import luminous3 from '@/assets/rosary/misterios/luminous/luminous-3.jpg';
import luminous4 from '@/assets/rosary/misterios/luminous/luminous-4.jpg';
import luminous5 from '@/assets/rosary/misterios/luminous/luminous-5.jpg';
import sorrowful1 from '@/assets/rosary/misterios/sorrowful/sorrowful-1.jpg';
import sorrowful2 from '@/assets/rosary/misterios/sorrowful/sorrowful-2.jpg';
import sorrowful3 from '@/assets/rosary/misterios/sorrowful/sorrowful-3.jpg';
import sorrowful4 from '@/assets/rosary/misterios/sorrowful/sorrowful-4.jpg';
import sorrowful5 from '@/assets/rosary/misterios/sorrowful/sorrowful-5.jpg';
import glorious1 from '@/assets/rosary/misterios/glorious/glorious-1.jpg';
import glorious2 from '@/assets/rosary/misterios/glorious/glorious-2.jpg';
import glorious3 from '@/assets/rosary/misterios/glorious/glorious-3.jpg';
import glorious4 from '@/assets/rosary/misterios/glorious/glorious-4.jpg';
import glorious5 from '@/assets/rosary/misterios/glorious/glorious-5.jpg';

import type { MysteryArtworkCollection } from './mysteryMeta';

const CLASSICAL: Record<string, string> = {
  'joyful-1': joyful1, 'joyful-2': joyful2, 'joyful-3': joyful3, 'joyful-4': joyful4, 'joyful-5': joyful5,
  'luminous-1': luminous1, 'luminous-2': luminous2, 'luminous-3': luminous3, 'luminous-4': luminous4, 'luminous-5': luminous5,
  'sorrowful-1': sorrowful1, 'sorrowful-2': sorrowful2, 'sorrowful-3': sorrowful3, 'sorrowful-4': sorrowful4, 'sorrowful-5': sorrowful5,
  'glorious-1': glorious1, 'glorious-2': glorious2, 'glorious-3': glorious3, 'glorious-4': glorious4, 'glorious-5': glorious5,
};

const COLLECTIONS: Record<MysteryArtworkCollection, Record<string, string>> = {
  classical: CLASSICAL,
  // Coleções futuras — mantidas vazias até que os assets existam.
  byzantine: {},
  contemporary: {},
};

/** @deprecated Preferir `resolveMysteryImage(slug, collection)`. */
export const MYSTERY_IMAGES = CLASSICAL;

export function resolveMysteryImage(
  slug?: string | null,
  collection: MysteryArtworkCollection = 'classical',
): string | undefined {
  if (!slug) return undefined;
  const map = COLLECTIONS[collection] ?? CLASSICAL;
  return map[slug] ?? CLASSICAL[slug];
}
