/**
 * /admin/bible-import — Tela para cadastrar fontes de tradução bíblica
 * e disparar importação de dumps NDJSON canônicos.
 *
 * Formato esperado do dump (uma linha por versículo):
 *   {"abbr":"Gn","chapter":1,"verse":1,"text":"No princípio..."}
 *
 * Fluxo:
 *   1. Admin preenche metadados (tradução, licença, atribuição, URL-fonte)
 *      e aponta um arquivo .ndjson (upload privado em `bible-dumps`) ou URL.
 *   2. Salvamos a fonte em `bible_translation_sources` (status=draft).
 *   3. Disparamos `bible-import-ndjson` que cria um job em
 *      `bible_import_jobs` e processa o arquivo com upserts idempotentes.
 *   4. A tela faz polling do job atual e mostra progresso + verificação
 *      pós-import (cobertura dos 73 livros).
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
import { Loader2, Upload, Link as LinkIcon, FileText, ShieldCheck, ShieldAlert } from "lucide-react";

type SourceStatus = "draft" | "importing" | "ready" | "failed" | "archived";
type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

interface TranslationSource {
  id: string;
  code: string;
  name: string;
  language: string;
  translation: string;
  license: string;
  attribution: string;
  source_url: string | null;
  file_url: string | null;
  notes: string | null;
  is_primary: boolean;
  status: SourceStatus;
  books_count: number;
  chapters_count: number;
  verses_count: number;
  imported_at: string | null;
  created_at: string;
}

interface ImportJob {
  id: string;
  source_id: string;
  status: JobStatus;
  progress: number;
  total: number;
  current_book: string | null;
  message: string | null;
  error: string | null;
  verification: {
    passed?: boolean;
    blocking?: Record<string, number>;
    total_findings?: number;
    run_id?: string | null;
    skipped?: boolean;
  } | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

const INITIAL_FORM = {
  code: "",
  name: "",
  language: "pt-BR",
  translation: "",
  license: "",
  attribution: "",
  source_url: "",
  notes: "",
  is_primary: false,
  file_url: "",
};

type FormState = typeof INITIAL_FORM;

function sourceStatusBadge(s: SourceStatus) {
  const map: Record<SourceStatus, string> = {
    draft: "bg-muted text-foreground",
    importing: "bg-blue-600",
    ready: "bg-emerald-600",
    failed: "bg-destructive",
    archived: "bg-zinc-500",
  };
  return <Badge className={map[s]}>{s}</Badge>;
}

function jobStatusBadge(s: JobStatus) {
  const map: Record<JobStatus, string> = {
    queued: "bg-muted text-foreground",
    running: "bg-blue-600",
    succeeded: "bg-emerald-600",
    failed: "bg-destructive",
    cancelled: "bg-zinc-500",
  };
  return <Badge className={map[s]}>{s}</Badge>;
}

export default function BibleImportAdmin() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sources, setSources] = useState<TranslationSource[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Polling enquanto houver job em execução
  const hasRunning = useMemo(() => jobs.some((j) => j.status === "running" || j.status === "queued"), [jobs]);
  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(loadAll, 2000);
    return () => clearInterval(id);
  }, [hasRunning, loadAll]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate(): string | null {
    const required: Array<keyof FormState> = ["code", "name", "translation", "license", "attribution"];
    for (const k of required) if (!String(form[k]).trim()) return `Campo obrigatório: ${k}`;
    if (!file && !form.file_url.trim()) return "Envie um arquivo .ndjson ou informe uma URL HTTPS";
    if (form.file_url && !/^https:\/\//i.test(form.file_url)) return "file_url deve ser HTTPS";
    if (file && !/\.ndjson(\.gz)?$|\.jsonl$/i.test(file.name)) {
      return "Arquivo deve ser .ndjson ou .jsonl";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      // 1. Cria a fonte
      const { data: src, error: srcErr } = await supabase
        .from("bible_translation_sources")
        .insert({
          code: form.code.trim(),
          name: form.name.trim(),
          language: form.language.trim() || "pt-BR",
          translation: form.translation.trim(),
          license: form.license.trim(),
          attribution: form.attribution.trim(),
          source_url: form.source_url.trim() || null,
          file_url: file ? null : form.file_url.trim() || null,
          notes: form.notes.trim() || null,
          is_primary: form.is_primary,
          status: "draft",
        })
        .select("id")
        .single();
      if (srcErr || !src) throw new Error(srcErr?.message ?? "falha ao criar fonte");
      const sourceId = src.id as string;

      // 2. Upload se arquivo
      let filePath: string | undefined;
      if (file) {
        const path = `${sourceId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("bible-dumps").upload(path, file, {
          contentType: "application/x-ndjson",
          upsert: false,
        });
        if (upErr) throw new Error(`upload: ${upErr.message}`);
        filePath = path;
        await supabase.from("bible_translation_sources")
          .update({ file_url: `storage://bible-dumps/${path}` }).eq("id", sourceId);
      }

      // 3. Dispara import
      const { data: invokeData, error: invokeErr } = await supabase.functions.invoke("bible-import-ndjson", {
        body: filePath
          ? { source_id: sourceId, file_path: filePath }
          : { source_id: sourceId, file_url: form.file_url.trim() },
      });
      if (invokeErr) throw new Error(`import: ${invokeErr.message}`);
      toast.success(`Importação iniciada (job ${(invokeData as { job_id?: string })?.job_id ?? "?"})`);
      resetForm();
      await loadAll();
    } catch (e) {
      toast.error((e as Error).message);
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
        <h1 className="text-3xl font-semibold">Importação de Bíblia (NDJSON)</h1>
        <p className="text-muted-foreground mt-1">
          Importa traduções completas a partir de dumps no formato canônico
          <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">{"{abbr,chapter,verse,text}"}</code>
          (uma linha por versículo). Acesso restrito a administradores.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nova fonte de tradução</CardTitle>
          <CardDescription>
            Registre os metadados de licença e atribuição antes de importar. Esses campos são
            obrigatórios — não importamos texto bíblico sem licença declarada.
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
                onChange={(e) => update("source_url", e.target.value)}
                placeholder="https://..." />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)}
                rows={2} placeholder="Observações internas (opcional)" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="file">Arquivo NDJSON</Label>
              <Input id="file" type="file" accept=".ndjson,.jsonl" ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file && (
                <p className="text-xs text-muted-foreground">
                  <FileText className="inline h-3 w-3 mr-1" />
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="file_url">… ou URL HTTPS</Label>
              <Input id="file_url" type="url" value={form.file_url}
                onChange={(e) => update("file_url", e.target.value)}
                placeholder="https://exemplo.com/dump.ndjson" disabled={!!file} />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Switch id="is_primary" checked={form.is_primary}
                onCheckedChange={(v) => update("is_primary", v)} />
              <Label htmlFor="is_primary" className="cursor-pointer">
                Marcar como fonte primária deste idioma
              </Label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                Limpar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando…</>
                  : <><Upload className="h-4 w-4 mr-2" /> Salvar e importar</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fontes cadastradas</CardTitle>
          <CardDescription>
            {sources.length} fonte(s). O progresso atualiza automaticamente enquanto a importação roda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
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
                      <TableCell className="text-xs min-w-[180px]">
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
