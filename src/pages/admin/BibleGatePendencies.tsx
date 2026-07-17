/**
 * /admin/bible-gate-pendencies — Painel de pendências do gate da Bíblia.
 * Lista findings da última diagnose agrupados por livro/capítulo, mostra
 * a cobertura canônica e permite revalidar sem redeploy.
 */
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/cathedra/CathedraCard";
import { CathedraButton as Button } from "@/components/cathedra/CathedraButton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, ShieldCheck, ShieldAlert, ChevronDown, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";

function downloadBlob(name: string, mime: string, data: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()));
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc((r as any)[c])).join(","))].join("\n");
}

interface Finding {
  id: string; abbrev: string; book_name: string | null; chapter: number | null;
  finding_type: string; severity: string; message: string;
}
interface CoverageRow {
  abbrev: string; name: string; testament: string; canonical_type: string | null;
  expected_chapters: number; chapters_present: number; verses_total: number;
  coverage_pct: number; status: string;
}
interface Gate {
  blocked: boolean; status: string; last_run_at: string | null;
  run_id: string | null; blocking_findings: number; reason: string;
}

const SEV_VARIANT: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  critical: "destructive", error: "destructive", warning: "secondary", info: "outline",
};

export default function BibleGatePendencies() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [revalidating, setRevalidating] = useState(false);

  const gateQ = useQuery({
    queryKey: ["bible-read-gate"],
    queryFn: async (): Promise<Gate> => {
      const { data, error } = await supabase.rpc("bible_read_gate_status");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        blocked: !!row?.blocked, status: row?.status ?? "unknown",
        last_run_at: row?.last_run_at ?? null, run_id: row?.run_id ?? null,
        blocking_findings: row?.blocking_findings ?? 0, reason: row?.reason ?? "",
      };
    },
  });

  const coverageQ = useQuery({
    queryKey: ["bible-canonical-coverage"],
    queryFn: async (): Promise<CoverageRow[]> => {
      const { data, error } = await supabase.rpc("bible_canonical_coverage");
      if (error) throw error;
      return (data ?? []) as CoverageRow[];
    },
  });

  const findingsQ = useQuery({
    queryKey: ["bible-diagnostic-findings", gateQ.data?.run_id],
    enabled: !!gateQ.data?.run_id,
    queryFn: async (): Promise<Finding[]> => {
      const { data, error } = await supabase
        .from("bible_diagnostic_findings")
        .select("id, abbrev, book_name, chapter, finding_type, severity, message")
        .eq("run_id", gateQ.data!.run_id!)
        .order("abbrev", { ascending: true })
        .order("chapter", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as Finding[];
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, {
      abbrev: string; book_name: string;
      counts: Record<string, number>;
      items: Finding[];
    }>();
    for (const f of findingsQ.data ?? []) {
      const key = f.abbrev;
      const cur = map.get(key) ?? { abbrev: f.abbrev, book_name: f.book_name ?? f.abbrev, counts: {}, items: [] };
      cur.counts[f.finding_type] = (cur.counts[f.finding_type] ?? 0) + 1;
      cur.items.push(f);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.abbrev.localeCompare(b.abbrev));
  }, [findingsQ.data]);

  const totalsByType = useMemo(() => {
    const t: Record<string, number> = {};
    for (const f of findingsQ.data ?? []) t[f.finding_type] = (t[f.finding_type] ?? 0) + 1;
    return t;
  }, [findingsQ.data]);

  async function revalidate() {
    setRevalidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("bible-canon-diagnose", {
        body: { action: "run" },
      });
      if (error) throw new Error(error.message);
      toast.success(`Diagnose executada: ${data?.total_findings ?? 0} findings`);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["bible-read-gate"] }),
        qc.invalidateQueries({ queryKey: ["bible-canonical-coverage"] }),
        qc.invalidateQueries({ queryKey: ["bible-diagnostic-findings"] }),
      ]);
    } catch (e: any) {
      toast.error(`Falha ao revalidar: ${e.message}`);
    } finally {
      setRevalidating(false);
    }
  }

  function toggle(abbrev: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(abbrev) ? next.delete(abbrev) : next.add(abbrev);
      return next;
    });
  }

  const gate = gateQ.data;
  const coverage = coverageQ.data ?? [];
  const covered = coverage.filter((c) => c.status === "complete").length;

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Pendências do gate da Bíblia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Últimos achados de integridade agrupados por livro. O gate bloqueia leitura
            pública quando há livros ou capítulos faltantes.
          </p>
        </div>
        <Button onClick={revalidate} disabled={revalidating}>
          {revalidating
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Revalidando…</>
            : <><RefreshCw className="w-4 h-4 mr-2" /> Revalidar diagnose</>}
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {gate?.blocked
              ? <><ShieldAlert className="w-5 h-5 text-amber-600" /> Gate bloqueando <Badge variant="destructive">bloqueado</Badge></>
              : <><ShieldCheck className="w-5 h-5 text-green-700" /> Gate liberado <Badge>ok</Badge></>}
          </CardTitle>
          <CardDescription>
            Status: <code>{gate?.status ?? "…"}</code> ·
            Última verificação: {gate?.last_run_at ? new Date(gate.last_run_at).toLocaleString("pt-BR") : "—"} ·
            Run: <code>{gate?.run_id?.slice(0, 8) ?? "—"}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="border rounded p-3">
            <div className="text-muted-foreground text-xs">Livros cobertos</div>
            <div className="text-xl font-semibold">{covered} / {coverage.length}</div>
          </div>
          <div className="border rounded p-3">
            <div className="text-muted-foreground text-xs">Findings bloqueantes</div>
            <div className="text-xl font-semibold">{gate?.blocking_findings ?? 0}</div>
          </div>
          {Object.entries(totalsByType).map(([t, n]) => (
            <div key={t} className="border rounded p-3">
              <div className="text-muted-foreground text-xs">{t}</div>
              <div className="text-xl font-semibold">{n}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pendências por livro</CardTitle>
          <CardDescription>Clique numa linha para ver os capítulos afetados.</CardDescription>
        </CardHeader>
        <CardContent>
          {findingsQ.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando findings…
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma pendência registrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Livro</TableHead>
                  <TableHead>Tipos de finding</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((g) => {
                  const isOpen = expanded.has(g.abbrev);
                  const total = g.items.length;
                  return (
                    <>
                      <TableRow key={g.abbrev} className="cursor-pointer" onClick={() => toggle(g.abbrev)}>
                        <TableCell>{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</TableCell>
                        <TableCell>
                          <div className="font-medium">{g.abbrev}</div>
                          <div className="text-xs text-muted-foreground">{g.book_name}</div>
                        </TableCell>
                        <TableCell className="space-x-1">
                          {Object.entries(g.counts).map(([t, n]) => (
                            <Badge key={t} variant="outline">{t}: {n}</Badge>
                          ))}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{total}</TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow key={`${g.abbrev}-details`}>
                          <TableCell></TableCell>
                          <TableCell colSpan={3} className="bg-muted/30">
                            <ul className="space-y-1 text-xs">
                              {g.items.map((f) => (
                                <li key={f.id} className="flex gap-2 items-start">
                                  <Badge variant={SEV_VARIANT[f.severity] ?? "outline"} className="text-[10px]">{f.severity}</Badge>
                                  <span className="font-mono text-muted-foreground w-14 shrink-0">
                                    {f.chapter ? `cap. ${f.chapter}` : "livro"}
                                  </span>
                                  <span>{f.message}</span>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
