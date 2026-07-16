/**
 * /admin/bible-import-missing — importa os 64 livros faltantes via bolls.life
 * e revalida o gate automaticamente ao final.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/cathedra/CathedraCard";
import { CathedraButton as Button } from "@/components/cathedra/CathedraButton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlayCircle, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PreviewDetail { abbrev: string; name: string; chapters: number }
interface Preview { translation: string; books_missing: number; chapters_missing: number; detail: PreviewDetail[] }
interface Job {
  id: string; status: string; progress: number; total: number;
  current_book: string | null; message: string | null; error: string | null;
  verification: any; audit_log: any; started_at: string | null; finished_at: string | null;
}

async function invoke(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("bible-import-missing", {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message);
  return data;
}

export default function BibleImportMissing() {
  const [translation, setTranslation] = useState("NVIPT");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [starting, setStarting] = useState(false);

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
      <header>
        <h1 className="text-2xl font-serif">Importar livros faltantes da Bíblia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preenche o cânon a partir da API pública bolls.life. Livros deuterocanônicos (Tb, Jdt, Sb, Eclo, Br, 1Mc, 2Mc)
          e cânones católicos estendidos (Sl 151, Dn 13-14) NÃO são tocados — mantidos pelo import-deutero.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fonte</CardTitle>
          <CardDescription>Código da tradução no bolls.life (ex.: NVIPT, NAA, ARA).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="tr">Tradução</Label>
            <Input id="tr" value={translation} onChange={(e) => setTranslation(e.target.value.toUpperCase())} />
          </div>
          <Button variant="outline" onClick={loadPreview} disabled={loadingPreview}>
            {loadingPreview ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Recalcular pendências
          </Button>
        </CardContent>
      </Card>

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
