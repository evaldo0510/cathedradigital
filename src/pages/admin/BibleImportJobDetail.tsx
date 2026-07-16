/**
 * /admin/bible-import-jobs/:id — Detalhe de um job com audit_log, verificação
 * e botão para reexecutar (retry contínuo — recalcula pendências).
 */
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/cathedra/CathedraCard";
import { CathedraButton as Button } from "@/components/cathedra/CathedraButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string; source_id: string; status: string; progress: number; total: number;
  current_book: string | null; message: string | null; error: string | null;
  verification: any; audit_log: any;
  started_at: string | null; finished_at: string | null; created_at: string;
}

async function invoke(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("bible-import-missing", {
    body: { action, ...body },
  });
  if (error) {
    let detail = "";
    try {
      const ctx = (error as any).context;
      if (ctx?.body) detail = ` — ${typeof ctx.body === 'string' ? ctx.body : JSON.stringify(ctx.body)}`;
    } catch { /* noop */ }
    throw new Error(`${error.message}${detail}`);
  }
  return data;
}

export default function BibleImportJobDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [retrying, setRetrying] = useState(false);

  const q = useQuery({
    queryKey: ["bible-import-job", id],
    enabled: !!id,
    queryFn: async (): Promise<Job | null> => (await invoke("status", { job_id: id }))?.job ?? null,
    refetchInterval: (query) => {
      const j = query.state.data as Job | null;
      return j && ["running", "queued"].includes(j.status) ? 2000 : false;
    },
  });

  async function retry() {
    if (!id) return;
    setRetrying(true);
    try {
      const res = await invoke("start", { retry_of: id });
      if (!res?.job_id) throw new Error("Falha ao criar novo job");
      toast.success("Reexecução iniciada");
      nav(`/admin/bible-import-jobs/${res.job_id}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setRetrying(false); }
  }

  if (q.isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando job…
      </div>
    );
  }
  const job = q.data;
  if (!job) {
    return <div className="container mx-auto max-w-4xl py-8 text-sm text-muted-foreground">Job não encontrado.</div>;
  }

  const pct = job.total > 0 ? Math.min(100, Math.round((job.progress / job.total) * 100)) : 0;
  const audit: any[] = Array.isArray(job.audit_log) ? job.audit_log : [];
  const canRetry = ["failed", "cancelled", "succeeded"].includes(job.status);

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link to="/admin/bible-import-jobs" className="text-xs text-primary hover:underline">← Histórico</Link>
          <h1 className="text-2xl font-serif mt-1">Job <span className="font-mono">{job.id.slice(0, 8)}</span></h1>
          <p className="text-sm text-muted-foreground">Criado em {new Date(job.created_at).toLocaleString("pt-BR")}</p>
        </div>
        <Button onClick={retry} disabled={!canRetry || retrying}>
          {retrying
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reexecutando…</>
            : <><RefreshCw className="w-4 h-4 mr-2" /> Reexecutar (recalcula pendências)</>}
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Status <Badge>{job.status}</Badge>
          </CardTitle>
          <CardDescription>{job.message ?? "—"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">
            {job.progress}/{job.total} capítulos {job.current_book ? `· ${job.current_book}` : ""}
          </p>
          {job.error && (
            <p className="text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {job.error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log por etapa</CardTitle>
          <CardDescription>Livros processados e eventos registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
          ) : (
            <ul className="text-xs font-mono space-y-1 max-h-96 overflow-auto">
              {audit.map((e, idx) => (
                <li key={idx} className="border-b border-border/40 py-1">
                  {e.event === "retry_of"
                    ? <span>↩ retry de <Link to={`/admin/bible-import-jobs/${e.job_id}`} className="text-primary hover:underline">{String(e.job_id).slice(0, 8)}</Link> em {new Date(e.at).toLocaleString("pt-BR")}</span>
                    : <span><strong>{e.abbrev}</strong> · {e.chapters} caps · {e.verses ?? 0} versos</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {job.verification && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verificação pós-import</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-64 bg-muted/30 p-3 rounded">
              {JSON.stringify(job.verification, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
