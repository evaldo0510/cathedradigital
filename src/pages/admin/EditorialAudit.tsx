/**
 * /admin/editorial-audit — Sprint 6 · Consolidação Editorial do Glossário.
 *
 * Refinamentos Sprint 6 (pré-Santos):
 *  1. Índice de Confiança Editorial (ICE) — Ouro/Prata/Bronze/Revisão
 *  2. Scores separados: Editorial × Nexus
 *  3. Pendências Inteligentes com sugestões de fontes
 *  4. Histórico Editorial por verbete (criado/revisado/publicado/versão)
 *  5. Dashboard de Produção cross-módulo (Glossário, Santos, Orações, etc.)
 *  6. Sprint 6.5 · Selo de Congelamento Editorial
 *
 * Toda geração via IA rebaixa o verbete para draft.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Loader2, Sparkles, AlertCircle, CheckCircle2, ExternalLink, Award, Filter,
  History, Lightbulb, ChevronDown, Snowflake, ShieldCheck, TrendingDown, RefreshCw,
  Target, Lock, Trophy,
} from "lucide-react";

const GOLD_MIN = 20;

type Field =
  | "deep_interpretation" | "etymology" | "historical_context"
  | "practical_application" | "logos_meditation" | "faq"
  | "bibliography" | "bible_verses" | "catechism_references"
  | "fathers_refs" | "magisterium_references";

type Group = "editorial" | "nexus";

interface Check {
  field: Field | "definition" | "short_definition" | "nexus";
  label: string;
  weight: number;
  ok: boolean;
  generable: boolean;
  group: Group;
}

interface Row {
  slug: string;
  term: string;
  status: string;
  editorial_completeness: string | null;
  score: number;
  editorial_score: number;
  nexus_score: number;
  nexus_count: number;
  checks: Check[];
  pending: number;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  version: number | null;
  doctrinal_weight: number;
  nexus_refs: Array<{ kind?: string; slug?: string; ref?: string; label?: string }>;
}

interface Totals {
  total: number;
  published: number;
  drafts: number;
  gold: number;
  silver: number;
  bronze: number;
  needs_review: number;
  avg: number;
  avg_editorial: number;
  avg_nexus: number;
  avg_weighted: number;
}


interface ModuleStat {
  key: string;
  label: string;
  published: number;
  total: number;
  note?: string;
}

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "draft", label: "Drafts" },
  { key: "gold", label: "ICE Ouro (≥95)" },
  { key: "silver", label: "ICE Prata (85–94)" },
  { key: "bronze", label: "ICE Bronze (70–84)" },
  { key: "review", label: "Revisão obrigatória (<70)" },
  { key: "no_deep", label: "Sem interpretação" },
  { key: "no_faq", label: "Sem FAQ" },
  { key: "no_logos", label: "Sem Logos" },
  { key: "no_nexus", label: "Nexus incompleto" },
  { key: "no_fathers", label: "Sem Patrística" },
  { key: "no_mag", label: "Sem Magistério" },
] as const;
type FilterKey = typeof FILTERS[number]["key"];

/** Índice de Confiança Editorial */
function ice(score: number) {
  if (score >= 95) return { tier: "gold" as const, label: "Ouro", emoji: "🟢",
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" };
  if (score >= 85) return { tier: "silver" as const, label: "Prata", emoji: "🔵",
    cls: "border-sky-500/40 bg-sky-500/10 text-sky-700" };
  if (score >= 70) return { tier: "bronze" as const, label: "Bronze", emoji: "🟡",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-700" };
  return { tier: "review" as const, label: "Revisão obrigatória", emoji: "🔴",
    cls: "border-red-500/40 bg-red-500/10 text-red-700" };
}

function computeChecks(r: any): Check[] {
  const nz = (v: any) => typeof v === "string" && v.trim().length >= 20;
  const arr = (v: any, min = 1) => Array.isArray(v) && v.length >= min;
  const nexusCount = Array.isArray(r.nexus_refs) ? r.nexus_refs.length : 0;
  return [
    { field: "short_definition", label: "Definição curta", weight: 4, ok: nz(r.short_definition), generable: false, group: "editorial" },
    { field: "definition", label: "Definição", weight: 8, ok: nz(r.definition), generable: false, group: "editorial" },
    { field: "deep_interpretation", label: "Interpretação profunda", weight: 15, ok: nz(r.deep_interpretation), generable: true, group: "editorial" },
    { field: "etymology", label: "Etimologia", weight: 8, ok: nz(r.etymology), generable: true, group: "editorial" },
    { field: "historical_context", label: "Contexto histórico", weight: 8, ok: nz(r.historical_context), generable: true, group: "editorial" },
    { field: "practical_application", label: "Aplicação prática", weight: 8, ok: nz(r.practical_application), generable: true, group: "editorial" },
    { field: "logos_meditation", label: "Meditação Logos", weight: 8, ok: nz(r.logos_meditation), generable: true, group: "editorial" },
    { field: "faq", label: "FAQ (≥3)", weight: 8, ok: arr(r.faq, 3), generable: true, group: "editorial" },
    { field: "bibliography", label: "Bibliografia (≥3)", weight: 7, ok: arr(r.bibliography, 3), generable: true, group: "editorial" },
    { field: "bible_verses", label: "Bíblia (≥3)", weight: 6, ok: arr(r.bible_verses, 3), generable: true, group: "nexus" },
    { field: "catechism_references", label: "CIC (≥2)", weight: 6, ok: arr(r.catechism_references, 2), generable: true, group: "nexus" },
    { field: "fathers_refs", label: "Padres (≥1)", weight: 5, ok: arr(r.fathers_refs, 1), generable: true, group: "nexus" },
    { field: "magisterium_references", label: "Magistério (≥1)", weight: 5, ok: arr(r.magisterium_references, 1), generable: true, group: "nexus" },
    { field: "nexus", label: `Nexus ${nexusCount}/${GOLD_MIN}`, weight: 4, ok: nexusCount >= GOLD_MIN, generable: false, group: "nexus" },
  ];
}

function scoreOfGroup(checks: Check[], group?: Group): number {
  const sel = group ? checks.filter(c => c.group === group) : checks;
  const total = sel.reduce((s, c) => s + c.weight, 0) || 1;
  const earned = sel.filter(c => c.ok).reduce((s, c) => s + c.weight, 0);
  return Math.round((earned / total) * 100);
}

/** Sugestões editoriais por campo + slug (fallback genérico) */
const SLUG_SUGGESTIONS: Record<string, Partial<Record<Check["field"], string[]>>> = {
  trindade: {
    fathers_refs: ["Santo Agostinho — De Trinitate", "São Basílio — Sobre o Espírito Santo", "São Gregório Nazianzeno — Orações Teológicas"],
    catechism_references: ["CIC §§232–260"],
    bible_verses: ["Mt 28,19", "Jo 14,26", "2Cor 13,13"],
  },
  eucaristia: {
    fathers_refs: ["Santo Inácio de Antioquia — Ad Smyrnaeos", "São Justino — I Apologia 66", "Santo Agostinho — Sermão 227"],
    catechism_references: ["CIC §§1322–1419"],
    magisterium_references: ["Ecclesia de Eucharistia (João Paulo II)", "Sacrosanctum Concilium §§47–58"],
  },
  encarnacao: {
    fathers_refs: ["Santo Atanásio — De Incarnatione", "São Cirilo de Alexandria — Contra Nestório", "São Leão Magno — Tomus ad Flavianum"],
    catechism_references: ["CIC §§456–478"],
  },
  cristologia: {
    fathers_refs: ["Concílio de Calcedônia (451)", "São Máximo Confessor — Ambigua", "São João Damasceno — De Fide Orthodoxa"],
  },
  ressurreicao: {
    catechism_references: ["CIC §§638–658"], bible_verses: ["1Cor 15,3-8", "Lc 24", "Jo 20"],
  },
  purgatorio: {
    catechism_references: ["CIC §§1030–1032"],
    magisterium_references: ["Bento XVI — Spe Salvi §§45–48", "Concílio de Trento — Decreto sobre o Purgatório"],
  },
  fe: {
    catechism_references: ["CIC §§142–184", "CIC §§1814–1816"],
    magisterium_references: ["Bento XVI — Porta Fidei", "Vaticano II — Dei Verbum §5"],
  },
};

const GENERIC_SUGGESTIONS: Partial<Record<Check["field"], string[]>> = {
  fathers_refs: ["Verificar Patrologia Latina/Graeca", "Buscar homilias patrísticas relacionadas"],
  magisterium_references: ["Consultar encíclicas correlatas em vatican.va", "Verificar documentos conciliares"],
  bibliography: ["Adicionar ≥3 obras (clássica, moderna, contemporânea)"],
  bible_verses: ["Adicionar ≥3 passagens (AT, NT, Evangelhos)"],
  catechism_references: ["Consultar CIC (índice temático)"],
  faq: ["3 perguntas frequentes de leigos/catecúmenos"],
  logos_meditation: ["Meditação Logos 2030 (2–3 parágrafos contemplativos)"],
  etymology: ["Origem hebraica/grega/latina + evolução semântica"],
  historical_context: ["Contexto histórico-eclesial (concílios, controvérsias)"],
  practical_application: ["Aplicação na vida cristã hoje"],
  deep_interpretation: ["Interpretação teológica profunda (Escritura + Tradição)"],
};

function suggestionsFor(slug: string, field: Check["field"]): string[] {
  return SLUG_SUGGESTIONS[slug]?.[field] ?? GENERIC_SUGGESTIONS[field] ?? [];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso; }
}

interface Snapshot {
  id: string;
  captured_at: string;
  avg_ice: number;
  avg_editorial: number;
  avg_nexus: number;
  gold: number;
  silver: number;
  bronze: number;
  review: number;
  gate_passing: number;
  gate_failing: number;
  regressions: Array<{ slug: string; ice_prev: number; ice_now: number; editorial_delta: number; nexus_delta: number }>;
  trigger: string;
}

export default function EditorialAuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals>({
    total: 0, published: 0, drafts: 0, gold: 0, silver: 0, bronze: 0,
    needs_review: 0, avg: 0, avg_editorial: 0, avg_nexus: 0, avg_weighted: 0,
  });

  const [modules, setModules] = useState<ModuleStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [batchField, setBatchField] = useState<Field>("deep_interpretation");
  const [batchRunning, setBatchRunning] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [prevSnapshot, setPrevSnapshot] = useState<Snapshot | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [coverage, setCoverage] = useState<Array<{
    area: string; total: number; gold: number; silver: number; bronze: number;
    review: number; avg_ice: number; gate_passing: number;
  }>>([]);
  const [priorityRows, setPriorityRows] = useState<Array<{
    slug: string; term: string; area: string; status: string;
    ice: number; editorial: number; nexus: number;
    missing_deep: boolean; missing_faq: boolean; missing_logos: boolean;
    missing_bible: boolean; missing_cic: boolean; missing_fathers: boolean;
    missing_count: number; effort_tier: string;
    inbound_refs: number; impact_tier: string; priority: string;
  }>>([]);
  const [priorityFilter, setPriorityFilter] = useState<"quick_win" | "red" | "orange" | "yellow" | "all">("quick_win");

  // Sprint 6.1.1 · Corrigir Bucket em Lote — fila com progresso e retry
  // Sprint 6.1.1a · Inteligência da Fila — priorização, pause/resume/cancel, checkpoint, métricas, histórico
  type BatchTask = { slug: string; term: string; field: Field; priority?: number };
  type BatchResult = BatchTask & { ok: boolean; error?: string; ms?: number };
  const [bucketBatch, setBucketBatch] = useState<{
    running: boolean;
    paused: boolean;
    total: number;
    done: number;
    current: BatchTask | null;
    results: BatchResult[];
    label: string;
    jobId?: string;
    startedAt?: number;
    finishedAt?: number;
    iceBefore?: { avg: number; weighted: number };
    iceAfter?: { avg: number; weighted: number };
    checkpointAt?: number;
    tasks?: BatchTask[];
  } | null>(null);
  const controlRef = useRef<{ paused: boolean; cancelled: boolean }>({ paused: false, cancelled: false });
  const [resumable, setResumable] = useState<{ tasks: BatchTask[]; label: string; done: number } | null>(null);

  // Sprint 6.1.1a — histórico de operações
  const [jobs, setJobs] = useState<Array<{
    id: string; bucket: string; started_at: string; finished_at: string | null;
    duration_ms: number | null; tasks_total: number; tasks_ok: number; tasks_fail: number;
    ice_delta: number | null; ice_weighted_before: number | null; ice_weighted_after: number | null;
    status: string;
  }>>([]);
  const loadJobs = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("editorial_jobs")
      .select("id,bucket,started_at,finished_at,duration_ms,tasks_total,tasks_ok,tasks_fail,ice_delta,ice_weighted_before,ice_weighted_after,status")
      .eq("module", "glossary")
      .order("started_at", { ascending: false })
      .limit(10);
    if (data) setJobs(data as any[]);
  }, []);
  useEffect(() => { void loadJobs(); }, [loadJobs]);

  // Sprint 6.1.2 — total de relações Nexus canônicas (para certificado)
  const [nexusRelationCount, setNexusRelationCount] = useState<number>(0);
  useEffect(() => {
    (async () => {
      const { count } = await (supabase as any)
        .from("nexus_relations")
        .select("*", { count: "exact", head: true });
      if (typeof count === "number") setNexusRelationCount(count);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: gData, error: e1 }, mods] = await Promise.all([
        supabase
          .from("glossary")
          .select("slug,term,status,editorial_completeness,short_definition,definition,deep_interpretation,etymology,historical_context,practical_application,logos_meditation,faq,bibliography,bible_verses,catechism_references,fathers_refs,magisterium_references,nexus_refs,doctrinal_weight,created_at,updated_at,published_at,reviewed_at,reviewed_by,version")
          .order("term"),
        loadModuleStats(),
      ]);
      if (e1) throw e1;

      const list: Row[] = (gData ?? []).map((r: any) => {
        const checks = computeChecks(r);
        const nexusCount = Array.isArray(r.nexus_refs) ? r.nexus_refs.length : 0;
        return {
          slug: r.slug,
          term: r.term,
          status: r.status,
          editorial_completeness: r.editorial_completeness,
          score: scoreOfGroup(checks),
          editorial_score: scoreOfGroup(checks, "editorial"),
          nexus_score: scoreOfGroup(checks, "nexus"),
          nexus_count: nexusCount,
          checks,
          pending: checks.filter(c => !c.ok && c.generable).length,
          created_at: r.created_at, updated_at: r.updated_at, published_at: r.published_at,
          reviewed_at: r.reviewed_at, reviewed_by: r.reviewed_by, version: r.version,
          doctrinal_weight: typeof r.doctrinal_weight === "number" ? r.doctrinal_weight : 5,
          nexus_refs: Array.isArray(r.nexus_refs) ? r.nexus_refs : [],
        };
      });

      const published = list.filter(r => r.status === "published").length;
      const drafts = list.filter(r => r.status === "draft").length;
      let gold = 0, silver = 0, bronze = 0, needs_review = 0;
      list.forEach(r => {
        const t = ice(r.score).tier;
        if (t === "gold") gold++;
        else if (t === "silver") silver++;
        else if (t === "bronze") bronze++;
        else needs_review++;
      });
      const avg = list.length ? Math.round(list.reduce((s, r) => s + r.score, 0) / list.length) : 0;
      const avg_editorial = list.length ? Math.round(list.reduce((s, r) => s + r.editorial_score, 0) / list.length) : 0;
      const avg_nexus = list.length ? Math.round(list.reduce((s, r) => s + r.nexus_score, 0) / list.length) : 0;
      const weightSum = list.reduce((s, r) => s + (r.doctrinal_weight || 1), 0) || 1;
      const avg_weighted = Math.round(list.reduce((s, r) => s + r.score * (r.doctrinal_weight || 1), 0) / weightSum);

      setRows(list);
      setTotals({ total: list.length, published, drafts, gold, silver, bronze, needs_review, avg, avg_editorial, avg_nexus, avg_weighted });
      setModules(mods);

    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadSnapshots = useCallback(async () => {
    const { data } = await supabase
      .from("editorial_snapshots")
      .select("*")
      .eq("module", "glossary")
      .order("captured_at", { ascending: false })
      .limit(2);
    if (data && data.length > 0) {
      setSnapshot(data[0] as unknown as Snapshot);
      setPrevSnapshot((data[1] as unknown as Snapshot) ?? null);
    }
  }, []);
  useEffect(() => { void loadSnapshots(); }, [loadSnapshots]);

  const loadStrategy = useCallback(async () => {
    const [{ data: cov }, { data: prio }] = await Promise.all([
      (supabase as any).rpc("glossary_doctrinal_coverage"),
      (supabase as any).rpc("glossary_correction_priority"),
    ]);
    if (cov) setCoverage(cov as any[]);
    if (prio) setPriorityRows(prio as any[]);
  }, []);
  useEffect(() => { void loadStrategy(); }, [loadStrategy]);

  const runAudit = useCallback(async () => {
    setAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("glossary-daily-audit", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Auditoria concluída · snapshot registrado.");
      await Promise.all([loadSnapshots(), load(), loadStrategy()]);
    } catch (e: any) {
      toast.error(`Auditoria falhou: ${e?.message ?? String(e)}`);
    } finally {
      setAuditing(false);
    }
  }, [load, loadSnapshots, loadStrategy]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      if (q && !(r.term.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q))) return false;
      const tier = ice(r.score).tier;
      switch (filter) {
        case "published": return r.status === "published";
        case "draft": return r.status === "draft";
        case "gold": return tier === "gold";
        case "silver": return tier === "silver";
        case "bronze": return tier === "bronze";
        case "review": return tier === "review";
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

  // Sprint 6.1.1a — helpers de inteligência da fila
  const CKPT_KEY = "editorial-audit:checkpoint:v1";
  const CKPT_EVERY = 5;

  /** Prioridade = doctrinal_weight × max(inbound_refs,1) × missing_count.
   * Ordena tarefas de modo que verbetes de maior peso doutrinal / mais referenciados sejam corrigidos primeiro. */
  const prioritizeTasks = useCallback((tasks: BatchTask[]): BatchTask[] => {
    const idx = new Map<string, { weight: number; inbound: number; missing: number }>();
    for (const r of priorityRows) {
      const missing = [r.missing_deep, r.missing_faq, r.missing_logos, r.missing_bible, r.missing_cic, r.missing_fathers].filter(Boolean).length;
      const weight = rows.find(x => x.slug === r.slug)?.doctrinal_weight ?? 5;
      idx.set(r.slug, { weight, inbound: r.inbound_refs || 0, missing });
    }
    return tasks.map(t => {
      const m = idx.get(t.slug);
      const p = m ? m.weight * Math.max(m.inbound, 1) * Math.max(m.missing, 1) : 1;
      return { ...t, priority: p };
    }).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [priorityRows, rows]);

  const persistCheckpoint = useCallback((jobId: string | undefined, tasks: BatchTask[], results: BatchResult[], label: string, iceBefore: any) => {
    try {
      localStorage.setItem(CKPT_KEY, JSON.stringify({
        jobId, tasks, results, label, iceBefore, savedAt: Date.now(),
      }));
    } catch {}
  }, []);
  const clearCheckpoint = useCallback(() => { try { localStorage.removeItem(CKPT_KEY); } catch {} }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CKPT_KEY);
      if (!raw) return;
      const c = JSON.parse(raw);
      if (Array.isArray(c?.tasks) && Array.isArray(c?.results) && c.results.length < c.tasks.length) {
        setResumable({ tasks: c.tasks, label: c.label ?? "checkpoint", done: c.results.length });
      }
    } catch {}
  }, []);

  /** Sprint 6.1.1 + 6.1.1a — executa uma fila com priorização, pause/cancel, checkpoint e job de histórico. */
  const runQueue = useCallback(async (
    rawTasks: BatchTask[],
    label: string,
    opts?: { resumeResults?: BatchResult[]; resumeJobId?: string; skipConfirm?: boolean },
  ) => {
    if (rawTasks.length === 0) { toast.info("Nada a corrigir neste bucket."); return; }
    const tasks = opts?.resumeResults ? rawTasks : prioritizeTasks(rawTasks);
    const priorPreview = tasks.slice(0, 3).map(t => t.term).join(", ");
    if (!opts?.skipConfirm && !confirm(
      `Corrigir bucket "${label}"?\n\n${tasks.length} tarefa(s) — ordenadas por impacto doutrinal.\nPrimeiros: ${priorPreview}\n\nCada verbete volta para draft após IA.`
    )) return;

    controlRef.current = { paused: false, cancelled: false };
    const iceBefore = { avg: totals.avg, weighted: totals.avg_weighted };
    const startedAt = Date.now();
    const results: BatchResult[] = opts?.resumeResults ? [...opts.resumeResults] : [];
    const startIdx = results.length;

    // Registrar job no histórico
    let jobId = opts?.resumeJobId;
    if (!jobId) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data: jobRow, error: jobErr } = await (supabase as any)
          .from("editorial_jobs")
          .insert({
            module: "glossary",
            bucket: label,
            operator: userData?.user?.id,
            tasks_total: tasks.length,
            status: "running",
            ice_before: iceBefore.avg,
            ice_weighted_before: iceBefore.weighted,
            metadata: { first_targets: priorPreview },
          })
          .select("id")
          .single();
        if (!jobErr && jobRow) jobId = (jobRow as any).id;
      } catch (e) { console.warn("[editorial_jobs] insert falhou", e); }
    }

    setBucketBatch({
      running: true, paused: false, total: tasks.length, done: startIdx,
      current: null, results, label, jobId, startedAt, iceBefore, tasks,
    });

    for (let i = startIdx; i < tasks.length; i++) {
      // Pausa
      while (controlRef.current.paused && !controlRef.current.cancelled) {
        await new Promise(r => setTimeout(r, 400));
      }
      if (controlRef.current.cancelled) break;

      const t = tasks[i];
      setBucketBatch(b => b && ({ ...b, current: t, done: i, paused: controlRef.current.paused }));
      const t0 = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke("glossary-generate-deep", {
          body: { slug: t.slug, field: t.field },
        });
        if (error || (data as any)?.error) throw new Error(error?.message ?? (data as any)?.error);
        results.push({ ...t, ok: true, ms: Date.now() - t0 });
      } catch (e: any) {
        console.error(`[bucket-batch] ${t.slug}:${t.field}`, e);
        results.push({ ...t, ok: false, error: e?.message ?? String(e), ms: Date.now() - t0 });
      }
      setBucketBatch(b => b && ({ ...b, results: [...results] }));

      // Checkpoint a cada N
      if ((i + 1) % CKPT_EVERY === 0) {
        persistCheckpoint(jobId, tasks, results, label, iceBefore);
        setBucketBatch(b => b && ({ ...b, checkpointAt: Date.now() }));
      }

      await new Promise(r => setTimeout(r, 700));
    }

    const cancelled = controlRef.current.cancelled;
    const finishedAt = Date.now();
    const ok = results.filter(r => r.ok).length;
    const fail = results.filter(r => !r.ok).length;

    // Recarrega para capturar ICE depois
    await Promise.all([load(), loadStrategy()]);

    // ICE depois: computa da recarga atual (usa closure após load — usamos setBucketBatch com totals via callback do próximo render é complicado; usamos next totals via re-read)
    // Como load() atualiza state async, buscamos direto:
    let iceAfter = { avg: iceBefore.avg, weighted: iceBefore.weighted };
    try {
      const { data: g } = await supabase
        .from("glossary")
        .select("short_definition,definition,deep_interpretation,etymology,historical_context,practical_application,logos_meditation,faq,bibliography,bible_verses,catechism_references,fathers_refs,magisterium_references,nexus_refs,doctrinal_weight");
      if (g && g.length) {
        const scores = g.map((r: any) => scoreOfGroup(computeChecks(r)));
        const avg = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
        const wSum = g.reduce((s: number, r: any) => s + (r.doctrinal_weight || 1), 0) || 1;
        const w = Math.round(g.reduce((s: number, r: any, i: number) => s + scores[i] * (r.doctrinal_weight || 1), 0) / wSum);
        iceAfter = { avg, weighted: w };
      }
    } catch {}

    setBucketBatch(b => b && ({
      ...b, running: false, paused: false, done: results.length,
      current: null, finishedAt, iceAfter,
    }));

    // Fecha job
    if (jobId) {
      try {
        await (supabase as any).from("editorial_jobs").update({
          finished_at: new Date(finishedAt).toISOString(),
          duration_ms: finishedAt - startedAt,
          tasks_ok: ok, tasks_fail: fail,
          ice_after: iceAfter.avg,
          ice_weighted_after: iceAfter.weighted,
          ice_delta: Number((iceAfter.weighted - iceBefore.weighted).toFixed(2)),
          status: cancelled ? "cancelled" : (fail > 0 ? "completed" : "completed"),
          results: results.map(r => ({ slug: r.slug, field: r.field, ok: r.ok, ms: r.ms, error: r.error })),
        }).eq("id", jobId);
      } catch (e) { console.warn("[editorial_jobs] update falhou", e); }
    }

    clearCheckpoint();
    setResumable(null);
    toast[fail === 0 && !cancelled ? "success" : "warning"](
      `Bucket "${label}" · ${ok} ok · ${fail} falha(s)${cancelled ? " · cancelado" : ""} · ΔICE ${(iceAfter.weighted - iceBefore.weighted).toFixed(1)}`
    );
  }, [prioritizeTasks, totals.avg, totals.avg_weighted, load, loadStrategy, persistCheckpoint, clearCheckpoint, loadJobs]);

  const buildTasksFromBucket = useCallback((bucketRows: typeof priorityRows): BatchTask[] => {
    const tasks: BatchTask[] = [];
    for (const r of bucketRows) {
      if (r.missing_deep)    tasks.push({ slug: r.slug, term: r.term, field: "deep_interpretation" });
      if (r.missing_faq)     tasks.push({ slug: r.slug, term: r.term, field: "faq" });
      if (r.missing_logos)   tasks.push({ slug: r.slug, term: r.term, field: "logos_meditation" });
      if (r.missing_bible)   tasks.push({ slug: r.slug, term: r.term, field: "bible_verses" });
      if (r.missing_cic)     tasks.push({ slug: r.slug, term: r.term, field: "catechism_references" });
      if (r.missing_fathers) tasks.push({ slug: r.slug, term: r.term, field: "fathers_refs" });
    }
    return tasks;
  }, []);

  const retryFailed = useCallback(async () => {
    if (!bucketBatch) return;
    const failed = bucketBatch.results.filter(r => !r.ok).map(({ slug, term, field }) => ({ slug, term, field }));
    if (failed.length === 0) { toast.info("Nenhuma falha para reprocessar."); return; }
    await runQueue(failed, `${bucketBatch.label} · retry`);
  }, [bucketBatch, runQueue]);

  // Sprint 6.1.1a — controles pause / resume / cancel
  const togglePause = useCallback(() => {
    controlRef.current.paused = !controlRef.current.paused;
    setBucketBatch(b => b && ({ ...b, paused: controlRef.current.paused }));
  }, []);
  const cancelBatch = useCallback(() => {
    if (!confirm("Cancelar a execução? Tarefas já feitas serão preservadas.")) return;
    controlRef.current.cancelled = true;
    controlRef.current.paused = false;
  }, []);
  const resumeFromCheckpoint = useCallback(async () => {
    if (!resumable) return;
    const raw = localStorage.getItem(CKPT_KEY);
    if (!raw) { setResumable(null); return; }
    try {
      const c = JSON.parse(raw);
      await runQueue(c.tasks, c.label, { resumeResults: c.results, resumeJobId: c.jobId, skipConfirm: true });
    } catch (e: any) {
      toast.error(`Não foi possível retomar: ${e?.message ?? e}`);
      clearCheckpoint(); setResumable(null);
      void loadJobs();
    }
  }, [resumable, runQueue, clearCheckpoint]);
  const discardCheckpoint = useCallback(() => { clearCheckpoint(); setResumable(null); }, [clearCheckpoint]);

  // Sprint 6.5 · Selo de Congelamento Editorial
  const freezeCriteria = useMemo(() => {
    const totalPublished = totals.published === totals.total && totals.total > 0;
    return [
      { key: "gold", label: "100% ICE Ouro", ok: totals.total > 0 && totals.gold === totals.total },
      { key: "editorial", label: "Média Editorial ≥ 95", ok: totals.avg_editorial >= 95 },
      { key: "nexus", label: "Média Nexus ≥ 95", ok: totals.avg_nexus >= 95 },
      { key: "no_review", label: "Zero verbetes em Revisão", ok: totals.needs_review === 0 },
      { key: "published", label: "Todos publicados", ok: totalPublished },
    ];
  }, [totals]);
  const frozen = freezeCriteria.every(c => c.ok);

  // Sprint 6.1 · Operação Ouro — verbetes que passam no gate (proxy client-side).
  const passesGateSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const need = ["deep_interpretation","faq","logos_meditation","bible_verses","catechism_references","fathers_refs"] as const;
      const ok = need.every(f => r.checks.find(c => c.field === f)?.ok);
      if (r.score >= 85 && r.editorial_score >= 90 && r.nexus_score >= 90 && ok) set.add(r.slug);
    }
    return set;
  }, [rows]);

  // Sprint 6.1 · buckets a partir da RPC de prioridade (fonte da verdade).
  const buckets = useMemo(() => ({
    quick_win: priorityRows.filter(r => r.priority === "quick_win").length,
    red:       priorityRows.filter(r => r.priority === "red").length,
    orange:    priorityRows.filter(r => r.priority === "orange").length,
    yellow:    priorityRows.filter(r => r.priority === "yellow").length,
  }), [priorityRows]);

  // Sprint 6.1 · Certificação v1.0 — todos os 47 verbetes passam no gate oficial.
  const v1Certified = !!snapshot && snapshot.gate_failing === 0 && snapshot.gate_passing > 0;

  // Cobertura média por área (para o header consolidado)
  const avgCoverage = useMemo(() => {
    if (coverage.length === 0) return null;
    return Math.round(coverage.reduce((s, c) => s + Number(c.avg_ice || 0), 0) / coverage.length);
  }, [coverage]);


  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Helmet>
        <title>Editorial Audit · Glossário · Cathedra Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Sprint 6 · Consolidação Editorial · Refinamentos
        </p>
        <h1 className="text-3xl font-serif">Editorial Audit · Glossário</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          ICE (Índice de Confiança Editorial), scores separados Editorial × Nexus, pendências
          inteligentes, histórico e dashboard de produção. Geração via IA rebaixa para{" "}
          <code>draft</code> — revisão em <Link to="/admin/glossario" className="underline">/admin/glossario</Link>.
        </p>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">Erro: {error}</p>}

      {!loading && !error && (
        <>
          {/* Sprint 6.1 · CATHEDRA EDITORIAL — dashboard consolidado (Operação Ouro) */}
          <Card className={`mb-6 ${v1Certified
            ? "border-emerald-600/60 bg-gradient-to-br from-emerald-500/10 via-amber-400/10 to-transparent"
            : "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"}`}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Cathedra Editorial · Operação Ouro
                  </p>
                  <h2 className="font-serif text-2xl leading-tight">
                    {v1Certified ? "Glossário Cathedra v1.0 — Certificado" : "Linha de produção editorial"}
                  </h2>
                </div>
                {v1Certified && (
                  <Badge className="bg-emerald-600 text-white shadow-sm">
                    <Award className="mr-1 h-3.5 w-3.5" /> v1.0
                  </Badge>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-9">
                <Kpi label="ICE" value={`${totals.avg}%`} tone={toneFor(totals.avg)} />
                <Kpi label="ICE ponderado" value={`${totals.avg_weighted}%`} tone={toneFor(totals.avg_weighted)} hint="peso doutrinário" />
                <Kpi label="Editorial" value={`${totals.avg_editorial}%`} tone={toneFor(totals.avg_editorial)} />
                <Kpi label="Nexus" value={`${totals.avg_nexus}%`} tone={toneFor(totals.avg_nexus)} />
                <Kpi label="Cobertura" value={avgCoverage !== null ? `${avgCoverage}%` : "—"} tone={avgCoverage !== null ? toneFor(avgCoverage) : "neutral"} />
                <Kpi
                  label="Gate"
                  value={snapshot ? `${snapshot.gate_passing}/${snapshot.gate_passing + snapshot.gate_failing}` : "—"}
                  tone={snapshot && snapshot.gate_failing === 0 ? "ok" : "warn"}
                />
                <Kpi label="Quick wins" value={buckets.quick_win} tone={buckets.quick_win === 0 ? "ok" : "warn"} />
                <Kpi label="Alto impacto" value={buckets.red} tone={buckets.red === 0 ? "ok" : "bad"} />
                <Kpi label="Revisão" value={totals.needs_review} tone={totals.needs_review === 0 ? "ok" : "bad"} />
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground">
                Última auditoria:{" "}
                <b>
                  {snapshot
                    ? new Date(snapshot.captured_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                    : "nunca"}
                </b>
                {" · "}Meta Operação Ouro: zerar buckets → 0 quick wins, 0 alto impacto, 0 revisão.
              </p>
            </CardContent>
          </Card>


          {/* Sprint 6.6 — Certificação Editorial Permanente */}
          {(() => {
            const ice_v = snapshot ? Number(snapshot.avg_ice) : totals.avg;
            const tier =
              ice_v >= 95 ? { label: "Ouro", cls: "border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-transparent text-emerald-800" }
              : ice_v >= 85 ? { label: "Prata", cls: "border-sky-500/50 bg-gradient-to-br from-sky-500/15 to-transparent text-sky-800" }
              : ice_v >= 70 ? { label: "Bronze", cls: "border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-transparent text-amber-800" }
              : { label: "Revisão", cls: "border-red-500/50 bg-gradient-to-br from-red-500/15 to-transparent text-red-800" };
            const deltaIce = snapshot && prevSnapshot ? Number(snapshot.avg_ice) - Number(prevSnapshot.avg_ice) : null;
            return (
              <Card className={`mb-6 ${tier.cls}`}>
                <CardContent className="flex flex-wrap items-center gap-6 p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-10 w-10" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                        Cathedra Editorial · Certificação
                      </p>
                      <p className="text-2xl font-serif leading-tight">Nível {tier.label}</p>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><p className="opacity-70">ICE médio</p>
                      <p className="text-lg font-bold tabular-nums">{ice_v.toFixed(1)}%
                        {deltaIce !== null && (
                          <span className={`ml-1.5 text-[10px] ${deltaIce >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {deltaIce >= 0 ? "▲" : "▼"} {Math.abs(deltaIce).toFixed(1)}
                          </span>
                        )}
                      </p></div>
                    <div><p className="opacity-70">Quality Gate</p>
                      <p className="text-lg font-bold tabular-nums">
                        {snapshot ? `${snapshot.gate_passing}/${snapshot.gate_passing + snapshot.gate_failing}` : "—"}
                      </p></div>
                    <div><p className="opacity-70">Regressões</p>
                      <p className="text-lg font-bold tabular-nums flex items-center gap-1">
                        {snapshot?.regressions.length ?? 0}
                        {(snapshot?.regressions.length ?? 0) > 0 && <TrendingDown className="h-4 w-4 text-red-600" />}
                      </p></div>
                    <div><p className="opacity-70">Última auditoria</p>
                      <p className="text-sm font-medium tabular-nums">
                        {snapshot ? new Date(snapshot.captured_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "nunca"}
                      </p></div>
                  </div>
                  <Button onClick={runAudit} disabled={auditing} size="sm" variant="default">
                    {auditing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                    Executar nova auditoria
                  </Button>
                </CardContent>
                {snapshot && snapshot.regressions.length > 0 && (
                  <CardContent className="pt-0">
                    <Collapsible>
                      <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded border border-red-500/30 bg-red-500/5 px-2 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-500/10">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {snapshot.regressions.length} verbete(s) perderam qualidade desde a última auditoria
                        <ChevronDown className="ml-auto h-3 w-3" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1.5 space-y-1 rounded border bg-muted/20 p-2 text-[11px]">
                        {snapshot.regressions.map(r => (
                          <div key={r.slug} className="flex items-center justify-between">
                            <Link to={`/admin/glossario?slug=${r.slug}`} className="font-semibold hover:underline">{r.slug}</Link>
                            <span className="tabular-nums text-muted-foreground">
                              ICE {r.ice_prev} → <b className="text-red-700">{r.ice_now}</b>
                              {r.editorial_delta !== 0 && <span className="ml-2">Ed {r.editorial_delta > 0 ? "+" : ""}{r.editorial_delta}</span>}
                              {r.nexus_delta !== 0 && <span className="ml-2">Nx {r.nexus_delta > 0 ? "+" : ""}{r.nexus_delta}</span>}
                            </span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                )}
              </Card>
            );
          })()}

          {/* Sprint 6.1.2 — Painel de Missão · Operação Ouro (4 fases) */}
          {(() => {
            // Fase A — Fundação: 0 quick wins + 0 verbetes com ICE < 70
            const belowIce70 = rows.filter(r => r.score < 70).length;
            const phaseA_done = buckets.quick_win === 0 && belowIce70 === 0 && rows.length > 0;

            // Fase B — Doutrina: cobertura por macroárea com tier
            const areaTier = (ice: number) =>
              ice >= 95 ? { label: "Ouro",    dot: "bg-emerald-500", cls: "text-emerald-700" }
              : ice >= 85 ? { label: "Prata",   dot: "bg-sky-500",     cls: "text-sky-700" }
              : ice >= 70 ? { label: "Bronze",  dot: "bg-amber-500",   cls: "text-amber-700" }
              :             { label: "Revisão", dot: "bg-red-500",     cls: "text-red-700" };
            const phaseB_done = coverage.length > 0 && coverage.every(c => Number(c.avg_ice) >= 95);

            // Fase C — Nexus Ouro: 100% dos verbetes com nexus_score ≥ 90
            const nexusGold = rows.filter(r => r.nexus_score >= 90).length;
            const nexusPct = rows.length ? Math.round((nexusGold / rows.length) * 100) : 0;
            const phaseC_done = rows.length > 0 && nexusGold === rows.length;

            // Fase D — Certificação: reuso dos 5 critérios oficiais
            const phaseD_done = frozen;

            const allDone = phaseA_done && phaseB_done && phaseC_done && phaseD_done;

            // Hash de certificação (determinístico p/ mesmo snapshot)
            const certHash = allDone
              ? btoa(`v1|${totals.total}|${totals.avg_weighted}|${nexusRelationCount}|${snapshot?.captured_at ?? ""}`)
                  .replace(/[+/=]/g, "").slice(0, 16).toUpperCase()
              : null;

            if (allDone) {
              const certDate = snapshot
                ? new Date(snapshot.captured_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                : new Date().toLocaleDateString("pt-BR");
              return (
                <Card className="mb-6 relative overflow-hidden border-2 border-amber-500/60 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 shadow-xl">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.15),transparent_60%)]" />
                  <CardContent className="relative p-10 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-500 bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-800">Cathedra Editorial</p>
                    <h2 className="mt-1 font-serif text-3xl text-amber-950">Glossário Teológico</h2>
                    <p className="mt-1 text-xs uppercase tracking-widest text-amber-700">Versão 1.0 · Certificada</p>

                    <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-6 border-y border-amber-500/30 py-4 text-amber-900">
                      <div><p className="text-[10px] uppercase opacity-70">ICE Final</p>
                        <p className="font-serif text-2xl tabular-nums">{totals.avg_weighted.toFixed(1)}</p></div>
                      <div><p className="text-[10px] uppercase opacity-70">Verbetes</p>
                        <p className="font-serif text-2xl tabular-nums">{totals.total}</p></div>
                      <div><p className="text-[10px] uppercase opacity-70">Relações Nexus</p>
                        <p className="font-serif text-2xl tabular-nums">{nexusRelationCount}</p></div>
                    </div>

                    <p className="mt-5 text-xs text-amber-800">Certificado em <b>{certDate}</b></p>
                    <p className="mt-1 font-mono text-[10px] tracking-widest text-amber-700/70">HASH · {certHash}</p>
                  </CardContent>
                </Card>
              );
            }

            const PhaseHeader = ({ letter, title, done, subtitle }: { letter: string; title: string; done: boolean; subtitle: string }) => (
              <div className="mb-2 flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                  done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                }`}>{done ? <Lock className="h-3.5 w-3.5" /> : letter}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-none">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                </div>
                {done && <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-[10px] text-emerald-700">🔒 Congelada</Badge>}
              </div>
            );

            return (
              <Card className="mb-6 border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Operação Ouro · Painel de Missão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* FASE A */}
                  <div>
                    <PhaseHeader letter="A" title="Fase A · Fundação" done={phaseA_done}
                      subtitle="Eliminar pendências críticas · 0 Quick Wins · 0 verbetes abaixo de ICE 70" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`rounded border p-3 ${buckets.quick_win === 0 ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick Wins restantes</p>
                        <p className={`text-xl font-bold tabular-nums ${buckets.quick_win === 0 ? "text-emerald-700" : "text-red-700"}`}>{buckets.quick_win}</p>
                      </div>
                      <div className={`rounded border p-3 ${belowIce70 === 0 ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Verbetes ICE &lt; 70</p>
                        <p className={`text-xl font-bold tabular-nums ${belowIce70 === 0 ? "text-emerald-700" : "text-red-700"}`}>{belowIce70}</p>
                      </div>
                    </div>
                  </div>

                  {/* FASE B */}
                  <div>
                    <PhaseHeader letter="B" title="Fase B · Doutrina" done={phaseB_done}
                      subtitle="Equilíbrio entre macroáreas · toda área em Ouro" />
                    {coverage.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Aguardando dados de cobertura…</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {coverage.map(c => {
                          const t = areaTier(Number(c.avg_ice));
                          return (
                            <div key={c.area} className="flex items-center justify-between rounded border bg-muted/20 px-2.5 py-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                                <span className="text-xs font-medium">{c.area}</span>
                              </div>
                              <span className={`text-[11px] font-semibold ${t.cls}`}>{t.label} · {Number(c.avg_ice).toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* FASE C */}
                  <div>
                    <PhaseHeader letter="C" title="Fase C · Nexus Ouro" done={phaseC_done}
                      subtitle="100% dos verbetes com 20 relações canônicas (nexus_score ≥ 90)" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground tabular-nums">{nexusGold} / {rows.length} verbetes</span>
                        <span className={`font-semibold tabular-nums ${phaseC_done ? "text-emerald-700" : "text-muted-foreground"}`}>{nexusPct}%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full transition-all ${phaseC_done ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${nexusPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* FASE D */}
                  <div>
                    <PhaseHeader letter="D" title="Fase D · Certificação" done={phaseD_done}
                      subtitle="Cinco critérios oficiais do Selo de Congelamento" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {freezeCriteria.map(c => (
                        <div key={c.key} className="flex items-center gap-2 text-[11px]">
                          {c.ok
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Sprint 6.6 — Cobertura Doutrinária */}
          {coverage.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Cobertura Doutrinária · lacunas de conhecimento por área
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {coverage.map(c => {
                  const pct = Number(c.avg_ice);
                  const barColor = pct >= 95 ? "bg-emerald-500"
                    : pct >= 85 ? "bg-sky-500"
                    : pct >= 70 ? "bg-amber-500"
                    : "bg-red-500";
                  return (
                    <div key={c.area} className="space-y-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-medium">{c.area}</span>
                        <span className="tabular-nums text-muted-foreground">
                          <b className="text-foreground">{pct.toFixed(1)}%</b>
                          <span className="mx-1.5">·</span>
                          {c.gate_passing}/{c.total} no gate
                          <span className="mx-1.5">·</span>
                          <span className="text-emerald-600">{c.gold}O</span>{" "}
                          <span className="text-sky-600">{c.silver}P</span>{" "}
                          <span className="text-amber-600">{c.bronze}B</span>{" "}
                          <span className="text-red-600">{c.review}R</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${barColor} transition-all`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Sprint 6.6 — Prioridade de Correção (Fase 1: quick wins) */}
          {priorityRows.length > 0 && (() => {
            const buckets = {
              quick_win: priorityRows.filter(r => r.priority === "quick_win"),
              red:       priorityRows.filter(r => r.priority === "red"),
              orange:    priorityRows.filter(r => r.priority === "orange"),
              yellow:    priorityRows.filter(r => r.priority === "yellow"),
              all:       priorityRows.filter(r => r.priority !== "ok"),
            };
            const shown = buckets[priorityFilter];
            const badge = (p: string) => {
              if (p === "quick_win") return "bg-emerald-500/15 text-emerald-700 border-emerald-500/40";
              if (p === "red")       return "bg-red-500/15 text-red-700 border-red-500/40";
              if (p === "orange")    return "bg-orange-500/15 text-orange-700 border-orange-500/40";
              return "bg-yellow-500/15 text-yellow-700 border-yellow-500/40";
            };
            const missingLabels = (r: typeof priorityRows[number]) => [
              r.missing_deep && "deep",
              r.missing_faq && "faq",
              r.missing_logos && "logos",
              r.missing_bible && "bíblia",
              r.missing_cic && "cic",
              r.missing_fathers && "patrística",
            ].filter(Boolean) as string[];
            return (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Prioridade de Correção · ataque em fases
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {([
                      ["quick_win", `🟢 Quick wins (${buckets.quick_win.length})`],
                      ["red",       `🔴 Alto impacto (${buckets.red.length})`],
                      ["orange",    `🟠 Médio (${buckets.orange.length})`],
                      ["yellow",    `🟡 Baixo (${buckets.yellow.length})`],
                      ["all",       `Todos abaixo do gate (${buckets.all.length})`],
                    ] as const).map(([k, label]) => (
                      <Button
                        key={k}
                        size="sm"
                        variant={priorityFilter === k ? "default" : "outline"}
                        onClick={() => setPriorityFilter(k as any)}
                        className="h-7 text-xs"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>

                  {/* Sprint 6.1.1 · Corrigir bucket em lote */}
                  {(() => {
                    const target = shown;
                    const tasks = buildTasksFromBucket(target);
                    const fieldCount = tasks.reduce<Record<string, number>>((a, t) => {
                      a[t.field] = (a[t.field] ?? 0) + 1; return a;
                    }, {});
                    const fieldLabels: Record<string, string> = {
                      deep_interpretation: "Interpretação", faq: "FAQ", logos_meditation: "Logos",
                      bible_verses: "Bíblia", catechism_references: "CIC", fathers_refs: "Patrística",
                    };
                    const running = bucketBatch?.running;
                    const pct = bucketBatch && bucketBatch.total > 0
                      ? Math.round((bucketBatch.done / bucketBatch.total) * 100) : 0;
                    const ok = bucketBatch?.results.filter(r => r.ok).length ?? 0;
                    const fail = (bucketBatch?.results.length ?? 0) - ok;
                    return (
                      <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs">
                            <div className="font-medium">Corrigir bucket em lote</div>
                            <div className="text-muted-foreground">
                              {target.length === 0
                                ? "Bucket zerado — nada a corrigir."
                                : `Serão corrigidos ${target.length} verbete(s) · ${tasks.length} tarefa(s) de IA${
                                    Object.keys(fieldCount).length
                                      ? ` (${Object.entries(fieldCount).map(([f, n]) => `${fieldLabels[f] ?? f}: ${n}`).join(" · ")})`
                                      : ""
                                  }.`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {running && (
                              <>
                                <Button size="sm" variant="outline" onClick={togglePause} className="h-7 text-xs">
                                  {bucketBatch?.paused ? "▶ Continuar" : "⏸ Pausar"}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={cancelBatch} className="h-7 text-xs">
                                  ✕ Cancelar
                                </Button>
                              </>
                            )}
                            {bucketBatch && !running && fail > 0 && (
                              <Button size="sm" variant="outline" onClick={retryFailed} className="h-7 text-xs">
                                <RefreshCw className="mr-1 h-3 w-3" /> Reprocessar {fail} falha(s)
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={running || tasks.length === 0}
                              onClick={() => runQueue(tasks, `${priorityFilter}`)}
                              className="h-7 text-xs"
                            >
                              {running
                                ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Executando…</>
                                : <><Sparkles className="mr-1 h-3 w-3" /> Corrigir bucket</>}
                            </Button>
                          </div>
                        </div>

                        {/* Sprint 6.1.1a — banner de retomada de checkpoint */}
                        {!bucketBatch && resumable && (
                          <div className="mt-3 flex items-center justify-between gap-2 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                            <span>
                              ⚡ Checkpoint disponível — <b>{resumable.label}</b>: {resumable.done}/{resumable.tasks.length} concluídas.
                            </span>
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="outline" onClick={resumeFromCheckpoint} className="h-6 px-2 text-[10px]">
                                Retomar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={discardCheckpoint} className="h-6 px-2 text-[10px]">
                                Descartar
                              </Button>
                            </div>
                          </div>
                        )}

                        {bucketBatch && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="tabular-nums">
                                {bucketBatch.done}/{bucketBatch.total}
                                {bucketBatch.paused && <span className="ml-2 text-amber-700">⏸ pausado</span>}
                                {bucketBatch.current && running && !bucketBatch.paused && (
                                  <span className="ml-2 text-muted-foreground">
                                    → {bucketBatch.current.term} · {fieldLabels[bucketBatch.current.field] ?? bucketBatch.current.field}
                                  </span>
                                )}
                                {bucketBatch.checkpointAt && (
                                  <span className="ml-2 text-emerald-700">✓ checkpoint</span>
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                {ok > 0 && <span className="text-emerald-700">✓ {ok}</span>}
                                {fail > 0 && <span className="ml-2 text-red-700">✗ {fail}</span>}
                                {!running && <span className="ml-2">· concluído</span>}
                              </span>
                            </div>
                            <Progress value={pct} className="h-1.5" />

                            {/* Sprint 6.1.1a — estatísticas finais */}
                            {!running && bucketBatch.finishedAt && bucketBatch.startedAt && (() => {
                              const dur = bucketBatch.finishedAt - bucketBatch.startedAt;
                              const mm = Math.floor(dur / 60000);
                              const ss = Math.floor((dur % 60000) / 1000);
                              const iB = bucketBatch.iceBefore, iA = bucketBatch.iceAfter;
                              const delta = iA && iB ? iA.weighted - iB.weighted : 0;
                              return (
                                <div className="grid grid-cols-2 gap-2 rounded border bg-background/50 p-2 text-[10px] md:grid-cols-4">
                                  <div><div className="text-muted-foreground">Tempo total</div><div className="font-semibold tabular-nums">{mm}m{ss.toString().padStart(2, "0")}s</div></div>
                                  <div><div className="text-muted-foreground">ICE antes</div><div className="font-semibold tabular-nums">{iB?.weighted ?? "—"}</div></div>
                                  <div><div className="text-muted-foreground">ICE depois</div><div className="font-semibold tabular-nums">{iA?.weighted ?? "—"}</div></div>
                                  <div>
                                    <div className="text-muted-foreground">Δ ICE ponderado</div>
                                    <div className={`font-semibold tabular-nums ${delta > 0 ? "text-emerald-700" : delta < 0 ? "text-red-700" : ""}`}>
                                      {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {!running && bucketBatch.results.length > 0 && (
                              <div className="max-h-32 overflow-y-auto rounded border bg-background/50 p-2 text-[10px] font-mono">
                                {bucketBatch.results.map((r, i) => (
                                  <div key={i} className={r.ok ? "text-emerald-700" : "text-red-700"}>
                                    {r.ok ? "✓" : "✗"} {r.slug} · {fieldLabels[r.field] ?? r.field}
                                    {r.ms && <span className="ml-1 opacity-50">{(r.ms / 1000).toFixed(1)}s</span>}
                                    {!r.ok && r.error && <span className="ml-1 opacity-70">— {r.error}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardHeader>
                <CardContent className="p-0">
                  {shown.length === 0 ? (
                    <p className="p-4 text-xs text-muted-foreground text-center">
                      Nenhum verbete nesta categoria. 🙌
                    </p>
                  ) : (
                    <div className="max-h-[360px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-muted/60 backdrop-blur text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2 text-left">Verbete</th>
                            <th className="px-2 py-2 text-left">Área</th>
                            <th className="px-2 py-2 text-right">ICE</th>
                            <th className="px-2 py-2 text-right">Impacto</th>
                            <th className="px-2 py-2 text-left">Falta</th>
                            <th className="px-2 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {shown.slice(0, 60).map(r => (
                            <tr key={r.slug} className="hover:bg-muted/30">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${badge(r.priority)}`}>
                                    {r.priority === "quick_win" ? "quick" : r.priority}
                                  </span>
                                  <span className="font-medium">{r.term}</span>
                                  {r.status === "draft" && <Badge variant="outline" className="h-4 px-1 text-[9px]">draft</Badge>}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-muted-foreground">{r.area}</td>
                              <td className="px-2 py-2 text-right tabular-nums font-semibold">{r.ice}</td>
                              <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                                {r.inbound_refs}× {r.impact_tier === "high" && "🔴"}{r.impact_tier === "medium" && "🟠"}
                              </td>
                              <td className="px-2 py-2 text-[10px] text-muted-foreground">
                                {missingLabels(r).length === 0 ? "—" : missingLabels(r).join(" · ")}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
                                  <Link to={`/admin/glossario?slug=${r.slug}`}>
                                    Editar <ExternalLink className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {shown.length > 60 && (
                        <p className="p-2 text-center text-[10px] text-muted-foreground">
                          … +{shown.length - 60} verbetes. Filtre por prioridade para reduzir.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Sprint 6.1.1a — Histórico de operações editoriais */}
          {jobs.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Últimas operações editoriais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/60 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 text-left">Quando</th>
                        <th className="px-2 py-2 text-left">Bucket</th>
                        <th className="px-2 py-2 text-right">Tarefas</th>
                        <th className="px-2 py-2 text-right">✓ / ✗</th>
                        <th className="px-2 py-2 text-right">Duração</th>
                        <th className="px-2 py-2 text-right">Δ ICE</th>
                        <th className="px-2 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {jobs.map(j => {
                        const dur = j.duration_ms ? `${Math.floor(j.duration_ms / 60000)}m${String(Math.floor((j.duration_ms % 60000) / 1000)).padStart(2, "0")}s` : "—";
                        const delta = j.ice_delta ?? 0;
                        return (
                          <tr key={j.id} className="hover:bg-muted/30">
                            <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{new Date(j.started_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="px-2 py-1.5">{j.bucket}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{j.tasks_total}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              <span className="text-emerald-700">{j.tasks_ok}</span>
                              <span className="mx-0.5 text-muted-foreground">/</span>
                              <span className="text-red-700">{j.tasks_fail}</span>
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{dur}</td>
                            <td className={`px-2 py-1.5 text-right tabular-nums font-semibold ${delta > 0 ? "text-emerald-700" : delta < 0 ? "text-red-700" : "text-muted-foreground"}`}>
                              {delta > 0 ? "+" : ""}{Number(delta).toFixed(1)}
                            </td>
                            <td className="px-2 py-1.5">
                              <Badge variant="outline" className="h-4 px-1 text-[9px]">{j.status}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sprint 6.6 — Quality Gate (critérios de bloqueio de publicação) */}
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Quality Gate · publicação bloqueada se falhar
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-1">
              <span>· ICE ≥ 85</span>
              <span>· Editorial ≥ 90</span>
              <span>· Nexus ≥ 90</span>
              <span>· Interpretação profunda preenchida</span>
              <span>· FAQ com ≥3 perguntas</span>
              <span>· Meditação Logos preenchida</span>
              <span>· ≥3 referências bíblicas</span>
              <span>· ≥2 referências do CIC</span>
              <span>· ≥1 referência patrística</span>
            </CardContent>
          </Card>

          {/* Sprint 6.5 — Selo de Congelamento */}
          <Card className={`mb-6 ${frozen
            ? "border-sky-500/50 bg-gradient-to-br from-sky-500/10 to-transparent"
            : "border-dashed"}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Snowflake className={`h-5 w-5 ${frozen ? "text-sky-600" : "text-muted-foreground"}`} />
                Sprint 6.5 · Congelamento Editorial do Glossário
                {frozen && <Badge className="ml-2 bg-sky-600">SELO ATIVO</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-5 text-xs">
              {freezeCriteria.map(c => (
                <div key={c.key} className={`flex items-center gap-1.5 rounded border px-2 py-1.5 ${
                  c.ok ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
                       : "border-muted bg-muted/20 text-muted-foreground"
                }`}>
                  {c.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  <span>{c.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Dashboard de Produção cross-módulo */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dashboard de Produção Cathedra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {modules.map(m => {
                const pct = m.total > 0 ? Math.round((m.published / m.total) * 100) : 0;
                return (
                  <div key={m.key} className="grid grid-cols-[110px_1fr_90px] items-center gap-3 text-sm">
                    <span className="font-medium">{m.label}</span>
                    <Progress value={pct} className="h-2" />
                    <span className="tabular-nums text-xs text-muted-foreground text-right">
                      {m.published}/{m.total} · {pct}%
                      {m.note && <span className="ml-1">·</span>}
                    </span>
                  </div>
                );
              })}
              <p className="pt-2 text-[11px] text-muted-foreground">
                Publicação como proxy de completude. Auditoria detalhada (score/ICE) hoje só para Glossário —
                Santos entra na Sprint 7 após o selo de Congelamento.
              </p>
            </CardContent>
          </Card>

          {/* Resumo com distribuição ICE */}
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            <Summary label="Total" value={totals.total} />
            <Summary label="Publicados" value={totals.published} tone="ok" />
            <Summary label="Drafts" value={totals.drafts} tone="warn" />
            <Summary label="🟢 Ouro" value={totals.gold} tone="ok" />
            <Summary label="🔵 Prata" value={totals.silver} />
            <Summary label="🟡 Bronze" value={totals.bronze} tone="warn" />
            <Summary label="🔴 Revisão" value={totals.needs_review}
              tone={totals.needs_review === 0 ? "ok" : "bad"} />
            <Summary label="Média Editorial × Nexus"
              value={`${totals.avg_editorial}% · ${totals.avg_nexus}%`}
              tone={totals.avg >= 90 ? "ok" : totals.avg >= 75 ? "warn" : "bad"} />
          </div>

          {/* Filtros e batch */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Buscar</label>
              <Input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="termo ou slug…" className="mt-1" />
            </div>
            <div className="min-w-[220px]">
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
            <div className="min-w-[240px]">
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
            {filtered.map(r => {
              const iceInfo = ice(r.score);
              const pendingGenerable = r.checks.filter(c => !c.ok && c.generable);
              return (
                <Card key={r.slug}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        <Link to={`/glossario/${r.slug}`} className="hover:underline">{r.term}</Link>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        <Badge variant={r.status === "published" ? "default" : "outline"} className="text-[10px]">
                          {r.status}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${iceInfo.cls}`}>
                          {iceInfo.emoji} ICE {iceInfo.label}
                        </Badge>
                        {r.editorial_completeness && (
                          <Badge variant="outline" className="text-[10px]">
                            {r.editorial_completeness}
                          </Badge>
                        )}
                        {r.version && r.version > 1 && (
                          <Badge variant="outline" className="text-[10px]">v{r.version}</Badge>
                        )}
                      </CardTitle>
                      {/* Scores separados */}
                      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 max-w-2xl">
                        <ScoreBar label="Editorial" value={r.editorial_score} />
                        <ScoreBar label="Nexus" value={r.nexus_score} />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Global <b className="tabular-nums">{r.score}%</b> · {r.pending} pendência(s) geráveis
                      </p>
                    </div>
                    <Link to={`/admin/glossario?slug=${r.slug}`}
                      className="text-xs text-muted-foreground hover:underline whitespace-nowrap">
                      editar →
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Grid de checks */}
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
                              <button type="button"
                                onClick={() => generateField(r.slug, c.field as Field)}
                                disabled={isBusy || batchRunning}
                                title={`Gerar ${c.label} via IA`}
                                className="rounded p-0.5 hover:bg-amber-500/20 disabled:opacity-40">
                                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <Sparkles className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pendências Inteligentes + Dependências + Histórico */}
                    <div className="grid gap-2 md:grid-cols-3">

                      {pendingGenerable.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded border border-dashed px-2 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-500/5">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Pendências Inteligentes ({pendingGenerable.length})
                            <ChevronDown className="ml-auto h-3 w-3" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-1.5 space-y-1.5 rounded border bg-muted/20 p-2 text-[11px]">
                            {pendingGenerable.map(c => {
                              const sugg = suggestionsFor(r.slug, c.field);
                              return (
                                <div key={c.field}>
                                  <p className="font-semibold text-amber-800">⚠ Falta: {c.label}</p>
                                  {sugg.length > 0 && (
                                    <ul className="ml-4 list-disc text-muted-foreground">
                                      {sugg.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                  )}
                                </div>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Sprint 6.1 · Dependências conceituais (via nexus_refs kind=glossary) */}
                      {(() => {
                        const deps = Array.from(new Set(
                          (r.nexus_refs || [])
                            .filter(n => n?.kind === "glossary" && typeof n?.slug === "string")
                            .map(n => n.slug as string)
                            .filter(s => s !== r.slug),
                        ));
                        return (
                          <Collapsible>
                            <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded border border-dashed px-2 py-1.5 text-[11px] font-medium text-sky-700 hover:bg-sky-500/5">
                              <History className="h-3.5 w-3.5" />
                              Dependências ({deps.length})
                              <ChevronDown className="ml-auto h-3 w-3" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-1.5 rounded border bg-muted/20 p-2 text-[11px]">
                              {deps.length === 0 ? (
                                <p className="text-muted-foreground">Sem dependências mapeadas em <code>nexus_refs</code>.</p>
                              ) : (
                                <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                  {deps.map(dep => {
                                    const ok = passesGateSet.has(dep);
                                    return (
                                      <li key={dep} className="flex items-center gap-1">
                                        <span className={ok ? "text-emerald-600" : "text-red-600"}>{ok ? "✔" : "✘"}</span>
                                        <Link to={`/admin/glossario?slug=${dep}`} className="hover:underline truncate">{dep}</Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })()}

                      <Collapsible>

                        <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded border border-dashed px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/40">
                          <History className="h-3.5 w-3.5" />
                          Histórico Editorial
                          <ChevronDown className="ml-auto h-3 w-3" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1.5 rounded border bg-muted/20 p-2 text-[11px] text-muted-foreground">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span>📝 Criado</span><span className="tabular-nums">{fmtDate(r.created_at)}</span>
                            <span>✏️ Última edição</span><span className="tabular-nums">{fmtDate(r.updated_at)}</span>
                            <span>👤 Revisão humana</span><span className="tabular-nums">
                              {r.reviewed_at ? `${fmtDate(r.reviewed_at)}${r.reviewed_by ? ` · ${r.reviewed_by.slice(0, 8)}` : ""}` : "—"}
                            </span>
                            <span>📖 Publicado</span><span className="tabular-nums">{fmtDate(r.published_at)}</span>
                            <span>🔢 Versão</span><span className="tabular-nums">v{r.version ?? 1}</span>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

async function loadModuleStats(): Promise<ModuleStat[]> {
  const results = await Promise.allSettled([
    supabase.from("glossary").select("status", { count: "exact", head: false }),
    supabase.from("saints").select("id", { count: "exact", head: true }),
    supabase.from("prayers").select("is_published", { count: "exact", head: false }),
    supabase.from("collections").select("status", { count: "exact", head: false }),
    supabase.from("journeys").select("status", { count: "exact", head: false }),
    supabase.from("bible_verses").select("id", { count: "exact", head: true }),
    supabase.from("liturgy_meditations").select("id", { count: "exact", head: true }),
    supabase.from("library_items_v1").select("status", { count: "exact", head: false }),
    supabase.from("library_items_v1").select("status", { count: "exact", head: false }),
  ]);

  const stat = (label: string, key: string, res: any, isPub: (r: any) => boolean, note?: string): ModuleStat => {
    if (res.status !== "fulfilled" || res.value.error) {
      return { key, label, published: 0, total: 0, note: "sem acesso" };
    }
    const rows = res.value.data ?? [];
    const total = res.value.count ?? rows.length;
    const published = rows.filter(isPub).length;
    return { key, label, published, total, note };
  };

  return [
    stat("Glossário", "glossary", results[0], (r) => r.status === "published"),
    // Santos: tratamos "todos publicados" (import massivo)
    (() => {
      const res = results[1];
      if (res.status !== "fulfilled" || res.value.error) {
        return { key: "saints", label: "Santos", published: 0, total: 0, note: "sem acesso" };
      }
      const t = res.value.count ?? 0;
      return { key: "saints", label: "Santos", published: t, total: t, note: "sem status" };
    })(),
    stat("Orações", "prayers", results[2], (r) => r.is_published === true),
    stat("Coleções", "collections", results[3], (r) => r.status === "published"),
    stat("Jornadas", "journeys", results[4], (r) => r.status === "published"),
    // Bíblia: tratamos "todos publicados"
    (() => {
      const res = results[5];
      if (res.status !== "fulfilled" || res.value.error) {
        return { key: "bible", label: "Bíblia", published: 0, total: 0, note: "sem acesso" };
      }
      const t = res.value.count ?? 0;
      return { key: "bible", label: "Bíblia", published: t, total: t };
    })(),
    (() => {
      const res = results[6];
      if (res.status !== "fulfilled" || res.value.error) {
        return { key: "liturgy", label: "Liturgia", published: 0, total: 0, note: "sem acesso" };
      }
      const t = res.value.count ?? 0;
      return { key: "liturgy", label: "Liturgia", published: t, total: t };
    })(),
    stat("Patrística", "patristic", results[7], (r) => r.status === "published"),
    stat("Magistério", "magisterium", results[8], (r) => r.status === "published"),
  ];
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 95 ? "text-emerald-600" :
    value >= 85 ? "text-sky-700" :
    value >= 70 ? "text-amber-700" : "text-red-700";
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <Progress value={value} className="h-1.5 flex-1" />
      <span className={`w-10 text-right text-xs font-bold tabular-nums ${tone}`}>{value}%</span>
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
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

type KpiTone = "ok" | "warn" | "bad" | "neutral";
function toneFor(v: number): KpiTone {
  if (v >= 95) return "ok";
  if (v >= 85) return "neutral";
  if (v >= 70) return "warn";
  return "bad";
}
function Kpi({ label, value, tone = "neutral", hint }: { label: string; value: string | number; tone?: KpiTone; hint?: string }) {
  const cls =
    tone === "ok" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
    : tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
    : tone === "bad" ? "border-red-500/40 bg-red-500/10 text-red-700"
    : "border-border bg-background";
  return (
    <div className={`rounded-md border px-2.5 py-2 ${cls}`}>
      <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums leading-tight">{value}</p>
      {hint && <p className="text-[9px] opacity-60">{hint}</p>}
    </div>
  );
}

