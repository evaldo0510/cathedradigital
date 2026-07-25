/**
 * Testes do guardrail P0.3.2 · Headings Audit.
 * Bloqueia regressão silenciosa da regra "1 H1 por página" e do hint acionável.
 */
import { describe, it, expect } from 'vitest';
import { auditSource } from './headings-audit';

describe('headings-audit · auditSource', () => {
  it('detecta H1 ausente em página e propõe o primeiro <h2> como candidato', () => {
    const src = `
      export default function Page() {
        return (
          <main>
            <h2>Continue lendo</h2>
            <h3>Detalhes</h3>
          </main>
        );
      }
    `;
    const findings = auditSource('src/pages/FakePage.tsx', src);
    const missing = findings.find((f) => f.kind === 'missing_h1');
    expect(missing).toBeDefined();
    expect(missing?.hint).toMatch(/EditorialHero/);
    expect(missing?.hint).toMatch(/Continue lendo/);
  });

  it('aceita <EditorialHero> como H1 válido', () => {
    const src = `
      import { EditorialHero } from '@/components/editorial';
      export default function Page() {
        return (
          <>
            <EditorialHero title="Acervo" />
            <h2>Categorias</h2>
          </>
        );
      }
    `;
    const findings = auditSource('src/pages/AcervoPage.tsx', src);
    expect(findings.filter((f) => f.kind === 'missing_h1')).toHaveLength(0);
  });

  it('reporta H1 duplicado com os textos detectados', () => {
    const src = `<><h1>Um</h1><h1>Dois</h1></>`;
    const findings = auditSource('src/pages/DupPage.tsx', src);
    const dup = findings.find((f) => f.kind === 'duplicate_h1');
    expect(dup).toBeDefined();
    expect(dup?.hint).toMatch(/"Um"/);
    expect(dup?.hint).toMatch(/"Dois"/);
  });

  it('reporta H1 vazio', () => {
    const src = `<h1></h1>`;
    const findings = auditSource('src/pages/EmptyPage.tsx', src);
    expect(findings.some((f) => f.kind === 'empty_h1')).toBe(true);
  });

  it('detecta salto de hierarquia H1 → H3', () => {
    const src = `<><h1>Título</h1><h3>Salto</h3></>`;
    const findings = auditSource('src/pages/SkipPage.tsx', src);
    const skip = findings.find((f) => f.kind === 'skip');
    expect(skip).toBeDefined();
    expect(skip?.detail).toMatch(/H1 → H3/);
  });

  it('não exige H1 em sub-componentes (Panel/Card/Section)', () => {
    const src = `<section><h2>Continue lendo</h2></section>`;
    const findings = auditSource('src/pages/acervo/AcervoContinueReadingPanel.tsx', src, {
      isSubcomponent: true,
    });
    expect(findings.filter((f) => f.kind === 'missing_h1')).toHaveLength(0);
  });

  it('ainda valida hierarquia em sub-componentes', () => {
    const src = `<section><h2>Título</h2><h4>Salto</h4></section>`;
    const findings = auditSource('src/pages/FooPanel.tsx', src, { isSubcomponent: true });
    expect(findings.some((f) => f.kind === 'skip')).toBe(true);
  });
});
