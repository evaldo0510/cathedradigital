/**
 * /admin/bible-import-missing — importa os 64 livros faltantes via bolls.life
 * e revalida o gate automaticamente ao final.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/cathedra/CathedraCard";
import { CathedraButton as Button } from "@/components/cathedra/CathedraButton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlayCircle, Search, CheckCircle2, AlertTriangle, ShieldCheck, FlaskConical, History } from "lucide-react";
import { toast } from "sonner";

interface PreviewDetail { abbrev: string; name: string; chapters: number }
interface Preview { translation: string; books_missing: number; chapters_missing: number; detail: PreviewDetail[] }
interface Job {
  id: string; status: string; progress: number; total: number;
  current_book: string | null; message: string | null; error: string | null;
  verification: any; audit_log: any; started_at: string | null; finished_at: string | null;
}
interface Validation {
  ok: boolean; translation: string; reachable: boolean;
  bolls_books_total?: number; expected_books?: number; covered_books?: number;
  issues: Array<{ level: 'error' | 'warning'; code: string; message: string }>;
}
interface DryRun {
  dry_run: true; translation: string; books_missing: number; chapters_missing_total: number;
  samples: Array<{ abbrev: string; name: string; chapters_missing: number; sample_chapter: number; sample_verses: number; first_verse: string | null; error?: string }>;
}

async function invoke(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("bible-import-missing", {
    body: { action, ...body },
  });
  if (error) {
    // supabase-js embute o body em `context` quando o status >= 400
    let detail = "";
    try {
      const ctx = (error as any).context;
      if (ctx?.body) detail = ` — ${typeof ctx.body === 'string' ? ctx.body : JSON.stringify(ctx.body)}`;
    } catch { /* noop */ }
    throw new Error(`${error.message}${detail}`);
  }
  return data;
}

