/**
 * C0.5.b — Parallel Readers Migration (teste estático bloqueante).
 * Roda a auditoria em Vitest para garantir gate em CI/PR local.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');

const TARGETS = [
  { path: 'src/components/cathedra/BibleReader.tsx', label: 'Bíblia' },
  { path: 'src/components/cathedra/MagisteriumViewer.tsx', label: 'Magistério' },
  { path: 'src/components/cathedra/AparicoesPage.tsx', label: 'Aparições' },
  { path: 'src/components/cathedra/DogmasPage.tsx', label: 'Dogmas' },
  { path: 'src/pages/CollectionPage.tsx', label: 'Coleções' },
] as const;

describe('C0.5.b — Parallel Readers Migration', () => {
  for (const target of TARGETS) {
    describe(`[${target.label}] ${target.path}`, () => {
      const source = readFileSync(resolve(ROOT, target.path), 'utf8');

      it('importa ReaderShell do barrel oficial @/components/reader', () => {
        expect(source).toMatch(/from\s+['"]@\/components\/reader['"]/);
      });

      it('renderiza <ReaderShell> no JSX', () => {
        expect(source).toMatch(/<ReaderShell[\s>]/);
      });

      it('não referencia EditorialReaderHeader (extinto na C0.5.b)', () => {
        expect(source).not.toMatch(/\bEditorialReaderHeader\b/);
      });
    });
  }
});
