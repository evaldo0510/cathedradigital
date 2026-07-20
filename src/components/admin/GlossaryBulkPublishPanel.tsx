import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, RefreshCw, AlertCircle, Check } from "lucide-react";
import { useGlossaryRole } from "@/hooks/useGlossaryRole";

interface Row {
  id: string;
  term: string;
  slug: string | null;
  category: string | null;
  editorial_completeness: string | null;
  updated_at: string;
  // 11 campos usados para completude editorial
  definition: string | null;
  interpretation: string | null;
  practical_application: string | null;
  bible_verses: string[] | null;
  catechism_references: string[] | null;
  magisterium_references: string[] | null;
  saints_refs: string[] | null;
  fathers_refs: string[] | null;
  journey_refs: string[] | null;
  prayer_refs: string[] | null;
  nexus_refs: unknown;
}

function isReady(r: Row): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  const t = (v: string | null) => typeof v === "string" && v.trim().length > 0;
  const l = (v: unknown) => Array.isArray(v) && v.length > 0;
  if (!t(r.definition)) missing.push("Definição");
  if (!t(r.interpretation)) missing.push("Interpretação");
  if (!t(r.practical_application)) missing.push("Aplicação");
  if (!l(r.bible_verses)) missing.push("Bíblia");
  if (!l(r.catechism_references)) missing.push("Catecismo");
  if (!l(r.magisterium_references)) missing.push("Magistério");
  if (!l(r.saints_refs)) missing.push("Santos");
  if (!l(r.fathers_refs)) missing.push("Padres");
  if (!l(r.journey_refs)) missing.push("Jornada");
  if (!l(r.prayer_refs)) missing.push("Oração");
  if (!l(r.nexus_refs)) missing.push("Nexus");
  return { ok: missing.length === 0, missing };
}

interface Props {
  onPublished?: () => void;
}

/**
 * Painel de publicação em lote de verbetes do Glossário.
 * - Lista apenas rascunhos com todos os 11 campos preenchidos.
 * - Publica um a um via UPDATE autenticado como revisor/admin
 *   (o trigger `enforce_glossary_publish` valida o papel do usuário atual,
 *   sem necessidade de migração/bypass).
 * - Skip automático de verbetes incompletos.
 */
export default function GlossaryBulkPublishPanel({ onPublished }: Props) {
  const { canPublish } = useGlossaryRole();
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("glossary")
      .select(
        "id, term, slug, category, editorial_completeness, updated_at, definition, interpretation, practical_application, bible_verses, catechism_references, magisterium_references, saints_refs, fathers_refs, journey_refs, prayer_refs, nexus_refs",
      )
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Erro ao listar rascunhos: " + error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enriched = useMemo(
    () => rows.map((r) => ({ row: r, check: isReady(r) })),
    [rows],
  );
  const readyRows = useMemo(() => enriched.filter((e) => e.check.ok), [enriched]);
  const blockedRows = useMemo(() => enriched.filter((e) => !e.check.ok), [enriched]);

  const allReadySelected =
    readyRows.length > 0 && readyRows.every((e) => selected.has(e.row.id));

  const toggleAll = () => {
    if (allReadySelected) setSelected(new Set());
    else setSelected(new Set(readyRows.map((e) => e.row.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const publishSelected = async () => {
    if (!canPublish) {
      toast.error("Sua função não permite publicar verbetes.");
      return;
    }
    const ids = Array.from(selected);
    if (ids.length === 0) {
      toast.error("Selecione ao menos um verbete pronto.");
      return;
    }
    setPublishing(true);
    setProgress({ done: 0, total: ids.length });
    const now = new Date().toISOString();
    let ok = 0;
    const failures: { id: string; term: string; message: string }[] = [];

    for (const id of ids) {
      const row = rows.find((r) => r.id === id);
      const label = row?.term ?? id;
      const { error } = await supabase
        .from("glossary")
        .update({ status: "published", published_at: now })
        .eq("id", id);
      if (error) failures.push({ id, term: label, message: error.message });
      else ok += 1;
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    setPublishing(false);
    setProgress(null);
    setSelected(new Set());
    if (ok > 0) toast.success(`${ok} verbete(s) publicado(s).`);
    if (failures.length > 0) {
      toast.error(
        `${failures.length} falharam: ${failures.slice(0, 3).map((f) => f.term).join(", ")}${failures.length > 3 ? "…" : ""}`,
      );
      console.warn("[glossary bulk publish] falhas:", failures);
    }
    await load();
    onPublished?.();
  };

  if (!canPublish) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base">Publicação em lote</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Publica rascunhos com os 11 campos editoriais preenchidos. O processo respeita o
            trigger de validação — verbetes incompletos são ignorados automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || publishing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Recarregar
          </Button>
          <Button
            size="sm"
            onClick={() => void publishSelected()}
            disabled={publishing || selected.size === 0}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Publicar selecionados ({selected.size})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress && (
          <div className="text-xs text-muted-foreground" aria-live="polite">
            Publicando {progress.done}/{progress.total}…
          </div>
        )}

        <div className="flex items-center gap-3 text-xs">
          <Badge variant="outline">Rascunhos: {rows.length}</Badge>
          <Badge variant="default">Prontos: {readyRows.length}</Badge>
          <Badge variant="secondary">Bloqueados: {blockedRows.length}</Badge>
        </div>

        {/* Prontos */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              id="glossary-bulk-all"
              checked={allReadySelected}
              onCheckedChange={toggleAll}
              disabled={readyRows.length === 0 || publishing}
            />
            <label htmlFor="glossary-bulk-all" className="text-sm font-medium cursor-pointer">
              Selecionar todos os prontos ({readyRows.length})
            </label>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Carregando rascunhos…
            </div>
          ) : readyRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Nenhum rascunho pronto para publicação.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {readyRows.map(({ row }) => (
                <li key={row.id} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={() => toggleOne(row.id)}
                    disabled={publishing}
                    aria-label={`Selecionar ${row.term}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{row.term}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {row.slug ?? "—"} · {row.category ?? "sem categoria"}
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bloqueados */}
        {blockedRows.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Rascunhos incompletos ({blockedRows.length})
            </div>
            <ul className="divide-y rounded-md border">
              {blockedRows.map(({ row, check }) => (
                <li key={row.id} className="px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium truncate">{row.term}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {check.missing.length} pendente(s)
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Falta: {check.missing.join(", ")}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
