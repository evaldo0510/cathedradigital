/**
 * EditorialBulk — painel genérico de geração em fila por entidade.
 *
 * Reaproveita os wrappers `editorial_correction_priority(entity)` e a Edge
 * Function `editorial-generate`. Suporta glossary/prayers/catechism (todas
 * as entidades já plugadas no motor). Escolha via `?entity=<name>`.
 *
 * Foi criado como página enxuta para não regressar EditorialAudit (1.7k linhas,
 * hardcoded em glossary). Aqui vive o fluxo genérico de bulk generation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Pause, Play, Square, ArrowLeft, Loader2 } from "lucide-react";

type Entity = "glossary" | "prayers" | "catechism";

const ENTITY_LABEL: Record<Entity, string> = {
  glossary: "Glossário",
  prayers: "Orações",
  catechism: "Catecismo",
};

type PriorityRow = {
  slug: string;
  term: string;
  area: string | null;
  status: string | null;
  ice: number | null;
  editorial: number | null;
  nexus: number | null;
  missing_deep: boolean;
  missing_faq: boolean;
  missing_logos: boolean;
  missing_bible: boolean;
  missing_cic: boolean;
  missing_fathers: boolean;
  missing_count: number;
  effort_tier: string | null;
  inbound_refs: number | null;
  impact_tier: string | null;
  priority: string | null;
};

type Task = { slug: string; term: string; field: string };
type Result = Task & { ok: boolean; error?: string };

const FIELD_MAP: Array<{ key: keyof PriorityRow; field: string; label: string }> = [
  { key: "missing_deep",    field: "deep_interpretation",    label: "Interpretação profunda" },
  { key: "missing_faq",     field: "faq",                    label: "FAQ" },
  { key: "missing_logos",   field: "logos_meditation",       label: "Meditação Logos" },
  { key: "missing_bible",   field: "bible_verses",           label: "Bíblia" },
  { key: "missing_cic",     field: "catechism_references",   label: "CIC" },
  { key: "missing_fathers", field: "fathers_refs",           label: "Patrística" },
];

export default function EditorialBulk() {
  const [params, setParams] = useSearchParams();
  const entity = ((params.get("entity") ?? "catechism") as Entity);
  const [rows, setRows] = useState<PriorityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bucket, setBucket] = useState<"quick_win" | "red" | "orange" | "yellow" | "all">("quick_win");
  const [limit, setLimit] = useState(5);

  const [queue, setQueue] = useState<Task[]>([]);
  const [done, setDone] = useState(0);
  const [current, setCurrent] = useState<Task | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const ctrl = useRef<{ paused: boolean; cancelled: boolean }>({ paused: false, cancelled: false });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (supabase as any)
      .rpc("editorial_correction_priority", { _entity: entity })
      .then(({ data, error }: any) => {
        if (cancelled) return;
        if (error) {
          toast.error(`Falha ao carregar prioridade: ${error.message}`);
          setRows([]);
        } else {
          setRows((data ?? []) as PriorityRow[]);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [entity]);

  const buckets = useMemo(() => {
    const out = { quick_win: [] as PriorityRow[], red: [] as PriorityRow[], orange: [] as PriorityRow[], yellow: [] as PriorityRow[], all: [] as PriorityRow[] };
    for (const r of rows) {
      const p = (r.priority ?? "").toLowerCase();
      out.all.push(r);
      if (p === "quick_win") out.quick_win.push(r);
      else if (p === "red") out.red.push(r);
      else if (p === "orange") out.orange.push(r);
      else if (p === "yellow") out.yellow.push(r);
    }
    return out;
  }, [rows]);

  const preview = useMemo(() => {
    const src = buckets[bucket].slice(0, limit);
    const tasks: Task[] = [];
    for (const r of src) {
      for (const m of FIELD_MAP) if (r[m.key]) tasks.push({ slug: r.slug, term: r.term, field: m.field });
    }
    return { entries: src, tasks };
  }, [buckets, bucket, limit]);

  const run = useCallback(async () => {
    if (running) return;
    const tasks = preview.tasks;
    if (tasks.length === 0) { toast.info("Nada a gerar neste bucket."); return; }
    if (!window.confirm(`Gerar ${tasks.length} campo(s) em ${preview.entries.length} verbete(s) via IA?`)) return;
    ctrl.current = { paused: false, cancelled: false };
    setQueue(tasks); setDone(0); setResults([]); setRunning(true);
    for (let i = 0; i < tasks.length; i++) {
      while (ctrl.current.paused && !ctrl.current.cancelled) await new Promise(r => setTimeout(r, 300));
      if (ctrl.current.cancelled) break;
      const t = tasks[i];
      setCurrent(t);
      try {
        const { data, error } = await supabase.functions.invoke("editorial-generate", {
          body: { entity, slug: t.slug, field: t.field },
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        setResults(prev => [...prev, { ...t, ok: true }]);
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        setResults(prev => [...prev, { ...t, ok: false, error: msg }]);
        if (msg?.includes("429")) toast.error("Rate limit — aguarde e continue.");
        if (msg?.includes("402")) { toast.error("Créditos IA esgotados."); ctrl.current.cancelled = true; }
      }
      setDone(i + 1);
    }
    setCurrent(null); setRunning(false);
    toast.success("Fila finalizada.");
  }, [preview, running, entity]);

  const retryFailed = useCallback(async () => {
    const failed = results.filter(r => !r.ok).map(({ slug, term, field }) => ({ slug, term, field }));
    if (failed.length === 0) return;
    ctrl.current = { paused: false, cancelled: false };
    setQueue(failed); setDone(0); setResults([]); setRunning(true);
    for (let i = 0; i < failed.length; i++) {
      if (ctrl.current.cancelled) break;
      const t = failed[i]; setCurrent(t);
      try {
        const { data, error } = await supabase.functions.invoke("editorial-generate", { body: { entity, slug: t.slug, field: t.field } });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        setResults(prev => [...prev, { ...t, ok: true }]);
      } catch (e: any) {
        setResults(prev => [...prev, { ...t, ok: false, error: e?.message ?? String(e) }]);
      }
      setDone(i + 1);
    }
    setCurrent(null); setRunning(false);
  }, [results, entity]);

  const pct = queue.length > 0 ? Math.round((done / queue.length) * 100) : 0;
  const ok = results.filter(r => r.ok).length;
  const fail = results.length - ok;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/mission-control" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Mission Control
          </Link>
          <h1 className="mt-1 text-2xl font-serif">Bulk Editorial · {ENTITY_LABEL[entity]}</h1>
          <p className="text-sm text-muted-foreground">Geração em fila por bucket de prioridade. Todos os itens voltam para <code>draft</code> após IA.</p>
        </div>
        <Select value={entity} onValueChange={(v) => setParams({ entity: v })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="catechism">Catecismo</SelectItem>
            <SelectItem value="glossary">Glossário</SelectItem>
            <SelectItem value="prayers">Orações</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card className="p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando prioridade…</Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(["quick_win","red","orange","yellow","all"] as const).map(k => (
                <button key={k} onClick={() => setBucket(k)}
                  className={`rounded border p-3 text-left transition ${bucket===k?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`}>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {k === "quick_win" ? "🟢 Quick wins" : k === "red" ? "🔴 Alto impacto" : k === "orange" ? "🟠 Médio" : k === "yellow" ? "🟡 Baixo" : "Todos"}
                  </div>
                  <div className="text-2xl font-bold tabular-nums">{buckets[k].length}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm">Limite:</label>
              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3,5,10,20,50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Badge variant="secondary">{preview.entries.length} verbete(s) · {preview.tasks.length} campo(s)</Badge>
              <div className="ml-auto flex gap-2">
                {running && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { ctrl.current.paused = !ctrl.current.paused; }}>
                      {ctrl.current.paused ? <><Play className="mr-1 h-3 w-3" /> Continuar</> : <><Pause className="mr-1 h-3 w-3" /> Pausar</>}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { ctrl.current.cancelled = true; }}>
                      <Square className="mr-1 h-3 w-3" /> Cancelar
                    </Button>
                  </>
                )}
                {!running && fail > 0 && (
                  <Button size="sm" variant="outline" onClick={retryFailed}>Reprocessar {fail} falha(s)</Button>
                )}
                <Button size="sm" onClick={run} disabled={running || preview.tasks.length === 0}>
                  {running ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> {done}/{queue.length}</>
                    : <><Sparkles className="mr-1 h-3 w-3" /> Gerar</>}
                </Button>
              </div>
            </div>

            {queue.length > 0 && (
              <div className="space-y-1">
                <Progress value={pct} />
                <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{done}/{queue.length} · {pct}% · ✔ {ok} · ✖ {fail}</span>
                  {current && running && <span>→ {current.term} · {current.field}</span>}
                </div>
              </div>
            )}

            <div className="max-h-96 overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">Verbete</th>
                    <th className="p-2 text-left">Área</th>
                    <th className="p-2 text-right">ICE</th>
                    <th className="p-2 text-right">Faltando</th>
                    <th className="p-2 text-right">Refs</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.entries.map(r => (
                    <tr key={r.slug} className="border-t">
                      <td className="p-2 font-medium">{r.term}<div className="text-xs text-muted-foreground">{r.slug}</div></td>
                      <td className="p-2 text-muted-foreground">{r.area ?? "—"}</td>
                      <td className="p-2 text-right tabular-nums">{r.ice != null ? Number(r.ice).toFixed(0) : "—"}</td>
                      <td className="p-2 text-right tabular-nums">{r.missing_count}</td>
                      <td className="p-2 text-right tabular-nums">{r.inbound_refs ?? 0}</td>
                    </tr>
                  ))}
                  {preview.entries.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Bucket vazio.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {results.length > 0 && (
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">Resultado</div>
              <div className="max-h-64 overflow-auto text-xs font-mono space-y-1">
                {results.map((r, i) => (
                  <div key={i} className={r.ok ? "text-emerald-700" : "text-red-700"}>
                    {r.ok ? "✔" : "✖"} {r.slug} · {r.field}{r.error ? ` — ${r.error}` : ""}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
