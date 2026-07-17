/**
 * /admin/bible-import-jobs — Histórico dos jobs de importação da Bíblia.
 * Lista as últimas execuções e link para o detalhe.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/cathedra/CathedraCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";

interface Job {
  id: string; status: string; progress: number; total: number;
  current_book: string | null; message: string | null; error: string | null;
  started_at: string | null; finished_at: string | null; created_at: string;
  verification: any; audit_log?: any;
  source_code?: string | null; translation?: string | null;
}

type Period = "all" | "24h" | "7d" | "30d";
const PERIOD_MS: Record<Period, number | null> = {
  all: null, "24h": 24 * 3600_000, "7d": 7 * 86400_000, "30d": 30 * 86400_000,
};

const STATUS_VARIANT: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  succeeded: "default", running: "secondary", queued: "outline",
  failed: "destructive", cancelled: "outline",
};

function formatDuration(startISO: string | null, endISO: string | null): string {
  if (!startISO) return "—";
  const start = new Date(startISO).getTime();
  const end = endISO ? new Date(endISO).getTime() : Date.now();
  const ms = Math.max(0, end - start);
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return rs === 0 ? `${m}min` : `${m}min ${rs}s`;
}

function versesFromAudit(audit: any): number {
  if (!Array.isArray(audit)) return 0;
  return audit.reduce((sum: number, e: any) => sum + (typeof e?.verses === "number" ? e.verses : 0), 0);
}

function revalidationLabel(v: any): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!v) return { label: "—", variant: "outline" };
  const retry = v?.revalidation_retry;
  if (retry?.pending) return { label: "imediata · retry pendente", variant: "secondary" };
  if (retry?.ran) return { label: "imediata + 3min", variant: "default" };
  if (v?.ran) return { label: "imediata", variant: "default" };
  return { label: "—", variant: "outline" };
}

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
    queryFn: async (): Promise<Job[]> => (await invoke("list_jobs", { limit: 200 }))?.jobs ?? [],
    refetchInterval: 5000,
  });

  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState<string>("");

  const all = q.data ?? [];

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const j of all) if (j.translation) set.add(j.translation);
    return Array.from(set).sort();
  }, [all]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    for (const j of all) c[j.status] = (c[j.status] ?? 0) + 1;
    return c;
  }, [all]);

  const filtered = useMemo(() => {
    const cutoff = PERIOD_MS[period] ? Date.now() - (PERIOD_MS[period] as number) : null;
    const term = search.trim().toLowerCase();
    return all.filter((j) => {
      if (status !== "all" && j.status !== status) return false;
      if (source !== "all" && j.translation !== source) return false;
      if (cutoff && new Date(j.created_at).getTime() < cutoff) return false;
      if (term) {
        const hay = `${j.id} ${j.message ?? ""} ${j.error ?? ""} ${j.current_book ?? ""} ${j.translation ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [all, status, source, period, search]);

  const hasFilter = status !== "all" || source !== "all" || period !== "all" || search.trim() !== "";

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Histórico de importações</h1>
          <p className="text-sm text-muted-foreground mt-1">Últimos 200 jobs de <code>bible-import-missing</code>.</p>
        </div>
        <Link to="/admin/bible-import-missing" className="text-sm text-primary hover:underline">← Nova importação</Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>
            Total: <strong>{counts.all ?? 0}</strong> ·{" "}
            {["succeeded", "running", "queued", "failed", "cancelled"].map((s) => (
              <span key={s} className="mr-2">
                {s}: <strong>{counts[s] ?? 0}</strong>
              </span>
            ))}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="f-status" className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="f-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({counts.all ?? 0})</SelectItem>
                <SelectItem value="succeeded">succeeded ({counts.succeeded ?? 0})</SelectItem>
                <SelectItem value="running">running ({counts.running ?? 0})</SelectItem>
                <SelectItem value="queued">queued ({counts.queued ?? 0})</SelectItem>
                <SelectItem value="failed">failed ({counts.failed ?? 0})</SelectItem>
                <SelectItem value="cancelled">cancelled ({counts.cancelled ?? 0})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-source" className="text-xs">Fonte (tradução)</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="f-source"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-period" className="text-xs">Período</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger id="f-period"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-search" className="text-xs">Busca (id, mensagem, livro)</Label>
            <div className="relative">
              <Input id="f-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ex.: Gn, err, retry…" />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Jobs {hasFilter && <span className="text-sm text-muted-foreground font-normal">— {filtered.length} de {all.length}</span>}
          </CardTitle>
          <CardDescription>Atualiza a cada 5s.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasFilter ? "Nenhum job corresponde aos filtros." : "Nenhum job executado ainda."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Versos</TableHead>
                  <TableHead>Revalidação</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((j) => {
                  const reval = revalidationLabel(j.verification);
                  return (
                    <TableRow key={j.id}>
                      <TableCell>
                        <Link to={`/admin/bible-import-jobs/${j.id}`} className="font-mono text-xs text-primary hover:underline">
                          {j.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell><Badge variant={STATUS_VARIANT[j.status] ?? "outline"}>{j.status}</Badge></TableCell>
                      <TableCell className="text-xs">{j.progress}/{j.total}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDuration(j.started_at, j.finished_at)}</TableCell>
                      <TableCell className="text-xs">{versesFromAudit(j.audit_log).toLocaleString("pt-BR")}</TableCell>
                      <TableCell><Badge variant={reval.variant} className="text-[10px]">{reval.label}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {j.started_at ? new Date(j.started_at).toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-xs max-w-md truncate">
                        {j.error ? <span className="text-destructive">{j.error}</span> : j.message ?? "—"}
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
