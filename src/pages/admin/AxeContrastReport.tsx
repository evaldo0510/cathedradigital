import { useEffect, useState } from 'react';

/**
 * /admin/axe-contrast — visualiza reports/axe-contrast/summary.json
 * (copiado para public/reports/axe-contrast/summary.json pelo aggregator).
 *
 * Protegido pelo AdminGuard já existente em App.tsx (herda contexto).
 */

type PerRoute = {
  route: string;
  tier: 'enforced' | 'tracked' | 'adhoc';
  violations: number;
  nodes: number;
  reportFile: string;
};

type CausalClass = {
  class: string;
  category: 'color' | 'opacity';
  count: number;
  routes: string[];
  rule: null | { replacement: string | null | undefined; reason: string; confidence: 'safe' | 'review' };
  srcMatches: Array<{ file: string; line: number; text: string }>;
};

type Summary = {
  generatedAt: string;
  totals: {
    routes: number;
    nodes: number;
    enforcedFailing: number;
    trackedCleaned: number;
    trackedDirty: number;
  };
  perRoute: PerRoute[];
  topCausalClasses: CausalClass[];
};

const SUMMARY_URL = '/reports/axe-contrast/summary.json';
const HEATMAP_ARTIFACT_HINT =
  'https://github.com/leonardocathedra/cathedra-digital/actions/workflows/axe-color-contrast.yml';

export default function AxeContrastReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(SUMMARY_URL, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(setSummary)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-spacing-lg space-y-spacing-sm">
        <h1 className="text-premium-2xl text-foreground">axe-core · color-contrast</h1>
        <p className="text-muted-foreground">
          Não foi possível carregar <code>{SUMMARY_URL}</code>: {error}
        </p>
        <p className="text-muted-foreground">
          Rode <code>npm run axe:contrast:tracked-all</code> localmente ou consulte o artifact do
          workflow <code>axe-color-contrast</code> no CI.
        </p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-spacing-lg">
        <p className="text-muted-foreground">Carregando resumo…</p>
      </div>
    );
  }

  const tierBadge = (t: PerRoute['tier']) => {
    const map: Record<PerRoute['tier'], string> = {
      enforced: 'bg-primary text-primary-foreground',
      tracked: 'bg-secondary text-secondary-foreground',
      adhoc: 'bg-muted text-muted-foreground',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[t]}`}>{t}</span>
    );
  };

  const nodesBadge = (n: number, tier: PerRoute['tier']) => {
    if (n === 0) return <span className="text-primary font-semibold">0</span>;
    if (tier === 'enforced') return <span className="text-destructive font-semibold">{n}</span>;
    return <span className="text-foreground font-semibold">{n}</span>;
  };

  const sortedRoutes = [...summary.perRoute].sort(
    (a, b) => b.nodes - a.nodes || a.route.localeCompare(b.route),
  );

  return (
    <div className="p-spacing-lg space-y-spacing-lg">
      <header className="space-y-spacing-2xs">
        <h1 className="text-premium-2xl text-foreground">axe-core · color-contrast</h1>
        <p className="text-muted-foreground text-sm">
          Gerado em {new Date(summary.generatedAt).toLocaleString('pt-BR')} · {summary.totals.routes} rotas ·{' '}
          <strong className="text-foreground">{summary.totals.nodes}</strong> nó(s) ·{' '}
          <strong className="text-foreground">{summary.totals.enforcedFailing}</strong> enforced falhando ·{' '}
          <strong className="text-foreground">{summary.totals.trackedDirty}</strong> tracked com violações ·{' '}
          <strong className="text-primary">{summary.totals.trackedCleaned}</strong> prontas para promoção
        </p>
        <p className="text-muted-foreground text-sm">
          <a href={HEATMAP_ARTIFACT_HINT} target="_blank" rel="noreferrer" className="underline text-primary">
            Artifacts do CI (heatmap.md, JSONs por rota)
          </a>
        </p>
      </header>

      <section>
        <h2 className="text-premium-lg text-foreground mb-spacing-sm">Resumo por rota</h2>
        <div className="overflow-x-auto border border-border rounded">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-2">Rota</th>
                <th className="text-left p-2">Tier</th>
                <th className="text-right p-2">Violations</th>
                <th className="text-right p-2">Nós</th>
                <th className="text-left p-2">Report JSON</th>
              </tr>
            </thead>
            <tbody>
              {sortedRoutes.map((r) => (
                <tr key={r.route} className="border-t border-border">
                  <td className="p-2 font-mono">{r.route}</td>
                  <td className="p-2">{tierBadge(r.tier)}</td>
                  <td className="p-2 text-right">{r.violations}</td>
                  <td className="p-2 text-right">{nodesBadge(r.nodes, r.tier)}</td>
                  <td className="p-2">
                    <code className="text-xs text-muted-foreground">
                      reports/axe-contrast/{r.reportFile}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-premium-lg text-foreground mb-spacing-sm">
          Top classes causais (color/opacity)
        </h2>
        {summary.topCausalClasses.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma classe causal detectada.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Classe</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-right p-2">Ocorrências</th>
                  <th className="text-left p-2">Sugestão (registry)</th>
                  <th className="text-left p-2">Confidence</th>
                  <th className="text-left p-2">Rotas</th>
                </tr>
              </thead>
              <tbody>
                {summary.topCausalClasses.map((c) => (
                  <tr key={c.class} className="border-t border-border align-top">
                    <td className="p-2 font-mono">{c.class}</td>
                    <td className="p-2">{c.category}</td>
                    <td className="p-2 text-right">{c.count}</td>
                    <td className="p-2 font-mono text-xs">
                      {c.rule
                        ? c.rule.replacement === null
                          ? 'remover'
                          : c.rule.replacement === undefined
                            ? '(revisar)'
                            : `→ ${c.rule.replacement}`
                        : '—'}
                    </td>
                    <td className="p-2">
                      {c.rule ? (
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            c.rule.confidence === 'safe'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {c.rule.confidence}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-2 text-xs font-mono text-muted-foreground">
                      {c.routes.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-premium-lg text-foreground mb-spacing-sm">
          Ocorrências em <code>src/**</code>
        </h2>
        <p className="text-sm text-muted-foreground mb-spacing-xs">
          Match aproximado via ripgrep. Use como pista — revisar antes de aplicar autofix.
        </p>
        <div className="space-y-spacing-sm">
          {summary.topCausalClasses
            .filter((c) => c.srcMatches.length > 0)
            .map((c) => (
              <details key={c.class} className="border border-border rounded p-spacing-xs">
                <summary className="cursor-pointer font-mono text-sm">
                  {c.class} — {c.srcMatches.length} ocorrência(s)
                </summary>
                <ul className="mt-spacing-xs space-y-1 text-xs font-mono text-muted-foreground">
                  {c.srcMatches.map((m, i) => (
                    <li key={`${m.file}:${m.line}:${i}`}>
                      <span className="text-foreground">{m.file}:{m.line}</span> — {m.text}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
        </div>
      </section>
    </div>
  );
}
