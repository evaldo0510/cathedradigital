/**
 * /admin/client-errors — Consulta erros do AppErrorBoundary persistidos em
 * analytics_events (event_name='client_error'). Permite buscar pelo Ref ID
 * que aparece na tela de manutenção.
 */
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/cathedra/CathedraCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";

interface ErrRow {
  id: string;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
  url: string | null;
  properties: any;
}

export default function ClientErrors() {
  const [sp, setSp] = useSearchParams();
  const initialRef = sp.get("ref") ?? "";
  const [ref, setRef] = useState(initialRef);
  const [debounced, setDebounced] = useState(initialRef);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(ref.trim()), 300);
    return () => clearTimeout(t);
  }, [ref]);

  useEffect(() => {
    if (debounced) setSp({ ref: debounced }, { replace: true });
    else setSp({}, { replace: true });
  }, [debounced, setSp]);

  const q = useQuery({
    queryKey: ["client-errors", debounced],
    queryFn: async (): Promise<ErrRow[]> => {
      let query = supabase
        .from("analytics_events")
        .select("id, created_at, user_id, session_id, url, properties")
        .eq("event_name", "client_error")
        .order("created_at", { ascending: false })
        .limit(100);
      if (debounced) {
        query = query.filter("properties->>ref_id", "eq", debounced);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ErrRow[];
    },
    refetchInterval: 15000,
  });

  const rows = q.data ?? [];
  const focused = useMemo(() => (debounced ? rows[0] : null), [rows, debounced]);

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-serif">Erros do cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registros de <code>AppErrorBoundary</code> persistidos em <code>analytics_events</code>.
          Cole o Ref ID que apareceu na tela de manutenção para investigar rota, query e stack.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar por Ref ID</CardTitle>
          <CardDescription>ex.: <code>err_x8t9yvea9</code></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end">
            <div className="flex-1 max-w-sm">
              <Label htmlFor="ref">Ref ID</Label>
              <Input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="err_xxxxxxxxx" />
            </div>
            {q.isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mb-3" />}
          </div>
        </CardContent>
      </Card>

      {focused && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-4 h-4" /> Encontrado
              <Badge variant="destructive">{focused.properties?.ref_id}</Badge>
            </CardTitle>
            <CardDescription>
              {new Date(focused.created_at).toLocaleString("pt-BR")} · user <code>{focused.user_id?.slice(0, 8) ?? "—"}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Rota:</span> <code>{focused.properties?.route ?? focused.url ?? "—"}</code></div>
            <div><span className="text-muted-foreground">Query:</span> <code className="break-all">{focused.properties?.query || "—"}</code></div>
            <div><span className="text-muted-foreground">Hash:</span> <code>{focused.properties?.hash || "—"}</code></div>
            <div><span className="text-muted-foreground">Mensagem:</span> <span className="text-destructive">{focused.properties?.message ?? "—"}</span></div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-widest mt-2 mb-1">Stack</div>
              <pre className="text-[11px] font-mono bg-muted/40 p-3 rounded max-h-64 overflow-auto whitespace-pre-wrap">
                {focused.properties?.stack ?? "(sem stack)"}
              </pre>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-widest mt-2 mb-1">Component stack</div>
              <pre className="text-[11px] font-mono bg-muted/40 p-3 rounded max-h-64 overflow-auto whitespace-pre-wrap">
                {focused.properties?.component_stack ?? "(sem component stack)"}
              </pre>
            </div>
            <div className="text-xs text-muted-foreground">UA: {focused.properties?.user_agent ?? "—"}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos {rows.length} erros</CardTitle>
          <CardDescription>Atualiza a cada 15s.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro.</p>
          ) : (
            <div className="space-y-1 text-xs font-mono max-h-96 overflow-auto">
              {rows.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRef(r.properties?.ref_id ?? "")}
                  className="w-full text-left border rounded p-2 hover:bg-muted/40 transition"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-primary">{r.properties?.ref_id ?? "—"}</span>
                    <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="text-muted-foreground truncate">
                    {r.properties?.route ?? r.url} — {r.properties?.message ?? ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
