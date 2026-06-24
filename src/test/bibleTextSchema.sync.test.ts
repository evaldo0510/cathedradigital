import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

/**
 * Garante que a fábrica de schemas `bibleTextSchema.factory.ts` permanece
 * byte-idêntica entre frontend (src/shared) e edge (supabase/functions/_shared).
 * Se este teste falhar, atualize AMBOS os arquivos com o mesmo conteúdo.
 */
function hash(path: string) {
  const buf = readFileSync(resolve(process.cwd(), path));
  return createHash('sha256').update(buf).digest('hex');
}

describe('bibleTextSchema factory sync', () => {
  it('frontend e edge usam o MESMO arquivo de fábrica', () => {
    const frontend = hash('src/shared/bibleTextSchema.factory.ts');
    const edge = hash('supabase/functions/_shared/bibleTextSchema.factory.ts');
    expect(frontend).toBe(edge);
  });
});
