/**
 * /admin/bible-import — Cadastra fontes de tradução e dispara importação.
 *
 * Recursos:
 *   - Preview client-side (contagem por livro/capítulo/versículo) antes do upload
 *   - Modo "dump bruto" → roda `bible-convert-dump` no servidor antes do import
 *   - Download dos versículos rejeitados (preview ou pós-import)
 *   - Polling do job em execução + verificação pós-import de cobertura
 *
 * Formato canônico esperado: {"abbr":"Gn","chapter":1,"verse":1,"text":"..."}
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2, Upload, Link as LinkIcon, FileText, ShieldCheck, ShieldAlert,
  Download, AlertTriangle, Wand2, CheckCircle2, Circle, XCircle, ClipboardCopy,
} from "lucide-react";
import {
  previewDump, rejectedToNDJSON, detectFormat, type DumpPreview,
} from "@/lib/bible/ndjsonConverter";

type SourceStatus = "draft" | "importing" | "ready" | "failed" | "archived";
type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

interface TranslationSource {
  id: string; code: string; name: string; language: string; translation: string;
  license: string; attribution: string; source_url: string | null; file_url: string | null;
  notes: string | null; is_primary: boolean; status: SourceStatus;
  books_count: number; chapters_count: number; verses_count: number;
  imported_at: string | null; created_at: string;
}

interface ImportJob {
  id: string; source_id: string; status: JobStatus; progress: number; total: number;
  current_book: string | null; message: string | null; error: string | null;
  verification: {
    passed?: boolean; blocking?: Record<string, number>; total_findings?: number;
    run_id?: string | null; skipped?: boolean;
    rejected_path?: string | null; rejected_count?: number;
  } | null;
  started_at: string | null; finished_at: string | null; created_at: string;
}

const INITIAL_FORM = {
  code: "", name: "", language: "pt-BR", translation: "", license: "",
  attribution: "", source_url: "", notes: "", is_primary: false, file_url: "",
};
type FormState = typeof INITIAL_FORM;

const RAW_EXTS = /\.(json|jsonl|ndjson|csv|tsv)$/i;
const PREVIEW_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB lidos no browser para preview
const LOGS_STORAGE_KEY = "bible_import_admin_last_run_v1";

type StepKey = "upload" | "conversion" | "persistence" | "verification";
type StepStatus = "pending" | "running" | "done" | "skipped" | "error";
interface StepState { key: StepKey; label: string; status: StepStatus; detail?: string; startedAt?: number; finishedAt?: number }
interface LogEntry { ts: number; level: "info" | "success" | "warn" | "error"; step?: StepKey; message: string }

const INITIAL_STEPS: StepState[] = [
  { key: "upload", label: "Upload do arquivo", status: "pending" },
  { key: "conversion", label: "Conversão para NDJSON canônico", status: "pending" },
  { key: "persistence", label: "Persistência (importação)", status: "pending" },
  { key: "verification", label: "Verificação do gate de cobertura", status: "pending" },
];

function sourceStatusBadge(s: SourceStatus) {
  const map: Record<SourceStatus, string> = {
    draft: "bg-muted text-foreground", importing: "bg-blue-600",
    ready: "bg-emerald-600", failed: "bg-destructive", archived: "bg-zinc-500",
  };
  return <Badge className={map[s]}>{s}</Badge>;
}
function jobStatusBadge(s: JobStatus) {
  const map: Record<JobStatus, string> = {
    queued: "bg-muted text-foreground", running: "bg-blue-600",
    succeeded: "bg-emerald-600", failed: "bg-destructive", cancelled: "bg-zinc-500",
  };
  return <Badge className={map[s]}>{s}</Badge>;
}

function downloadBlob(filename: string, content: string, mime = "application/x-ndjson") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function BibleImportAdmin() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [rawMode, setRawMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sources, setSources] = useState<TranslationSource[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<DumpPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewTruncated, setPreviewTruncated] = useState(false);
  const [steps, setSteps] = useState<StepState[]>(INITIAL_STEPS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runActive, setRunActive] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restaura último run do localStorage para consulta
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { steps: StepState[]; logs: LogEntry[]; jobId: string | null };
      if (parsed?.steps && parsed?.logs) {
        setSteps(parsed.steps); setLogs(parsed.logs); setActiveJobId(parsed.jobId ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  const persistRun = useCallback((s: StepState[], l: LogEntry[], jobId: string | null) => {
    try { localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify({ steps: s, logs: l, jobId })); } catch { /* ignore */ }
  }, []);

  const pushLog = useCallback((entry: Omit<LogEntry, "ts">) => {
    setLogs((prev) => [...prev, { ...entry, ts: Date.now() }].slice(-300));
  }, []);
  const setStep = useCallback((key: StepKey, patch: Partial<StepState>) => {
    setSteps((prev) => prev.map((s) => s.key === key ? { ...s, ...patch } : s));
  }, []);
  // Silenciar warnings de helpers reservados para uso futuro
  void pushLog; void setStep;

  const resetRun = useCallback(() => {
    setSteps(INITIAL_STEPS); setLogs([]); setActiveJobId(null);
    try { localStorage.removeItem(LOGS_STORAGE_KEY); } catch { /* ignore */ }
  }, []);




  const loadAll = useCallback(async () => {
    const [{ data: src, error: srcErr }, { data: jb, error: jbErr }] = await Promise.all([
      supabase.from("bible_translation_sources").select("*").order("created_at", { ascending: false }),
      supabase.from("bible_import_jobs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (srcErr) toast.error(`Falha ao carregar fontes: ${srcErr.message}`);
    if (jbErr) toast.error(`Falha ao carregar jobs: ${jbErr.message}`);
    setSources((src ?? []) as TranslationSource[]);
    setJobs((jb ?? []) as ImportJob[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const hasRunning = useMemo(
    () => jobs.some((j) => j.status === "running" || j.status === "queued"),
    [jobs],
  );
  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(loadAll, 2000);
    return () => clearInterval(id);
  }, [hasRunning, loadAll]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function resetForm() {
    setForm(INITIAL_FORM); setFile(null); setRawMode(false);
    setPreview(null); setPreviewTruncated(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // --------- Preview client-side automático ao selecionar arquivo ---------
  const runPreview = useCallback(async (f: File) => {
    if (!RAW_EXTS.test(f.name)) {
      setPreview(null);
      return;
    }
    setPreviewing(true); setPreviewTruncated(false);
    try {
      let text: string;
      if (f.size > PREVIEW_LIMIT_BYTES) {
        // Lê apenas os primeiros bytes para estimativa
        const slice = f.slice(0, PREVIEW_LIMIT_BYTES);
        text = await slice.text();
        // Trunca para evitar parse de linha quebrada no final
        const lastNl = text.lastIndexOf("\n");
        if (lastNl > 0) text = text.slice(0, lastNl);
        setPreviewTruncated(true);
      } else {
        text = await f.text();
      }
      const p = previewDump(text, f.name);
      setPreview(p);
    } catch (e) {
      toast.error(`Falha no preview: ${(e as Error).message}`);
      setPreview(null);
    } finally { setPreviewing(false); }
  }, []);

  useEffect(() => {
    if (!file) { setPreview(null); setPreviewTruncated(false); return; }
    runPreview(file);
  }, [file, runPreview]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !/\.ndjson$|\.jsonl$/i.test(f.name) && RAW_EXTS.test(f.name)) {
      setRawMode(true); // auto-ativa modo bruto quando não é NDJSON
    }
  }

  function downloadRejectedFromPreview() {
    if (!preview || preview.rejected.length === 0) return;
    downloadBlob(`preview-rejected-${file?.name ?? "dump"}.ndjson`, rejectedToNDJSON(preview.rejected));
  }

  async function downloadRejectedFromJob(job: ImportJob) {
    const path = job.verification?.rejected_path;
    if (!path) { toast.error("Job sem arquivo de rejeitados."); return; }
    const { data, error } = await supabase.storage.from("bible-dumps")
      .createSignedUrl(path, 300);
    if (error || !data?.signedUrl) { toast.error(`URL: ${error?.message ?? "falhou"}`); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  function validate(): string | null {
    const required: Array<keyof FormState> = ["code", "name", "translation", "license", "attribution"];
    for (const k of required) if (!String(form[k]).trim()) return `Campo obrigatório: ${k}`;
    if (!file && !form.file_url.trim()) return "Envie um arquivo ou informe uma URL HTTPS";
    if (form.file_url && !/^https:\/\//i.test(form.file_url)) return "file_url deve ser HTTPS";
    if (file && !RAW_EXTS.test(file.name)) {
      return "Arquivo deve ser .ndjson, .jsonl, .json, .csv ou .tsv";
    }
    if (preview && preview.validVerses === 0 && file) {
      return "Preview não encontrou versos válidos — verifique formato.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSubmitting(true);

    // Inicializa run (steps + logs)
    const fresh: StepState[] = INITIAL_STEPS.map((s) => ({ ...s }));
    setSteps(fresh); setLogs([]); setActiveJobId(null); setRunActive(true);
    let localSteps = fresh; let localLogs: LogEntry[] = [];
    const log = (entry: Omit<LogEntry, "ts">) => {
      const next = { ...entry, ts: Date.now() };
      localLogs = [...localLogs, next].slice(-300);
      setLogs(localLogs);
    };
    const mark = (key: StepKey, patch: Partial<StepState>) => {
      localSteps = localSteps.map((s) => s.key === key ? { ...s, ...patch } : s);
      setSteps(localSteps);
    };
    const start = (key: StepKey, detail?: string) => {
      mark(key, { status: "running", detail, startedAt: Date.now() });
      log({ level: "info", step: key, message: detail ?? `Iniciando: ${key}` });
    };
    const done = (key: StepKey, detail?: string, level: "success" | "warn" = "success") => {
      mark(key, { status: level === "warn" ? "done" : "done", detail, finishedAt: Date.now() });
      log({ level, step: key, message: detail ?? `Concluído: ${key}` });
    };
    const skip = (key: StepKey, reason: string) => {
      mark(key, { status: "skipped", detail: reason, finishedAt: Date.now() });
      log({ level: "info", step: key, message: `Pulado: ${reason}` });
    };
    const fail = (key: StepKey, message: string) => {
      mark(key, { status: "error", detail: message, finishedAt: Date.now() });
      log({ level: "error", step: key, message });
    };

    let currentStep: StepKey = "upload";
    try {
      log({ level: "info", message: `Criando fonte ${form.code.trim()}…` });
      const { data: src, error: srcErr } = await supabase
        .from("bible_translation_sources")
        .insert({
          code: form.code.trim(), name: form.name.trim(),
          language: form.language.trim() || "pt-BR",
          translation: form.translation.trim(),
          license: form.license.trim(), attribution: form.attribution.trim(),
          source_url: form.source_url.trim() || null,
          file_url: file ? null : form.file_url.trim() || null,
          notes: form.notes.trim() || null, is_primary: form.is_primary,
          status: "draft",
        }).select("id").single();
      if (srcErr || !src) throw new Error(srcErr?.message ?? "falha ao criar fonte");
      const sourceId = src.id as string;
      log({ level: "success", message: `Fonte criada (id=${sourceId})` });

      // 1) Upload
      currentStep = "upload";
      let filePath: string | undefined;
      if (file) {
        start("upload", `Enviando ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
        const prefix = rawMode ? "raw" : "ndjson";
        const path = `${sourceId}/${prefix}-${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("bible-dumps")
          .upload(path, file, { contentType: "application/octet-stream", upsert: false });
        if (upErr) throw new Error(`upload: ${upErr.message}`);
        filePath = path;
        await supabase.from("bible_translation_sources")
          .update({ file_url: `storage://bible-dumps/${path}` }).eq("id", sourceId);
        done("upload", `Upload OK → ${path}`);
      } else {
        skip("upload", `URL HTTPS direta (${form.file_url.trim()})`);
      }

      // 2) Conversão (apenas se dump bruto)
      currentStep = "conversion";
      let importPath = filePath;
      if (file && rawMode && filePath) {
        const fmt = detectFormat(file.name);
        start("conversion", `Convertendo dump bruto (${fmt}) no servidor…`);
        const { data: cv, error: cvErr } = await supabase.functions.invoke("bible-convert-dump", {
          body: { source_id: sourceId, file_path: filePath, format: fmt },
        });
        if (cvErr) throw new Error(`conversão: ${cvErr.message}`);
        const cvData = cv as { converted_path?: string; rejected_path?: string | null; stats?: Record<string, number> };
        if (!cvData?.converted_path) throw new Error("conversão não retornou arquivo");
        importPath = cvData.converted_path;
        const v = cvData.stats?.valid_verses ?? 0;
        const r = cvData.stats?.rejected_count ?? 0;
        done("conversion", `${v.toLocaleString("pt-BR")} versos válidos · ${r} rejeitados`,
          r > 0 ? "warn" : "success");
      } else {
        skip("conversion", file ? "NDJSON canônico — conversão desnecessária" : "Sem arquivo local");
      }

      // 3) Persistência (import)
      currentStep = "persistence";
      start("persistence", "Disparando bible-import-ndjson…");
      const { data: invokeData, error: invokeErr } = await supabase.functions.invoke("bible-import-ndjson", {
        body: importPath
          ? { source_id: sourceId, file_path: importPath }
          : { source_id: sourceId, file_url: form.file_url.trim() },
      });
      if (invokeErr) throw new Error(`import: ${invokeErr.message}`);
      const result = invokeData as {
        job_id?: string; books?: number; chapters?: number; verses?: number;
        rejected_count?: number;
        verification?: { passed?: boolean; total_findings?: number; skipped?: boolean; blocking?: Record<string, number> };
      };
      const jobId = result?.job_id ?? null;
      setActiveJobId(jobId);
      done("persistence",
        `Job ${jobId ?? "?"} · ${result?.books ?? 0} livros / ${result?.chapters ?? 0} caps / ${(result?.verses ?? 0).toLocaleString("pt-BR")} versos`
          + (result?.rejected_count ? ` (${result.rejected_count} rejeitados)` : ""));

      // 4) Verificação de cobertura
      currentStep = "verification";
      if (result?.verification?.skipped) {
        skip("verification", "Verificação desabilitada (skip_verify=true)");
      } else if (result?.verification) {
        const v = result.verification;
        if (v.passed) {
          done("verification", `Gate liberado · 0 achados bloqueantes`);
        } else {
          const total = v.total_findings ?? 0;
          const blockSummary = v.blocking
            ? Object.entries(v.blocking).map(([k, n]) => `${k}=${n}`).join(", ")
            : "sem detalhes";
          mark("verification", {
            status: "error",
            detail: `Gate bloqueado — ${total} achado(s): ${blockSummary}`,
            finishedAt: Date.now(),
          });
          log({ level: "warn", step: "verification",
            message: `Cobertura insuficiente: ${total} achados (${blockSummary})` });
        }
      } else {
        skip("verification", "Função não retornou bloco de verification");
      }

      toast.success(`Importação concluída (job ${jobId ?? "?"})`);
      persistRun(localSteps, localLogs, jobId);
      resetForm();
      await loadAll();
    } catch (e) {
      const msg = (e as Error).message;
      fail(currentStep, msg);
      toast.error(msg);
      persistRun(localSteps, localLogs, activeJobId);
    } finally {
      setSubmitting(false);
    }
  }

  async function retryImport(s: TranslationSource) {
    if (!s.file_url) { toast.error("Esta fonte não tem arquivo registrado"); return; }
    const isStorage = s.file_url.startsWith("storage://bible-dumps/");
    const body = isStorage
      ? { source_id: s.id, file_path: s.file_url.replace("storage://bible-dumps/", "") }
      : { source_id: s.id, file_url: s.file_url };
    const { error } = await supabase.functions.invoke("bible-import-ndjson", { body });
    if (error) { toast.error(error.message); return; }
    toast.success("Reimportação iniciada");
    await loadAll();
  }

  const latestJobBySource = useMemo(() => {
    const map = new Map<string, ImportJob>();
    for (const j of jobs) if (!map.has(j.source_id)) map.set(j.source_id, j);
    return map;
  }, [jobs]);

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-6xl">
      <header>
        <h1 className="text-3xl font-semibold">Importação de Bíblia</h1>
        <p className="text-muted-foreground mt-1">
          Importa traduções a partir de dumps NDJSON canônicos
          (<code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">{"{abbr,chapter,verse,text}"}</code>)
          ou dumps brutos (JSON/CSV/TSV) que são convertidos no servidor.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nova fonte de tradução</CardTitle>
          <CardDescription>
            Metadados de licença e atribuição são obrigatórios — não importamos texto sem licença declarada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" value={form.code} onChange={(e) => update("code", e.target.value)}
                placeholder="ex.: acf-2011" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Nome interno *</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)}
                placeholder="ex.: ACF 2011" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="translation">Tradução *</Label>
              <Input id="translation" value={form.translation} onChange={(e) => update("translation", e.target.value)}
                placeholder="ex.: Almeida Corrigida Fiel" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="language">Idioma</Label>
              <Input id="language" value={form.language} onChange={(e) => update("language", e.target.value)}
                placeholder="pt-BR" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="license">Licença *</Label>
              <Input id="license" value={form.license} onChange={(e) => update("license", e.target.value)}
                placeholder="ex.: Domínio público / CC BY 4.0 / Licença Editorial XYZ" required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="attribution">Atribuição *</Label>
              <Input id="attribution" value={form.attribution} onChange={(e) => update("attribution", e.target.value)}
                placeholder='ex.: "Bíblia Sagrada — Ave-Maria, 1959 (uso autorizado)"' required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="source_url">URL-fonte (referência da licença)</Label>
              <Input id="source_url" type="url" value={form.source_url}
                onChange={(e) => update("source_url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)}
                rows={2} placeholder="Observações internas (opcional)" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="file">Arquivo (NDJSON, JSON, CSV ou TSV)</Label>
              <Input id="file" type="file" accept=".ndjson,.jsonl,.json,.csv,.tsv" ref={fileInputRef}
                onChange={onFileChange} />
              {file && (
                <p className="text-xs text-muted-foreground">
                  <FileText className="inline h-3 w-3 mr-1" />
                  {file.name} ({(file.size / 1024).toFixed(0)} KB · {detectFormat(file.name)})
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="file_url">… ou URL HTTPS (NDJSON)</Label>
              <Input id="file_url" type="url" value={form.file_url}
                onChange={(e) => update("file_url", e.target.value)}
                placeholder="https://exemplo.com/dump.ndjson" disabled={!!file} />
            </div>

            <div className="flex items-center gap-2 md:col-span-2 p-3 rounded-md border bg-muted/30">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
              <Switch id="raw_mode" checked={rawMode} onCheckedChange={setRawMode} disabled={!file} />
              <Label htmlFor="raw_mode" className="cursor-pointer flex-1">
                Meu arquivo é bruto (JSON/CSV/TSV) — converter no servidor para NDJSON canônico
              </Label>
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Switch id="is_primary" checked={form.is_primary}
                onCheckedChange={(v) => update("is_primary", v)} />
              <Label htmlFor="is_primary" className="cursor-pointer">
                Marcar como fonte primária deste idioma
              </Label>
            </div>

            {/* Preview client-side */}
            {file && (
              <div className="md:col-span-2 rounded-md border bg-card">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Preview do dump</span>
                    {previewing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  {preview && preview.rejected.length > 0 && (
                    <Button type="button" size="sm" variant="outline" onClick={downloadRejectedFromPreview}>
                      <Download className="h-3 w-3 mr-1" />
                      Baixar {preview.rejected.length} rejeitados
                    </Button>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {previewTruncated && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Arquivo grande — preview limitado aos primeiros 5 MB. As contagens são parciais.
                    </p>
                  )}
                  {preview ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <Stat label="Versos válidos" value={preview.validVerses.toLocaleString("pt-BR")} />
                        <Stat label="Rejeitados" value={preview.rejectedCount.toLocaleString("pt-BR")}
                          tone={preview.rejectedCount > 0 ? "warn" : "ok"} />
                        <Stat label="Livros únicos" value={`${preview.uniqueBooks}/73`}
                          tone={preview.uniqueBooks === 73 ? "ok" : preview.uniqueBooks === 0 ? "bad" : "warn"} />
                        <Stat label="Capítulos" value={preview.uniqueChapters.toLocaleString("pt-BR")} />
                      </div>
                      {preview.warnings.length > 0 && (
                        <ul className="text-xs text-amber-700 space-y-1">
                          {preview.warnings.map((w, i) => (
                            <li key={i} className="flex gap-1 items-start">
                              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {preview.byBook.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Ver contagem por livro ({preview.byBook.length})
                          </summary>
                          <div className="mt-2 max-h-48 overflow-auto border rounded">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/50 sticky top-0">
                                <tr><th className="text-left px-2 py-1">Abbr</th>
                                  <th className="text-right px-2 py-1">Capítulos</th>
                                  <th className="text-right px-2 py-1">Versos</th></tr>
                              </thead>
                              <tbody>
                                {preview.byBook.map((b) => (
                                  <tr key={b.abbr} className="border-t">
                                    <td className="px-2 py-1 font-mono">{b.abbr}</td>
                                    <td className="px-2 py-1 text-right">{b.chapters}</td>
                                    <td className="px-2 py-1 text-right">{b.verses}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}
                      {preview.missingCanonBooks.length > 0 && !previewTruncated && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-amber-700 hover:text-amber-900">
                            {preview.missingCanonBooks.length} livro(s) do canon ausentes
                          </summary>
                          <p className="mt-1 font-mono text-muted-foreground">
                            {preview.missingCanonBooks.join(", ")}
                          </p>
                        </details>
                      )}
                    </>
                  ) : !previewing ? (
                    <p className="text-xs text-muted-foreground">Aguardando preview…</p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                Limpar
              </Button>
              <Button type="submit" disabled={submitting || previewing}>
                {submitting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando…</>
                  : <><Upload className="h-4 w-4 mr-2" /> Salvar e importar</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {(submitting || steps.some((s) => s.status !== "pending") || logs.length > 0) && (
        <ImportProgressPanel
          steps={steps}
          logs={logs}
          running={submitting}
          activeJobId={activeJobId}
          onClear={() => { resetRun(); setRunActive(false); }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fontes cadastradas</CardTitle>
          <CardDescription>
            {sources.length} fonte(s). O progresso atualiza automaticamente enquanto a importação roda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma fonte cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tradução</TableHead>
                  <TableHead>Licença</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Livros / Cap. / Versos</TableHead>
                  <TableHead>Último job</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((s) => {
                  const job = latestJobBySource.get(s.id);
                  const pct = job && job.total > 0 ? Math.min(100, Math.round((job.progress / job.total) * 100)) : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">
                        {s.code}
                        {s.is_primary && <Badge variant="outline" className="ml-2">primária</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{s.translation}</div>
                        <div className="text-xs text-muted-foreground">{s.language} · {s.attribution}</div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={s.license}>{s.license}</TableCell>
                      <TableCell>{sourceStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-xs">
                        {s.books_count} / {s.chapters_count} / {s.verses_count.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs min-w-[200px]">
                        {job ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {jobStatusBadge(job.status)}
                              {job.status === "running" && (
                                <span className="text-muted-foreground">
                                  {job.current_book ? `· ${job.current_book}` : ""}
                                </span>
                              )}
                            </div>
                            {(job.status === "running" || job.status === "queued") && (
                              <Progress value={pct} className="h-1.5" />
                            )}
                            {job.message && <div className="text-muted-foreground truncate" title={job.message}>{job.message}</div>}
                            {job.error && <div className="text-destructive truncate" title={job.error}>{job.error}</div>}
                            {job.verification && !job.verification.skipped && (
                              <div className="flex items-center gap-1">
                                {job.verification.passed
                                  ? <><ShieldCheck className="h-3 w-3 text-emerald-600" /> Cobertura OK</>
                                  : <><ShieldAlert className="h-3 w-3 text-destructive" />
                                      {job.verification.total_findings ?? 0} achados</>}
                              </div>
                            )}
                            {job.verification?.rejected_path && (job.verification?.rejected_count ?? 0) > 0 && (
                              <Button type="button" size="sm" variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => downloadRejectedFromJob(job)}>
                                <Download className="h-3 w-3 mr-1" />
                                Baixar {job.verification.rejected_count} rejeitados
                              </Button>
                            )}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {s.source_url && (
                          <a href={s.source_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
                            <LinkIcon className="h-3 w-3" />
                          </a>
                        )}
                        <Button size="sm" variant="outline" onClick={() => retryImport(s)}
                          disabled={s.status === "importing" || !s.file_url}>
                          Reimportar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "ok" | "warn" | "bad" }) {
  const cls =
    tone === "ok" ? "text-emerald-600" :
    tone === "warn" ? "text-amber-600" :
    tone === "bad" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("pt-BR", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}
function fmtDuration(start?: number, end?: number): string {
  if (!start) return "—";
  const ms = (end ?? Date.now()) - start;
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "skipped") return <Circle className="h-4 w-4 text-muted-foreground" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground/50" />;
}

function ImportProgressPanel({
  steps, logs, running, activeJobId, onClear,
}: {
  steps: StepState[]; logs: LogEntry[]; running: boolean;
  activeJobId: string | null; onClear: () => void;
}) {
  const totalSteps = steps.length;
  const finished = steps.filter((s) => s.status === "done" || s.status === "skipped").length;
  const hasError = steps.some((s) => s.status === "error");
  const pct = Math.round((finished / totalSteps) * 100);

  const copyLogs = () => {
    const txt = logs.map((l) => `[${fmtTime(l.ts)}] ${l.level.toUpperCase()}${l.step ? ` (${l.step})` : ""}: ${l.message}`).join("\n");
    navigator.clipboard.writeText(txt).then(
      () => toast.success("Logs copiados"),
      () => toast.error("Falha ao copiar"),
    );
  };
  const downloadLogs = () => {
    const txt = logs.map((l) => JSON.stringify(l)).join("\n");
    downloadBlob(`bible-import-logs-${Date.now()}.ndjson`, txt, "application/x-ndjson");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            Progresso da importação
            {running
              ? <Badge className="bg-blue-600">em execução</Badge>
              : hasError
                ? <Badge variant="destructive">com erro</Badge>
                : finished === totalSteps
                  ? <Badge className="bg-emerald-600">concluído</Badge>
                  : <Badge variant="outline">parcial</Badge>}
          </CardTitle>
          <CardDescription>
            {finished}/{totalSteps} etapas · {pct}% concluído
            {activeJobId && <> · job <code className="text-xs">{activeJobId}</code></>}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={copyLogs} disabled={logs.length === 0}>
            <ClipboardCopy className="h-3 w-3 mr-1" /> Copiar logs
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={downloadLogs} disabled={logs.length === 0}>
            <Download className="h-3 w-3 mr-1" /> Baixar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClear} disabled={running}>
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={pct} className="h-2" />

        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-start gap-3 rounded-md border p-3 bg-card">
              <div className="pt-0.5"><StepIcon status={s.status} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">
                    {i + 1}. {s.label}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {s.status === "running" || s.status === "done" || s.status === "error"
                      ? fmtDuration(s.startedAt, s.finishedAt)
                      : s.status === "skipped" ? "pulado" : "aguardando"}
                  </span>
                </div>
                {s.detail && (
                  <p className={`text-xs mt-1 break-words ${
                    s.status === "error" ? "text-destructive" :
                    s.status === "skipped" ? "text-muted-foreground" : "text-muted-foreground"
                  }`}>
                    {s.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <details open={hasError || !running}>
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            Logs ({logs.length})
          </summary>
          <div className="mt-2 max-h-72 overflow-auto rounded-md border bg-muted/30 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="p-3 text-muted-foreground">Sem registros ainda.</p>
            ) : (
              <ul>
                {logs.map((l, i) => (
                  <li key={i} className={`px-3 py-1 border-b last:border-0 flex gap-2 ${
                    l.level === "error" ? "text-destructive" :
                    l.level === "warn" ? "text-amber-700" :
                    l.level === "success" ? "text-emerald-700" : "text-foreground"
                  }`}>
                    <span className="text-muted-foreground shrink-0">{fmtTime(l.ts)}</span>
                    {l.step && <span className="text-muted-foreground shrink-0">[{l.step}]</span>}
                    <span className="break-words">{l.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
