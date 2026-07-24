import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

type QueueRow = {
  id: string;
  paragraph: number;
  status: "pending" | "processing" | "done" | "failed";
  attempts: number;
  last_error: string | null;
  requested_at: string;
  processed_at: string | null;
};

const statusVariant: Record<QueueRow["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "outline",
  done: "default",
  failed: "destructive",
};

export default function CatechismImportQueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("catechism_import_queue")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(200);
    if (!error && data) setRows(data as QueueRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = rows.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fila de Importação — Catecismo</h1>
          <p className="text-sm text-muted-foreground">
            Parágrafos solicitados por leitores que ainda não constam no banco oficial.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["pending", "processing", "done", "failed"] as const).map((s) => (
          <Card key={s}>
            <CardContent className="pt-6">
              <div className="text-xs uppercase text-muted-foreground">{s}</div>
              <div className="text-2xl font-semibold">{counts[s] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas 200 solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação registrada.</p>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm w-16">§{r.paragraph}</span>
                    <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    {r.attempts > 0 && (
                      <span className="text-xs text-muted-foreground">{r.attempts} tent.</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-right max-w-[50%] truncate">
                    {r.last_error ?? new Date(r.requested_at).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