export default function BibleImportMissing() {
  const [translation, setTranslation] = useState("NVIPT");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [dryRun, setDryRun] = useState<DryRun | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [loadingDryRun, setLoadingDryRun] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [starting, setStarting] = useState(false);

  async function runValidation() {
    setLoadingValidation(true); setValidation(null);
    try { setValidation(await invoke("validate", { translation })); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoadingValidation(false); }
  }

  async function runDryRun() {
    setLoadingDryRun(true); setDryRun(null);
    try { setDryRun(await invoke("dry_run", { translation })); toast.success("Dry-run concluído — nada foi gravado."); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoadingDryRun(false); }
  }

  async function loadPreview() {
    setLoadingPreview(true);
    try {
      const res = await invoke("preview", { translation });
      setPreview(res);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingPreview(false); }
  }

  async function start() {
    setStarting(true);
    try {
      const res = await invoke("start", { translation });
      if (!res?.job_id) throw new Error("Job não iniciado");
      toast.success("Importação iniciada");
      pollJob(res.job_id);
    } catch (e: any) { toast.error(e.message); setStarting(false); }
  }

  function pollJob(jobId: string) {
    let stop = false;
    (async function loop() {
      while (!stop) {
        try {
          const { job: j } = await invoke("status", { job_id: jobId });
          setJob(j);
          if (["succeeded", "failed", "cancelled"].includes(j.status)) {
            setStarting(false);
            if (j.status === "succeeded") {
              toast.success("Import concluído e gate revalidado");
              loadPreview();
            } else {
              toast.error(`Import ${j.status}: ${j.error ?? ""}`);
            }
            return;
          }
        } catch (e: any) { /* continua tentando */ }
        await new Promise((r) => setTimeout(r, 2000));
      }
    })();
    return () => { stop = true; };
  }

  useEffect(() => { loadPreview(); /* eslint-disable-next-line */ }, []);

  const pct = job && job.total > 0 ? Math.min(100, Math.round((job.progress / job.total) * 100)) : 0;
  const gateBlocked = job?.verification?.gate?.blocked ?? job?.verification?.gate?.[0]?.blocked;

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Importar livros faltantes da Bíblia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preenche o cânon a partir da API pública bolls.life. Livros deuterocanônicos (Tb, Jdt, Sb, Eclo, Br, 1Mc, 2Mc)
            e cânones católicos estendidos (Sl 151, Dn 13-14) NÃO são tocados — mantidos pelo import-deutero.
          </p>
        </div>
        <Link
          to="/admin/bible-import-jobs"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <History className="w-4 h-4" /> Histórico de jobs
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fonte</CardTitle>
          <CardDescription>Código da tradução no bolls.life (ex.: NVIPT, NAA, ARA). Valide antes de importar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <Label htmlFor="tr">Tradução</Label>
            <Input id="tr" value={translation} onChange={(e) => setTranslation(e.target.value.toUpperCase())} />
          </div>
          <Button variant="outline" onClick={runValidation} disabled={loadingValidation}>
            {loadingValidation ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            Validar fonte
          </Button>
          <Button variant="outline" onClick={runDryRun} disabled={loadingDryRun}>
            {loadingDryRun ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
            Dry-run (não grava)
          </Button>
          <Button variant="outline" onClick={loadPreview} disabled={loadingPreview}>
            {loadingPreview ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Recalcular pendências
          </Button>
        </CardContent>
      </Card>

      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Validação da fonte
              <Badge variant={validation.ok ? "default" : "destructive"}>{validation.ok ? "ok" : "falhou"}</Badge>
            </CardTitle>
            <CardDescription>
              {validation.reachable
                ? `${validation.covered_books}/${validation.expected_books} livros protocanônicos cobertos · ${validation.bolls_books_total} livros totais no bolls`
                : "Fonte inacessível"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validation.issues.length === 0 ? (
              <p className="text-sm text-green-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Sem problemas.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {validation.issues.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Badge variant={i.level === 'error' ? 'destructive' : 'secondary'} className="text-[10px]">{i.level}</Badge>
                    <span className="text-muted-foreground text-xs font-mono">{i.code}</span>
                    <span>{i.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {dryRun && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dry-run · {dryRun.translation}</CardTitle>
            <CardDescription>
              {dryRun.books_missing} livros seriam criados/completados · {dryRun.chapters_missing_total} capítulos gravados.
              Amostra de 1 capítulo por livro (nenhuma escrita).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-auto text-xs space-y-1">
              {dryRun.samples.map((s) => (
                <div key={s.abbrev} className="border rounded p-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{s.abbrev} · {s.name}</span>
                    <span className="text-muted-foreground">{s.chapters_missing} caps · sample cap {s.sample_chapter} → {s.sample_verses} vv</span>
                  </div>
                  {s.error
                    ? <div className="text-destructive mt-1">{s.error}</div>
                    : <div className="text-muted-foreground mt-1 italic line-clamp-2">"{s.first_verse ?? '—'}"</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Pendências detectadas
              <Badge variant={preview.books_missing === 0 ? "default" : "destructive"}>
                {preview.books_missing} livros / {preview.chapters_missing} capítulos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preview.books_missing === 0 ? (
              <p className="text-sm flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Nada a importar. Todos os livros protocanônicos cobertos por {preview.translation}.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4 max-h-64 overflow-auto">
                  {preview.detail.map((d) => (
                    <div key={d.abbrev} className="flex justify-between border rounded px-2 py-1">
                      <span className="font-medium">{d.abbrev}</span>
                      <span className="text-muted-foreground">{d.chapters} cap</span>
                    </div>
                  ))}
                </div>
                <Button onClick={start} disabled={starting || (job?.status === "running")}>
                  {starting || job?.status === "running"
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando…</>
                    : <><PlayCircle className="w-4 h-4 mr-2" /> Importar tudo faltante</>}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {job && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job {job.id.slice(0, 8)} · {job.status}</CardTitle>
            <CardDescription>{job.message ?? "—"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={pct} />
            <p className="text-sm text-muted-foreground">
              {job.progress}/{job.total} capítulos {job.current_book ? `· ${job.current_book}` : ""}
            </p>
            {job.error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {job.error}
              </p>
            )}
            {job.status === "succeeded" && job.verification && (
              <div className="border rounded p-3 bg-muted/30 text-sm space-y-1">
                <div className="font-medium">Revalidação do gate</div>
                <div>Diagnose: <Badge>{job.verification.status ?? "?"}</Badge> · {job.verification.total_findings ?? "?"} findings · run <code>{String(job.verification.run_id ?? "-").slice(0,8)}</code></div>
                <div>Gate <code>/bible</code>: {gateBlocked ? <Badge variant="destructive">bloqueado</Badge> : <Badge>liberado</Badge>}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
