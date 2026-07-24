import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RefreshCw, RotateCcw, Play, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CATECHISM_RANGES, rangeForParagraph, normalizeErrorKey } from "@/lib/catechismRanges";

type QueueStatus = "pending" | "processing" | "completed" | "error";

type QueueRow = {
  id: string;
  paragraph: number;
  status: QueueStatus;
  attempts: number;
  last_error: string | null;
  requested_at: string;
  processed_at: string | null;
  next_attempt_at: string | null;
  attempts_log: Array<{
    attempt: number;
    started_at: string;
    duration_ms: number;
    status: "completed" | "error";
    error?: string;
    next_attempt_at?: string | null;
    gave_up?: boolean;
    source?: string;
  }> | null;
};

const STATUS_LABEL: Record<QueueStatus, string> = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluído",
  error: "Erro",
};

const statusVariant: Record<QueueStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "outline",
  completed: "default",
  error: "destructive",
};

const ALL_STATUSES: QueueStatus[] = ["pending", "processing", "completed", "error"];

export default function CatechismImportQueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | QueueStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("catechism_import_queue")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Falha ao carregar fila", { description: error.message });
    } else if (data) {
      setRows(data as unknown as QueueRow[]);
      setSelected(new Set());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Auto-refresh a cada 10s quando houver itens em processamento/pendentes
    const id = setInterval(() => {
      setRows((prev) => {
        const hasLive = prev.some((r) => r.status === "pending" || r.status === "processing");
        if (hasLive) load();
        return prev;
      });
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const c: Record<QueueStatus, number> = { pending: 0, processing: 0, completed: 0, error: 0 };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const avgProcessingMs = useMemo(() => {
    const completed = rows.filter((r) => r.status === "completed" && r.processed_at);
    if (!completed.length) return null;
    const total = completed.reduce(
      (acc, r) => acc + (new Date(r.processed_at!).getTime() - new Date(r.requested_at).getTime()),
      0,
    );
    return Math.round(total / completed.length);
  }, [rows]);

  const avgAttemptDurationMs = useMemo(() => {
    let n = 0;
    let sum = 0;
    for (const r of rows) {
      for (const a of r.attempts_log ?? []) {
        if (typeof a.duration_ms === "number") {
          sum += a.duration_ms;
          n += 1;
        }
      }
    }
    return n > 0 ? Math.round(sum / n) : null;
  }, [rows]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const requeueIds = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase
      .from("catechism_import_queue")
      .update({
        status: "pending",
        last_error: null,
        next_attempt_at: null,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);
    if (error) {
      toast.error("Falha ao re-enfileirar", { description: error.message });
      return;
    }
    toast.success(`${ids.length} item(ns) re-enfileirado(s).`);
    await load();
  };

  const runWorker = async (paragraphs?: number[]) => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("catechism-import-worker", {
        body: paragraphs?.length ? { paragraphs } : { limit: 20 },
      });
      if (error) throw error;
      toast.success("Worker executado", {
        description: `${(data as any)?.completed ?? 0} concluído(s) · ${(data as any)?.errors ?? 0} erro(s)`,
      });
      await load();
    } catch (err: any) {
      toast.error("Falha ao executar worker", { description: err?.message ?? String(err) });
    } finally {
      setRunning(false);
    }
  };

  const requeueAllErrors = () => {
    const ids = rows.filter((r) => r.status === "error").map((r) => r.id);
    if (!ids.length) {
      toast.info("Nenhum item com erro.");
      return;
    }
    requeueIds(ids);
  };

  const requeueSelected = () => requeueIds(Array.from(selected));

  const formatMs = (ms: number | null) => {
    if (ms == null) return "—";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60_000).toFixed(1)}min`;
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Fila de Importação — Catecismo</h1>
          <p className="text-sm text-muted-foreground">
            Parágrafos solicitados por leitores que ainda não constam no banco oficial.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <Button size="sm" onClick={() => runWorker()} disabled={running}>
            <Play className="mr-2 h-4 w-4" /> Rodar worker (20)
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {ALL_STATUSES.map((s) => (
          <Card key={s}>
            <CardContent className="pt-6">
              <div className="text-xs uppercase text-muted-foreground">{STATUS_LABEL[s]}</div>
              <div className="text-2xl font-semibold">{counts[s]}</div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase text-muted-foreground">Tempo médio total</div>
            <div className="text-2xl font-semibold">{formatMs(avgProcessingMs)}</div>
            <div className="text-[10px] text-muted-foreground">enfileiramento → conclusão</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase text-muted-foreground">Tempo médio/tentativa</div>
            <div className="text-2xl font-semibold">{formatMs(avgAttemptDurationMs)}</div>
            <div className="text-[10px] text-muted-foreground">duração do fetch</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Solicitações</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({rows.length})</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]} ({counts[s]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={requeueSelected}
              disabled={selected.size === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Re-enfileirar ({selected.size})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={requeueAllErrors}
              disabled={counts.error === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Re-enfileirar erros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação nesse filtro.</p>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => {
                const lastLog = r.attempts_log?.[r.attempts_log.length - 1];
                const isRetryable = r.status === "error" || r.status === "pending";
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        aria-label={`Selecionar §${r.paragraph}`}
                        className="h-4 w-4"
                      />
                      <span className="font-mono text-sm w-16">§{r.paragraph}</span>
                      <Badge variant={statusVariant[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      {r.attempts > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {r.attempts} tent.
                        </span>
                      )}
                      {r.next_attempt_at && r.status === "error" && (
                        <span className="text-[10px] text-muted-foreground">
                          próx: {new Date(r.next_attempt_at).toLocaleTimeString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-xs text-muted-foreground text-right max-w-[320px] truncate">
                        {r.last_error
                          ? r.last_error
                          : lastLog
                            ? `${formatMs(lastLog.duration_ms)} · ${new Date(lastLog.started_at).toLocaleString("pt-BR")}`
                            : new Date(r.requested_at).toLocaleString("pt-BR")}
                      </div>
                      {isRetryable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runWorker([r.paragraph])}
                          disabled={running}
                          title="Executar worker para este parágrafo agora"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      {r.status === "error" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => requeueIds([r.id])}
                          title="Re-enfileirar (limpa backoff)"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
