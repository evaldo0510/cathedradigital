import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FaqJsonLdPreviewPanel } from '../FaqJsonLdPreviewPanel';
import { SANITIZE_POLICY_VERSION, __resetSanitizePolicyForTests } from '@/lib/glossary/sanitizePolicy';

// Força política dev para expor painel e reproduzir prod-like severity sem lançar.
beforeEach(() => {
  __resetSanitizePolicyForTests({
    env: 'dev',
    severity: 'warn',
    verboseLogs: false,
    exposeDevPanels: true,
    emitMetrics: false,
    version: SANITIZE_POLICY_VERSION,
  });
});

afterEach(() => {
  __resetSanitizePolicyForTests();
  vi.restoreAllMocks();
});

describe('FaqJsonLdPreviewPanel', () => {
  it('renderiza status válido em tempo real com a versão da política aplicada', () => {
    render(
      <FaqJsonLdPreviewPanel
        slug="fe"
        items={[
          { question: 'O que é fé?', answer: 'Virtude teologal pela qual cremos em Deus.' },
        ]}
      />,
    );

    const status = screen.getByTestId('faq-jsonld-status');
    expect(status.textContent).toContain('✓ JSON-LD válido');
    expect(status.textContent).toContain('itens: 1');

    const policy = screen.getByTestId('faq-jsonld-policy');
    expect(policy.textContent).toContain(`policy v${SANITIZE_POLICY_VERSION}`);
    expect(policy.textContent).toContain('dev');

    // Não deve haver bloco de removidos nem de issues.
    expect(screen.queryByTestId('faq-jsonld-dropped')).toBeNull();
    expect(screen.queryByTestId('faq-jsonld-issues')).toBeNull();
  });

  it('destaca campos removidos e sinaliza status inválido quando nenhum item é elegível', () => {
    render(
      <FaqJsonLdPreviewPanel
        slug="vazio"
        items={[
          { question: '', answer: '' },
          { question: '   ', answer: '' },
        ]}
      />,
    );

    const status = screen.getByTestId('faq-jsonld-status');
    expect(status.textContent).toContain('✗ JSON-LD inválido');
    expect(status.textContent).toContain('descartados: 2');

    const dropped = screen.getByTestId('faq-jsonld-dropped');
    expect(dropped.textContent).toContain('0, 1');

    const issues = screen.getByTestId('faq-jsonld-issues');
    expect(issues).toBeTruthy();
    const path = screen.getByTestId('faq-jsonld-issue-path-0');
    expect(path.textContent).toContain('mainEntity');

    const removedPaths = screen.getByTestId('faq-jsonld-removed-paths');
    expect(removedPaths.textContent).toContain('mainEntity');
  });

  it('mistura itens válidos e inválidos: mantém status válido e reporta descarte', () => {
    render(
      <FaqJsonLdPreviewPanel
        slug="mix"
        items={[
          { question: '', answer: '' },
          { question: 'O que é oração?', answer: 'Elevação da alma a Deus.' },
        ]}
      />,
    );

    const status = screen.getByTestId('faq-jsonld-status');
    expect(status.textContent).toContain('✓ JSON-LD válido');
    expect(status.textContent).toContain('itens: 1');
    expect(status.textContent).toContain('descartados: 1');

    expect(screen.getByTestId('faq-jsonld-dropped').textContent).toContain('0');
  });

  it('botão Exportar gera payload com jsonLd + removedFields + versão da política', () => {
    const created: Array<{ href: string; download: string }> = [];
    const capturedBlobs: Blob[] = [];

    // Stub URL.createObjectURL para capturar o Blob gerado.
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlobs.push(blob);
      return 'blob:mock';
    }) as any;
    URL.revokeObjectURL = vi.fn();

    // Intercepta o clique do <a> para não navegar.
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        created.push({ href: this.href, download: this.download });
      });

    render(
      <FaqJsonLdPreviewPanel
        slug="oracao"
        items={[
          { question: 'O que é oração?', answer: 'Elevação da alma a Deus.' },
        ]}
      />,
    );

    fireEvent.click(screen.getByTestId('faq-jsonld-export'));

    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(created[0].download).toMatch(/^faq-jsonld-oracao-\d+\.json$/);
    expect(capturedBlobs).toHaveLength(1);
    expect(capturedBlobs[0].type).toBe('application/json');

    return capturedBlobs[0].text().then((raw) => {
      const parsed = JSON.parse(raw);
      expect(parsed.slug).toBe('oracao');
      expect(parsed.ok).toBe(true);
      expect(parsed.policy.version).toBe(SANITIZE_POLICY_VERSION);
      expect(parsed.policy.env).toBe('dev');
      expect(parsed.jsonLd?.mainEntity).toHaveLength(1);
      expect(Array.isArray(parsed.removedFields)).toBe(true);
      expect(Array.isArray(parsed.droppedIndices)).toBe(true);

      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    });
  });
});
