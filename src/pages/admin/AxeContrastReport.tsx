import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, ExternalLink, HelpCircle, ArrowUpRight } from 'lucide-react';

/**
 * /admin/axe-contrast
 *
 * - Lê /reports/axe-contrast/summary.json (último run).
 * - Lê /reports/axe-contrast/history/index.json (snapshots) para diff temporal.
 * - Botões: exportar summary.csv, heatmap.csv, abrir heatmap.md standalone.
 * - Modal de promoção tracked → ENFORCED (explica 3 opções + link para doc).
 *
 * Protegido pelo AdminGuard já existente em App.tsx.
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

type Snapshot = {
  generatedAt: string;
  totals: Summary['totals'];
  perRoute: PerRoute[];
  topCausalClasses: Array<{ class: string; category: string; count: number; routes: string[] }>;
  perRouteTopUtils: Record<string, Record<string, number>>;
};

type HistIdx = { file: string; generatedAt: string; nodes: number; routes: number };

const SUMMARY_URL = '/reports/axe-contrast/summary.json';
const HISTORY_INDEX_URL = '/reports/axe-contrast/history/index.json';
const HEATMAP_ARTIFACT_HINT =
  'https://github.com/leonardocathedra/cathedra-digital/actions/workflows/axe-color-contrast.yml';
const PROMOTE_DOC_URL = '/docs/axe-contrast-promote.md';

export default function AxeContrastReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // diff temporal
  const [history, setHistory] = useState<HistIdx[]>([]);
  const [baseFile, setBaseFile] = useState<string>('');
  const [headFile, setHeadFile] = useState<string>('');
  const [baseSnap, setBaseSnap] = useState<Snapshot | null>(null);
  const [headSnap, setHeadSnap] = useState<Snapshot | null>(null);

  // modais
  const [helpOpen, setHelpOpen] = useState(false);
  const [promoteRoute, setPromoteRoute] = useState<string | null>(null);

  useEffect(() => {
    fetch(SUMMARY_URL, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(setSummary)
      .catch((e: Error) => setError(e.message));

    fetch(HISTORY_INDEX_URL, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((h: HistIdx[]) => {
        setHistory(h);
        if (h.length >= 2) {
          setBaseFile(h[h.length - 2].file);
          setHeadFile(h[h.length - 1].file);
        }
      })
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    if (!baseFile) { setBaseSnap(null); return; }
    fetch(`/reports/axe-contrast/history/${baseFile}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(setBaseSnap)
      .catch(() => setBaseSnap(null));
  }, [baseFile]);

  useEffect(() => {
    if (!headFile) { setHeadSnap(null); return; }
    fetch(`/reports/axe-contrast/history/${headFile}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(setHeadSnap)
      .catch(() => setHeadSnap(null));
  }, [headFile]);

  const diffRows = useMemo(() => {
    if (!baseSnap || !headSnap) return [];
    const map = new Map<string, { base?: PerRoute; head?: PerRoute }>();
    for (const r of baseSnap.perRoute) map.set(r.route, { base: r });
    for (const r of headSnap.perRoute) {
      const cur = map.get(r.route) ?? {};
      cur.head = r;
      map.set(r.route, cur);
    }
    return Array.from(map.entries())
      .map(([route, v]) => {
        const b = v.base?.nodes ?? 0;
        const h = v.head?.nodes ?? 0;
        return {
          route,
          tier: v.head?.tier ?? v.base?.tier ?? 'adhoc',
          base: v.base ? b : null,
          head: v.head ? h : null,
          delta: h - b,
          status: !v.base ? 'new' : !v.head ? 'removed' : h < b ? 'improved' : h > b ? 'regressed' : 'stable',
        };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.route.localeCompare(b.route));
  }, [baseSnap, headSnap]);

  const classDiff = useMemo(() => {
    if (!baseSnap || !headSnap) return [];
    const flat = (s: Snapshot) => {
      const m = new Map<string, number>();
      for (const utils of Object.values(s.perRouteTopUtils ?? {})) {
        for (const [cls, n] of Object.entries(utils)) m.set(cls, (m.get(cls) ?? 0) + (n as number));
      }
      return m;
    };
    const b = flat(baseSnap);
    const h = flat(headSnap);
    const all = new Set<string>([...b.keys(), ...h.keys()]);
    return Array.from(all)
      .map((cls) => ({
        cls,
        base: b.get(cls) ?? 0,
        head: h.get(cls) ?? 0,
        delta: (h.get(cls) ?? 0) - (b.get(cls) ?? 0),
      }))
      .filter((r) => r.delta !== 0)
      .sort((a, b2) => Math.abs(b2.delta) - Math.abs(a.delta));
  }, [baseSnap, headSnap]);

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
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[t]}`}>{t}</span>;
  };

  const nodesBadge = (n: number, tier: PerRoute['tier']) => {
    if (n === 0) return <span className="text-primary font-semibold">0</span>;
    if (tier === 'enforced') return <span className="text-destructive font-semibold">{n}</span>;
    return <span className="text-foreground font-semibold">{n}</span>;
  };

  const statusChip = (s: string) => {
    const map: Record<string, string> = {
      improved: 'bg-primary text-primary-foreground',
      regressed: 'bg-destructive text-destructive-foreground',
      stable: 'bg-muted text-muted-foreground',
      new: 'bg-secondary text-secondary-foreground',
      removed: 'bg-muted text-muted-foreground',
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${map[s] ?? ''}`}>{s}</span>;
  };

  const sortedRoutes = [...summary.perRoute].sort(
    (a, b) => b.nodes - a.nodes || a.route.localeCompare(b.route),
  );

  return (
    <div className="p-spacing-lg space-y-spacing-lg">
      <header className="space-y-spacing-2xs">
        <div className="flex items-center gap-spacing-sm flex-wrap">
          <h1 className="text-premium-2xl text-foreground">axe-core · color-contrast</h1>
          <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)}>
            <HelpCircle className="w-4 h-4 mr-1" /> Como promover uma rota?
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Gerado em {new Date(summary.generatedAt).toLocaleString('pt-BR')} · {summary.totals.routes} rotas ·{' '}
          <strong className="text-foreground">{summary.totals.nodes}</strong> nó(s) ·{' '}
          <strong className="text-foreground">{summary.totals.enforcedFailing}</strong> enforced falhando ·{' '}
          <strong className="text-foreground">{summary.totals.trackedDirty}</strong> tracked com violações ·{' '}
          <strong className="text-primary">{summary.totals.trackedCleaned}</strong> prontas para promoção
        </p>
        <div className="flex gap-spacing-xs flex-wrap pt-spacing-2xs">
          <Button size="sm" variant="secondary" asChild>
            <a href="/reports/axe-contrast/exports/summary.csv" download>
              <Download className="w-4 h-4 mr-1" /> summary.csv
            </a>
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <a href="/reports/axe-contrast/exports/heatmap.csv" download>
              <Download className="w-4 h-4 mr-1" /> heatmap.csv
            </a>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={HEATMAP_ARTIFACT_HINT} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" /> Artifacts do CI
            </a>
          </Button>
        </div>
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
                <th className="text-left p-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {sortedRoutes.map((r) => {
                const canPromote = r.tier === 'tracked' && r.nodes === 0;
                return (
                  <tr key={r.route} className="border-t border-border">
                    <td className="p-2 font-mono">{r.route}</td>
                    <td className="p-2">{tierBadge(r.tier)}</td>
                    <td className="p-2 text-right">{r.violations}</td>
                    <td className="p-2 text-right">{nodesBadge(r.nodes, r.tier)}</td>
                    <td className="p-2">
                      <a
                        href={`/reports/axe-contrast/${r.reportFile}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline font-mono"
                      >
                        {r.reportFile}
                      </a>
                    </td>
                    <td className="p-2">
                      {canPromote ? (
                        <Button size="sm" onClick={() => setPromoteRoute(r.route)}>
                          <ArrowUpRight className="w-3 h-3 mr-1" /> Promover
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Diff temporal --- */}
      <section>
        <h2 className="text-premium-lg text-foreground mb-spacing-sm">
          Comparar execuções (diff temporal)
        </h2>
        {history.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Preciso de pelo menos 2 execuções para comparar. Ainda há {history.length}.
          </p>
        ) : (
          <>
            <div className="flex gap-spacing-sm flex-wrap items-end mb-spacing-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Base (antes)</label>
                <Select value={baseFile} onValueChange={setBaseFile}>
                  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {history.map((h) => (
                      <SelectItem key={h.file} value={h.file}>
                        {new Date(h.generatedAt).toLocaleString('pt-BR')} · {h.nodes} nós
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Head (depois)</label>
                <Select value={headFile} onValueChange={setHeadFile}>
                  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {history.map((h) => (
                      <SelectItem key={h.file} value={h.file}>
                        {new Date(h.generatedAt).toLocaleString('pt-BR')} · {h.nodes} nós
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {baseSnap && headSnap && (
              <div className="grid md:grid-cols-2 gap-spacing-sm">
                <div className="border border-border rounded overflow-x-auto">
                  <div className="p-2 bg-muted text-xs text-muted-foreground">Por rota</div>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="text-left p-2">Rota</th>
                        <th className="text-right p-2">Base</th>
                        <th className="text-right p-2">Head</th>
                        <th className="text-right p-2">Δ</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diffRows.map((d) => (
                        <tr key={d.route} className="border-t border-border">
                          <td className="p-2 font-mono text-xs">{d.route}</td>
                          <td className="p-2 text-right">{d.base ?? '—'}</td>
                          <td className="p-2 text-right">{d.head ?? '—'}</td>
                          <td className={`p-2 text-right font-semibold ${d.delta < 0 ? 'text-primary' : d.delta > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {d.delta > 0 ? `+${d.delta}` : d.delta}
                          </td>
                          <td className="p-2">{statusChip(d.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border border-border rounded overflow-x-auto">
                  <div className="p-2 bg-muted text-xs text-muted-foreground">Por classe causal</div>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="text-left p-2">Classe</th>
                        <th className="text-right p-2">Base</th>
                        <th className="text-right p-2">Head</th>
                        <th className="text-right p-2">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classDiff.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-muted-foreground text-sm">Sem mudanças por classe.</td></tr>
                      ) : classDiff.map((c) => (
                        <tr key={c.cls} className="border-t border-border">
                          <td className="p-2 font-mono text-xs">{c.cls}</td>
                          <td className="p-2 text-right">{c.base}</td>
                          <td className="p-2 text-right">{c.head}</td>
                          <td className={`p-2 text-right font-semibold ${c.delta < 0 ? 'text-primary' : 'text-destructive'}`}>
                            {c.delta > 0 ? `+${c.delta}` : c.delta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
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

      {/* Modal de ajuda / promoção */}
      <PromoteHelpDialog
        open={helpOpen || promoteRoute !== null}
        route={promoteRoute}
        onClose={() => { setHelpOpen(false); setPromoteRoute(null); }}
      />
    </div>
  );
}

function PromoteHelpDialog({
  open, route, onClose,
}: { open: boolean; route: string | null; onClose: () => void }) {
  const openDoc = (anchor?: string) => {
    window.open(PROMOTE_DOC_URL + (anchor ? `#${anchor}` : ''), '_blank', 'noopener');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {route ? `Promover ${route} para ENFORCED_ROUTES` : 'Como promover uma rota'}
          </DialogTitle>
          <DialogDescription>
            Escolha como você quer aplicar a mudança. Clique nas palavras destacadas para abrir a documentação completa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-spacing-sm text-sm">
          <p className="text-muted-foreground">
            Promover uma rota significa mover ela de <code>TRACKED_ROUTES</code> para{' '}
            <code>ENFORCED_ROUTES</code> em{' '}
            <button className="text-primary underline" onClick={() => openDoc()}>
              tests/e2e/axe-color-contrast-regression.spec.ts
            </button>
            . A partir daí, qualquer regressão futura de contraste{' '}
            <strong className="text-foreground">quebra o build</strong>.
          </p>

          <div className="border border-border rounded p-spacing-sm space-y-1">
            <button
              onClick={() => openDoc('opção-1--pr-automático-recomendada-quando-você-tem-muitas-rotas')}
              className="font-semibold text-foreground hover:text-primary text-left w-full"
            >
              1. PR automático <ExternalLink className="w-3 h-3 inline" />
            </button>
            <p className="text-muted-foreground text-xs">
              O admin abre um Pull Request no GitHub para você.{' '}
              <strong>Requer configuração inicial</strong> (um token do GitHub como segredo).
              Se ainda não estiver configurado, o botão apenas explica.
            </p>
          </div>

          <div className="border border-border rounded p-spacing-sm space-y-1">
            <button
              onClick={() => openDoc('opção-2--patch-manual-recomendada-para-uso-ocasional')}
              className="font-semibold text-foreground hover:text-primary text-left w-full"
            >
              2. Patch manual <ExternalLink className="w-3 h-3 inline" />
            </button>
            <p className="text-muted-foreground text-xs">
              Você baixa um arquivo <code>.patch</code> e aplica com <code>git apply</code>.
              Não precisa de token nem de configuração.
            </p>
            {route && (
              <a
                className="text-xs text-primary underline block mt-1"
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(patchForRoute(route))}`}
                download={`promote-${route.replace(/\W+/g, '_')}.patch`}
              >
                Baixar patch para {route}
              </a>
            )}
          </div>

          <div className="border border-border rounded p-spacing-sm space-y-1">
            <button
              onClick={() => openDoc('opção-3--comandoedição-direta-para-quem-prefere-fazer-na-mão')}
              className="font-semibold text-foreground hover:text-primary text-left w-full"
            >
              3. Comando/edição direta <ExternalLink className="w-3 h-3 inline" />
            </button>
            <p className="text-muted-foreground text-xs">
              Abra <code>tests/e2e/axe-color-contrast-regression.spec.ts</code> e mova a linha entre os arrays. Total controle.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button onClick={() => openDoc()}>
            <ExternalLink className="w-4 h-4 mr-1" /> Abrir documentação completa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Gera um patch git-apply-compatível movendo a rota entre os arrays. */
function patchForRoute(route: string): string {
  const q = `'${route}'`;
  return `# Aplicar com:  git apply <este-arquivo>
# Move ${route} de TRACKED_ROUTES para ENFORCED_ROUTES.
# Se este patch falhar (arquivo mudou), edite manualmente:
#   tests/e2e/axe-color-contrast-regression.spec.ts
#   — remova ${q} de TRACKED_ROUTES
#   — adicione ${q} em ENFORCED_ROUTES
#
# Depois:
#   git add -A && git commit -m "axe: promote ${route} to ENFORCED_ROUTES"
#   git push
`;
}
