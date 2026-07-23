/**
 * /admin/editorial-audit — Sprint 6 · Consolidação Editorial do Glossário.
 *
 * Score 0–100 por verbete + pendências por campo + geração granular via IA
 * (glossary-generate-deep aceita { slug, field }). Toda geração vira draft.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Sparkles, AlertCircle, CheckCircle2, ExternalLink, Award, Filter,
} from "lucide-react";

const GOLD_MIN = 20;

type Field =
  | "deep_interpretation" | "etymology" | "historical_context"
  | "practical_application" | "logos_meditation" | "faq"
  | "bibliography" | "bible_verses" | "catechism_references"
  | "fathers_refs" | "magisterium_references";

interface Check {
  field: Field | "definition" | "short_definition" | "nexus";
  label: string;
  weight: number;
  ok: boolean;
  generable: boolean;
}

interface Row {
  slug: string;
  term: string;
  status: string;
  editorial_completeness: string | null;
  score: number;
  nexus_count: number;
  checks: Check[];
  pending: number;
}

interface Totals {
  total: number;
  published: number;
  drafts: number;
  gold: number;
  perfect: number;
  critical: number;
  avg: number;
}

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "draft", label: "Drafts" },
  { key: "lt80", label: "Score < 80" },
  { key: "lt70", label: "Score < 70 (críticos)" },
  { key: "no_deep", label: "Sem interpretação" },
  { key: "no_faq", label: "Sem FAQ" },
  { key: "no_logos", label: "Sem Logos" },
  { key: "no_nexus", label: "Nexus incompleto" },
  { key: "no_fathers", label: "Sem Patrística" },
  { key: "no_mag", label: "Sem Magistério" },
] as const;
type FilterKey = typeof FILTERS[number]["key"];

function computeChecks(r: any): Check[] {
  const nz = (v: any) => typeof v === "string" && v.trim().length >= 20;
  const arr = (v: any, min = 1) => Array.isArray(v) && v.length >= min;
  const nexusCount = Array.isArray(r.nexus_refs) ? r.nexus_refs.length : 0;
  return [
    { field: "short_definition", label: "Definição curta", weight: 4, ok: nz(r.short_definition), generable: false },
    { field: "definition", label: "Definição", weight: 8, ok: nz(r.definition), generable: false },
    { field: "deep_interpretation", label: "Interpretação profunda", weight: 15, ok: nz(r.deep_interpretation), generable: true },
    { field: "etymology", label: "Etimologia", weight: 8, ok: nz(r.etymology), generable: true },
    { field: "historical_context", label: "Contexto histórico", weight: 8, ok: nz(r.historical_context), generable: true },
    { field: "practical_application", label: "Aplicação prática", weight: 8, ok: nz(r.practical_application), generable: true },
    { field: "logos_meditation", label: "Meditação Logos", weight: 8, ok: nz(r.logos_meditation), generable: true },
    { field: "faq", label: "FAQ (≥3)", weight: 8, ok: arr(r.faq, 3), generable: true },
    { field: "bibliography", label: "Bibliografia (≥3)", weight: 7, ok: arr(r.bibliography, 3), generable: true },
    { field: "bible_verses", label: "Bíblia (≥3)", weight: 6, ok: arr(r.bible_verses, 3), generable: true },
    { field: "catechism_references", label: "CIC (≥2)", weight: 6, ok: arr(r.catechism_references, 2), generable: true },
    { field: "fathers_refs", label: "Padres (≥1)", weight: 5, ok: arr(r.fathers_refs, 1), generable: true },
    { field: "magisterium_references", label: "Magistério (≥1)", weight: 5, ok: arr(r.magisterium_references, 1), generable: true },
    { field: "nexus", label: `Nexus ${nexusCount}/${GOLD_MIN}`, weight: 4, ok: nexusCount >= GOLD_MIN, generable: false },
  ];
}

function scoreOf(checks: Check[]): number {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter(c => c.ok).reduce((s, c) => s + c.weight, 0);
  return Math.round((earned / total) * 100);
}

export default function EditorialAuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals>({
    total: 0, published: 0, drafts: 0, gold: 0, perfect: 0, critical: 0, avg: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // "slug:field"
  const [batchField, setBatchField] = useState<Field>("deep_interpretation");
  const [batchRunning, setBatchRunning] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e1 } = await supabase
        .from("glossary")
        .select("slug,term,status,editorial_completeness,short_definition,definition,deep_interpretation,etymology,historical_context,practical_application,logos_meditation,faq,bibliography,bible_verses,catechism_references,fathers_refs,magisterium_references,nexus_refs")
        .order("term");
      if (e1) throw e1;

      const list: Row[] = (data ?? []).map((r: any) => {
        const checks = computeChecks(r);
        const nexusCount = Array.isArray(r.nexus_refs) ? r.nexus_refs.length : 0;
        return {
          slug: r.slug,
          term: r.term,
          status: r.status,
          editorial_completeness: r.editorial_completeness,
          score: scoreOf(checks),
          nexus_count: nexusCount,
          checks,
          pending: checks.filter(c => !c.ok && c.generable).length,
        };
      });

      const published = list.filter(r => r.status === "published");
      const drafts = list.filter(r => r.status === "draft");
      const gold = list.filter(r => r.nexus_count >= GOLD_MIN);
      const perfect = list.filter(r => r.score === 100);
      const critical = list.filter(r => r.score < 70);
      const avg = list.length ? Math.round(list.reduce((s, r) => s + r.score, 0) / list.length) : 0;

      setRows(list);
      setTotals({
        total: list.length,
        published: published.length,
        drafts: drafts.length,
        gold: gold.length,
        perfect: perfect.length,
        critical: critical.length,
        avg,
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      if (q && !(r.term.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q))) return false;
      switch (filter) {
        case "published": return r.status === "published";
        case "draft": return r.status === "draft";
        case "lt80": return r.score < 80;
        case "lt70": return r.score < 70;
        case "no_deep": return !r.checks.find(c => c.field === "deep_interpretation")!.ok;
        case "no_faq": return !r.checks.find(c => c.field === "faq")!.ok;
        case "no_logos": return !r.checks.find(c => c.field === "logos_meditation")!.ok;
        case "no_nexus": return r.nexus_count < GOLD_MIN;
        case "no_fathers": return !r.checks.find(c => c.field === "fathers_refs")!.ok;
        case "no_mag": return !r.checks.find(c => c.field === "magisterium_references")!.ok;
        default: return true;
      }
    }).sort((a, b) => a.score - b.score);
  }, [rows, filter, query]);

  const generateField = useCallback(async (slug: string, field: Field) => {
    const key = `${slug}:${field}`;
    setBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke("glossary-generate-deep", {
        body: { slug, field },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`${slug} · ${field}: gerado. Verbete voltou para draft.`);
      await load();
    } catch (e: any) {
      toast.error(`${slug} · ${field}: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(null);
    }
  }, [load]);

  const generateBatch = useCallback(async () => {
    const targets = filtered.filter(r => {
      const c = r.checks.find(x => x.field === batchField);
      return c && !c.ok && c.generable;
    }).map(r => r.slug);
    if (targets.length === 0) {
      toast.info("Nada pendente para o campo selecionado no filtro atual.");
      return;
    }
    if (!confirm(`Gerar "${batchField}" para ${targets.length} verbete(s) via IA? Todos voltam para draft.`)) return;

    setBatchRunning(true);
    let ok = 0, fail = 0;
    for (const slug of targets) {
      setBusy(`${slug}:${batchField}`);
      try {
        const { data, error } = await supabase.functions.invoke("glossary-generate-deep", {
          body: { slug, field: batchField },
        });
        if (error || (data as any)?.error) throw new Error(error?.message ?? (data as any)?.error);
        ok++;
      } catch (e) {
        console.error(`[batch] ${slug}:${batchField}`, e);
        fail++;
      }
      await new Promise(r => setTimeout(r, 800));
    }
    setBusy(null);
    setBatchRunning(false);
    toast[fail === 0 ? "success" : "warning"](
      `Batch concluído · ${ok} ok · ${fail} falha(s). Revise em /admin/glossario.`,
    );
    await load();
  }, [filtered, batchField, load]);

  const certified = totals.total > 0 && totals.perfect === totals.total;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Helmet>
        <title>Editorial Audit · Glossário · Cathedra Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Sprint 6 · Consolidação Editorial
        </p>
        <h1 className="text-3xl font-serif">Editorial Audit · Glossário</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Score 0–100 por verbete no padrão Logos 2030 + Nexus Ouro. Toda geração via IA
          rebaixa o verbete para <code>draft</code> — revisão em <Link to="/admin/glossario" className="underline">/admin/glossario</Link>.
        </p>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">Erro: {error}</p>}

      {!loading && !error && (
        <>
          {certified && (
            <Card className="mb-6 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent">
              <CardContent className="flex items-center gap-4 py-5">
                <Award className="h-10 w-10 text-amber-600" />
                <div>
                  <p className="text-lg font-serif">🏅 Glossário Certificado</p>
                  <p className="text-xs text-muted-foreground">
                    100% Editorial · 100% Nexus · 100% Logos · 100% SEO · 100% MCP Ready · 100% IA Ready
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <Summary label="Total" value={totals.total} />
            <Summary label="Publicados" value={totals.published} tone="ok" />
            <Summary label="Drafts" value={totals.drafts} tone="warn" />
            <Summary label="Nexus Ouro" value={`${totals.gold}/${totals.total}`} />
            <Summary label="Score médio" value={`${totals.avg}%`}
              tone={totals.avg >= 90 ? "ok" : totals.avg >= 75 ? "warn" : "bad"} />
            <Summary label="Verbetes 100%" value={totals.perfect} tone="ok" />
            <Summary label="Críticos <70" value={totals.critical}
              tone={totals.critical === 0 ? "ok" : "bad"} />
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Buscar
              </label>
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="termo ou slug…"
                className="mt-1"
              />
            </div>
            <div className="min-w-[200px]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Filter className="mr-1 inline h-3 w-3" /> Filtro
              </label>
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FILTERS.map(f => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[220px]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Correção em massa
              </label>
              <div className="mt-1 flex gap-2">
                <Select value={batchField} onValueChange={(v) => setBatchField(v as Field)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deep_interpretation">Interpretação profunda</SelectItem>
                    <SelectItem value="etymology">Etimologia</SelectItem>
                    <SelectItem value="historical_context">Contexto histórico</SelectItem>
                    <SelectItem value="practical_application">Aplicação prática</SelectItem>
                    <SelectItem value="logos_meditation">Meditação Logos</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                    <SelectItem value="bibliography">Bibliografia</SelectItem>
                    <SelectItem value="bible_verses">Bíblia</SelectItem>
                    <SelectItem value="catechism_references">Catecismo</SelectItem>
                    <SelectItem value="fathers_refs">Padres</SelectItem>
                    <SelectItem value="magisterium_references">Magistério</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateBatch} disabled={batchRunning} size="sm">
                  {batchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">
            {filtered.length} de {rows.length} verbete(s) — ordenados por score crescente.
          </p>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <Card><CardContent className="py-6 text-sm text-muted-foreground">
                Nenhum verbete no filtro atual.
              </CardContent></Card>
            )}
            {filtered.map(r => (
              <Card key={r.slug}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                      <Link to={`/glossario/${r.slug}`} className="hover:underline">
                        {r.term}
                      </Link>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <Badge variant={r.status === "published" ? "default" : "outline"} className="text-[10px]">
                        {r.status}
                      </Badge>
                      {r.editorial_completeness && (
                        <Badge variant="outline" className="text-[10px]">
                          {r.editorial_completeness}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={r.score} className="h-2 flex-1 max-w-xs" />
                      <span className={`text-sm font-bold tabular-nums ${
                        r.score === 100 ? "text-emerald-600"
                        : r.score >= 80 ? "text-emerald-700"
                        : r.score >= 70 ? "text-amber-700"
                        : "text-red-700"
                      }`}>{r.score}%</span>
                      <span className="text-xs text-muted-foreground">
                        {r.pending} pendência(s)
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/admin/glossario?slug=${r.slug}`}
                    className="text-xs text-muted-foreground hover:underline whitespace-nowrap"
                  >
                    editar →
                  </Link>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 text-[11px]">
                    {r.checks.map(c => {
                      const canGen = c.generable && !c.ok;
                      const key = `${r.slug}:${c.field}`;
                      const isBusy = busy === key;
                      return (
                        <div key={c.field}
                          className={`flex items-center gap-1.5 rounded border px-2 py-1 ${
                            c.ok ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700"
                                 : "border-amber-500/30 bg-amber-500/5 text-amber-700"
                          }`}>
                          {c.ok ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                                : <AlertCircle className="h-3 w-3 shrink-0" />}
                          <span className="truncate flex-1">{c.label}</span>
                          {canGen && (
                            <button
                              type="button"
                              onClick={() => generateField(r.slug, c.field as Field)}
                              disabled={isBusy || batchRunning}
                              title={`Gerar ${c.label} via IA`}
                              className="rounded p-0.5 hover:bg-amber-500/20 disabled:opacity-40"
                            >
                              {isBusy ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <Sparkles className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Summary({
  label, value, tone = "neutral",
}: { label: string; value: string | number; tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const cls =
    tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5"
    : tone === "warn" ? "border-amber-500/30 bg-amber-500/5"
    : tone === "bad" ? "border-red-500/30 bg-red-500/5"
    : "border-border";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
