/**
 * Verificação estática da cadeia Reader Template Master.
 *
 * Para cada módulo `certified` no registro, garante que o entry importa
 * os primitivos canônicos: ReaderShell, EditorialHero, NexusPanel e
 * ReaderContinuation. Não roda o React — apenas grep no fonte.
 *
 * Complementa o E2E (`tests/e2e/reader-template-chain.spec.ts`) que
 * valida a cadeia em DOM real, e o script de auditoria em CI.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { READER_MODULES } from '@/config/reader-modules';

const ROOT = resolve(__dirname, '..', '..');

const certified = READER_MODULES.filter((m) => m.status === 'certified');

describe('Reader Template Master — cadeia canônica (estática)', () => {
  it('registro contém ao menos um módulo certificado', () => {
    expect(certified.length).toBeGreaterThan(0);
  });

  for (const mod of certified) {
    describe(`${mod.label} (${mod.id})`, () => {
      const abs = resolve(ROOT, mod.entry);
      const source = existsSync(abs) ? readFileSync(abs, 'utf8') : '';

      it('entry existe no filesystem', () => {
        expect(existsSync(abs)).toBe(true);
      });

      it('importa e renderiza <ReaderShell>', () => {
        expect(source).toMatch(/from\s+['"]@\/components\/reader['"]/);
        expect(source).toMatch(/<ReaderShell[\s>]/);
      });

      it('renderiza <EditorialHero> no slot hero', () => {
        expect(source).toMatch(/<EditorialHero[\s>]/);
      });

      it('renderiza <NexusPanel> (ou skip documentado)', () => {
        const optional = new Set(mod.optionalSlots ?? []);
        const hasNexus = /<NexusPanel[\s>]/.test(source);
        const skipped = optional.has('nexus') || /nexus=\{null\}/.test(source);
        expect(hasNexus || skipped).toBe(true);
      });

      it('renderiza <ReaderContinuation> no slot continuation', () => {
        const optional = new Set(mod.optionalSlots ?? []);
        const has = /<ReaderContinuation[\s>]|continuation=\{[^}]+\}/.test(source);
        const skipped = optional.has('continuation') || /continuation=\{null\}/.test(source);
        expect(has || skipped).toBe(true);
      });

      it('não contém componentes proibidos', () => {
        expect(source).not.toMatch(/from\s+['"][^'"]*cathedra\/NexusBubbles['"]/);
        expect(source).not.toMatch(/from\s+['"][^'"]*prayer\/rosary\/MysteryNexusPanel['"]/);
        expect(source).not.toMatch(/\b(?:function|const)\s+AutoNexusList\b/);
        expect(source).not.toMatch(/\b(?:function|const)\s+NexusFullList\b/);
        expect(source).not.toMatch(/from\s+['"]@radix-ui\/react-popover['"]/);
      });
    });
  }
});
