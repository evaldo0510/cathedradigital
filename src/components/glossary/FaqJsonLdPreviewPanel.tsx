import { cn } from '@/lib/utils';
import { validateFaqJsonLdLive, type FaqItem } from '@/lib/glossary/sanitizeFaq';

/**
 * Painel dev-only de preview do JSON-LD do FAQPage.
 * Exibe status de validação em tempo real, versão da SanitizePolicy aplicada,
 * lista de campos removidos e permite copiar/exportar o payload final.
 *
 * Extraído de GlossaryTermPage para permitir testes de componente isolados.
 */
export interface FaqJsonLdPreviewPanelProps {
  slug: string;
  items: FaqItem[] | null | undefined;
}

export function FaqJsonLdPreviewPanel({ slug, items }: FaqJsonLdPreviewPanelProps) {
  const live = validateFaqJsonLdLive(items);
  const removedPaths = new Set(live.issues.map((i) => i.path));

  const handleCopy = () => {
    const payload = JSON.stringify(live.jsonLd ?? { error: live.issues }, null, 2);
    navigator.clipboard?.writeText(payload).catch(() => {});
  };

  const handleExport = () => {
    const payload = {
      slug,
      generatedAt: new Date().toISOString(),
      policy: {
        version: live.policyVersion,
        env: live.policyEnv,
        appliedAt: live.appliedAt,
      },
      ok: live.ok,
      jsonLd: live.jsonLd,
      removedFields: live.issues.map((i) => ({
        path: i.path,
        code: i.code,
        message: i.message,
      })),
      droppedIndices: live.droppedIndices,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faq-jsonld-${slug}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-testid="faq-jsonld-panel"
      className="max-w-[68ch] mx-auto mb-6 space-y-3 text-xs"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className={cn(
            'font-mono px-2 py-1 rounded border',
            live.ok
              ? 'border-emerald-500/60 bg-emerald-50/60 text-emerald-900'
              : 'border-red-500/60 bg-red-50/60 text-red-900',
          )}
          data-testid="faq-jsonld-status"
        >
          {live.ok ? '✓ JSON-LD válido' : '✗ JSON-LD inválido'}
          {' · '}itens: {live.jsonLd?.mainEntity.length ?? 0}
          {live.droppedIndices.length > 0 && (
            <> · descartados: {live.droppedIndices.length}</>
          )}
        </div>
        <div
          data-testid="faq-jsonld-policy"
          className="font-mono text-[11px] px-2 py-1 rounded border border-dashed"
          title="Versão da política de sanitização aplicada"
        >
          policy v{live.policyVersion} · {live.policyEnv}
        </div>
        <div className="flex gap-2">
          <button type="button" data-testid="faq-jsonld-copy" onClick={handleCopy}>
            Copiar JSON-LD
          </button>
          <button type="button" data-testid="faq-jsonld-export" onClick={handleExport}>
            Exportar JSON-LD (.json)
          </button>
        </div>
      </div>
      {live.issues.length > 0 && (
        <ul data-testid="faq-jsonld-issues" className="rounded border p-3 space-y-1">
          {live.issues.map((iss, i) => (
            <li key={i} className="font-mono" data-testid={`faq-jsonld-issue-${i}`}>
              <span data-testid={`faq-jsonld-issue-path-${i}`} className="font-semibold">
                {iss.path || '(root)'}
              </span>{' '}
              <span data-testid={`faq-jsonld-issue-code-${i}`}>[{iss.code}]</span>{' '}
              {iss.message}
            </li>
          ))}
        </ul>
      )}
      {live.droppedIndices.length > 0 && (
        <div data-testid="faq-jsonld-dropped" className="rounded border p-3">
          <span className="font-semibold">Itens removidos (índices):</span>{' '}
          <span className="font-mono">{live.droppedIndices.join(', ')}</span>
        </div>
      )}
      <pre data-testid="faq-jsonld-output" className="rounded border p-3 whitespace-pre-wrap break-words max-h-[28rem] overflow-auto">
        {JSON.stringify(live.jsonLd, null, 2)}
      </pre>
      {removedPaths.size > 0 && (
        <div data-testid="faq-jsonld-removed-paths" className="text-[11px] italic">
          Paths destacados no schema: {[...removedPaths].join(' · ')}
        </div>
      )}
    </div>
  );
}

export default FaqJsonLdPreviewPanel;
