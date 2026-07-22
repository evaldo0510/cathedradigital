/**
 * /admin/editorial-integrity — Cathedra Index · Integridade Editorial.
 *
 * Cruza `glossary` e `nexus_relations` para expor inconsistências no padrão
 * Logos 2030 + Nexus Ouro. Permite regeração assistida por IA do
 * `deep_interpretation` (verbete volta para status='draft' após gerar).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

const GOLD_MIN = 20;

interface Row {
  slug: string;
  term: string;
  status: string;
  editorial_completeness: string | null;
  no_deep: boolean;
  no_etym: boolean;
  no_logos: boolean;
  no_bib: boolean;
  no_faq: boolean;
  no_next: boolean;
  nexus_count: number;
  issues: string[];
}

export default function EditorialIntegrityPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<{ published: number; complete: number; broken: number }>({
    published: 0, complete: 0, broken: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: allRows, error: e1 } = await supabase
        .from("glossary")
        .select("slug,term,status,editorial_completeness,deep_interpretation,etymology,logos_meditation,bibliography,faq,next_steps,nexus_refs")
        .order("term");
      if (e1) throw e1;

      const published = (allRows ?? []).filter((r: any) => r.status === "published");
      const complete = published.filter((r: any) => r.editorial_completeness === "complete");

      const out: Row[] = [];
      for (const r of complete as any[]) {
        const nexus = Array.isArray(r.nexus_refs) ? r.nexus_refs.length : 0;
        const flags = {
          no_deep: !r.deep_interpretation || String(r.deep_interpretation).trim() === "",
          no_etym: !r.etymology || String(r.etymology).trim() === "",
          no_logos: r.logos_meditation == null,
          no_bib: !r.bibliography || (Array.isArray(r.bibliography) && r.bibliography.length === 0),
          no_faq: !r.faq || (Array.isArray(r.faq) && r.faq.length === 0),
          no_next: !r.next_steps || (Array.isArray(r.next_steps) && r.next_steps.length === 0),
        };
        const issues: string[] = [];
        if (flags.no_deep) issues.push("sem interpretação profunda");
        if (flags.no_etym) issues.push("sem etimologia");
        if (flags.no_logos) issues.push("sem meditação Logos");
        if (flags.no_bib) issues.push("sem bibliografia");
        if (flags.no_faq) issues.push("sem FAQ");
        if (flags.no_next) issues.push("sem próximos passos");
        if (nexus < GOLD_MIN) issues.push(`Nexus ${nexus}/${GOLD_MIN}`);

        if (issues.length > 0) {
          out.push({
            slug: r.slug,
            term: r.term,
            status: r.status,
            editorial_completeness: r.editorial_completeness,
            ...flags,
            nexus_count: nexus,
            issues,
          });
        }
      }

      setRows(out);
      setTotals({
        published: published.length,
        complete: complete.length,
        broken: out.length,
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const integrity = useMemo(() => {
    if (totals.complete === 0) return 100;
    return Math.round(((totals.complete - totals.broken) / totals.complete) * 1000) / 10;
  }, [totals]);

  const generateOne = useCallback(async (slug: string) => {
    setBusySlug(slug);
    try {
      const { data, error } = await supabase.functions.invoke("glossary-generate-deep", {
        body: { slug },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`${slug}: interpretação gerada (${(data as any)?.chars} caracteres). Verbete voltou para rascunho.`);
      await load();
    } catch (e: any) {
      toast.error(`${slug}: ${e?.message ?? String(e)}`);
    } finally {
      setBusySlug(null);
    }
  }, [load]);

  const generateAll = useCallback(async () => {
    const targets = rows.filter(r => r.no_deep).map(r => r.slug);
    if (targets.length === 0) {
      toast.info("Nenhum verbete sem interpretação profunda.");
      return;
    }
    if (!confirm(`Gerar interpretação profunda para ${targets.length} verbetes via Logos AI? Todos voltam para rascunho.`)) return;

    setBatchRunning(true);
    let ok = 0, fail = 0;
    for (const slug of targets) {
      setBusySlug(slug);
      try {
        const { data, error } = await supabase.functions.invoke("glossary-generate-deep", {
          body: { slug },
        });
        if (error || (data as any)?.error) throw new Error(error?.message ?? (data as any)?.error);
        ok += 1;
      } catch (e: any) {
        console.error(`[batch] ${slug}:`, e);
        fail += 1;
      }
      // pequeno delay para respeitar rate limit
      await new Promise(r => setTimeout(r, 800));
    }
    setBusySlug(null);
    setBatchRunning(false);
    toast[fail === 0 ? "success" : "warning"](
      `Batch concluído · ${ok} ok · ${fail} falha(s). Revise em /admin/glossario antes de republicar.`,
    );
    await load();
  }, [rows, load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Helmet>
        <title>Integridade Editorial · Cathedra Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Cathedra Index
        </p>
        <h1 className="text-3xl font-serif">Integridade Editorial</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Verbetes marcados como <code>complete</code> mas com campos obrigatórios vazios ou
          padrão Nexus Ouro (≥ {GOLD_MIN}) não atingido.
        </p>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">Erro: {error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Summary label="Publicados" value={totals.published} />
            <Summary label="Marcados complete" value={totals.complete} />
            <Summary
              label="Com inconsistência"
              value={totals.broken}
              tone={totals.broken === 0 ? "ok" : "warn"}
            />
            <Summary
              label="Integridade"
              value={`${integrity}%`}
              tone={integrity >= 95 ? "ok" : integrity >= 80 ? "warn" : "bad"}
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {rows.length} verbete(s) precisam de revisão.
            </p>
            <Button
              onClick={generateAll}
              disabled={batchRunning || rows.filter(r => r.no_deep).length === 0}
            >
              {batchRunning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Gerar todos ({rows.filter(r => r.no_deep).length}) via Logos AI</>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {rows.length === 0 && (
              <Card>
                <CardContent className="flex items-center gap-3 py-6 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Nenhuma inconsistência — todos os verbetes complete estão íntegros.</span>
                </CardContent>
              </Card>
            )}
            {rows.map(r => (
              <Card key={r.slug}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                      <Link to={`/glossario/${r.slug}`} className="hover:underline">
                        {r.term}
                      </Link>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-[10px]">
                        {r.editorial_completeness}
                      </Badge>
                    </CardTitle>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.issues.map(iss => (
                        <Badge key={iss} variant="secondary" className="text-[10px]">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {iss}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {r.no_deep && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busySlug === r.slug || batchRunning}
                        onClick={() => generateOne(r.slug)}
                      >
                        {busySlug === r.slug ? (
                          <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Gerando…</>
                        ) : (
                          <><Sparkles className="mr-2 h-3 w-3" /> Gerar via IA</>
                        )}
                      </Button>
                    )}
                    <Link
                      to={`/admin/glossario?slug=${r.slug}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      editar manualmente →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4 text-[11px]">
                    <Field ok={!r.no_deep} label="Interpretação profunda" />
                    <Field ok={!r.no_etym} label="Etimologia" />
                    <Field ok={!r.no_bib} label="Bibliografia" />
                    <Field ok={!r.no_faq} label="FAQ" />
                    <Field ok={!r.no_next} label="Próximos passos" />
                    <Field ok={!r.no_logos} label="Meditação Logos" />
                    <Field
                      ok={r.nexus_count >= GOLD_MIN}
                      label={`Nexus ${r.nexus_count}/${GOLD_MIN}`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Summary({
  label, value, tone = "neutral",
}: { label: string; value: string | number; tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const cls =
    tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5"
    : tone === "warn" ? "border-amber-500/30 bg-amber-500/5"
    : tone === "bad" ? "border-red-500/30 bg-red-500/5"
    : "border-border";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Field({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 rounded border px-2 py-1 ${
      ok ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700" : "border-amber-500/30 bg-amber-500/5 text-amber-700"
    }`}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  );
}
