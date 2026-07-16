/**
 * /admin/bible-import-jobs — Histórico dos jobs de importação da Bíblia.
 * Lista as últimas execuções e link para o detalhe.
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/cathedra/CathedraCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Job {
  id: string; status: string; progress: number; total: number;
  current_book: string | null; message: string | null; error: string | null;
  started_at: string | null; finished_at: string | null; created_at: string;
  verification: any;
}

const STATUS_VARIANT: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  succeeded: "default", running: "secondary", queued: "outline",
  failed: "destructive", cancelled: "outline",
};

async function invoke(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("bible-import-missing", {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message);
  return data;
}

export default function BibleImportJobs() {
  const q = useQuery({
    queryKey: ["bible-import-jobs"],
    queryFn: async (): Promise<Job[]> => (await invoke("list_jobs", { limit: 50 }))?.jobs ?? [],
    refetchInterval: 5000,
  });

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Histórico de importações</h1>
          <p className="text-sm text-muted-foreground mt-1">Últimos 50 jobs de <code>bible-import-missing</code>.</p>
        </div>
        <Link to="/admin/bible-import-missing" className="text-sm text-primary hover:underline">← Nova importação</Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jobs</CardTitle>
          <CardDescription>Atualiza a cada 5s.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
            </div>
          ) : (q.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum job executado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data ?? []).map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>
                      <Link to={`/admin/bible-import-jobs/${j.id}`} className="font-mono text-xs text-primary hover:underline">
                        {j.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[j.status] ?? "outline"}>{j.status}</Badge></TableCell>
                    <TableCell className="text-xs">{j.progress}/{j.total}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {j.started_at ? new Date(j.started_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {j.finished_at ? new Date(j.finished_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-md truncate">
                      {j.error ? <span className="text-destructive">{j.error}</span> : j.message ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
