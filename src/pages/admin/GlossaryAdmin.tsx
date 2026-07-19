import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Plus, Save, Send, Trash2, ExternalLink, ArrowLeft,
  Eye, EyeOff, Check, AlertCircle, Search, ChevronUp, ChevronDown, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import GlossaryTermPreview, { type GlossaryPreviewData } from "@/components/admin/GlossaryTermPreview";
import { useDebounce } from "@/hooks/useDebounce";
import { useDocumentSearch } from "@/hooks/useDocumentSearch";

type Status = "draft" | "review" | "published";

interface GlossaryTerm {
  id: string;
  term: string;
  slug: string | null;
  category: string | null;
  language: string;
  status: Status;
  published_at: string | null;
  updated_at: string;
  definition: string;
  interpretation: string | null;
  practical_application: string | null;
  bible_verses: string[] | null;
  catechism_references: string[] | null;
  magisterium_references: string[] | null;
  saints_refs: string[] | null;
  fathers_refs: string[] | null;
  prayer_refs: string[] | null;
  journey_refs: string[] | null;
  nexus_refs: unknown;
}

const EMPTY: Partial<GlossaryTerm> = {
  term: "",
  slug: "",
  category: "",
  language: "pt",
  status: "draft",
  definition: "",
  interpretation: "",
  practical_application: "",
  bible_verses: [],
  catechism_references: [],
  magisterium_references: [],
  saints_refs: [],
  fathers_refs: [],
  prayer_refs: [],
  journey_refs: [],
  nexus_refs: [],
};

function slugify(s: string) {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseList(v: string): string[] {
  return v.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
}
function joinList(v: string[] | null | undefined) {
  return (v ?? []).join("\n");
}

const STATUS_BADGE: Record<Status, { label: string; variant: "secondary" | "outline" | "default" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  review: { label: "Em revisão", variant: "secondary" },
  published: { label: "Publicado", variant: "default" },
};

const DRAFT_KEY = (id: string | null) => `glossary-admin-draft:${id ?? "new"}`;

// 11 campos editoriais obrigatórios para publicação
type FieldId =
  | "definition" | "interpretation" | "practical_application"
  | "bible_verses" | "catechism_references" | "magisterium_references"
  | "saints_refs" | "fathers_refs" | "journey_refs" | "prayer_refs" | "nexus_refs";

const REQUIRED_FIELDS: { id: FieldId; label: string; kind: "text" | "list" | "json" }[] = [
  { id: "definition", label: "1. Definição", kind: "text" },
  { id: "interpretation", label: "2. Interpretação", kind: "text" },
  { id: "practical_application", label: "3. Aplicação prática", kind: "text" },
  { id: "bible_verses", label: "4. Bíblia", kind: "list" },
  { id: "catechism_references", label: "5. Catecismo", kind: "list" },
  { id: "magisterium_references", label: "6. Magistério", kind: "list" },
  { id: "saints_refs", label: "7. Santos", kind: "list" },
  { id: "fathers_refs", label: "8. Padres da Igreja", kind: "list" },
  { id: "journey_refs", label: "9. Jornada", kind: "list" },
  { id: "prayer_refs", label: "10. Oração", kind: "list" },
  { id: "nexus_refs", label: "11. Nexus", kind: "json" },
];

function isFieldFilled(form: Partial<GlossaryTerm>, f: (typeof REQUIRED_FIELDS)[number]): boolean {
  const v = (form as any)[f.id];
  if (f.kind === "text") return typeof v === "string" && v.trim().length > 0;
  if (f.kind === "list") return Array.isArray(v) && v.length > 0;
  if (f.kind === "json") return Array.isArray(v) && v.length > 0;
  return false;
}

export default function GlossaryAdmin() {
  const [items, setItems] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<GlossaryTerm>>(EMPTY);
  const [showPreview, setShowPreview] = useState(true);
  const [autosavedAt, setAutosavedAt] = useState<Date | null>(null);
  const [previewQuery, setPreviewQuery] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("glossary")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Erro ao carregar glossário: " + error.message);
    else setItems((data ?? []) as GlossaryTerm[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      i.term.toLowerCase().includes(q) ||
      (i.slug ?? "").toLowerCase().includes(q) ||
      (i.category ?? "").toLowerCase().includes(q)
    );
  }, [items, filter]);

  // ---- Autosave (localStorage) ----
  const debouncedForm = useDebounce(form, 800);
  const skipNextAutosave = useRef(true);
  useEffect(() => {
    // não autosalvar imediatamente ao trocar de seleção
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    try {
      localStorage.setItem(DRAFT_KEY(selectedId), JSON.stringify({
        savedAt: new Date().toISOString(),
        form: debouncedForm,
      }));
      setAutosavedAt(new Date());
    } catch { /* quota */ }
  }, [debouncedForm, selectedId]);

  const restoreDraftFor = (id: string | null, fallback: Partial<GlossaryTerm>) => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY(id));
      if (raw) {
        const parsed = JSON.parse(raw) as { savedAt: string; form: Partial<GlossaryTerm> };
        if (parsed?.form) {
          setAutosavedAt(new Date(parsed.savedAt));
          return parsed.form;
        }
      }
    } catch { /* ignore */ }
    setAutosavedAt(null);
    return fallback;
  };

  const select = (row: GlossaryTerm) => {
    skipNextAutosave.current = true;
    setSelectedId(row.id);
    setForm(restoreDraftFor(row.id, row));
  };

  const startNew = () => {
    skipNextAutosave.current = true;
    setSelectedId(null);
    setForm(restoreDraftFor(null, EMPTY));
  };

  const patch = <K extends keyof GlossaryTerm>(key: K, value: GlossaryTerm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // ---- Validação dos 11 campos ----
  const fieldChecks = useMemo(
    () => REQUIRED_FIELDS.map((f) => ({ ...f, ok: isFieldFilled(form, f) })),
    [form],
  );
  const missingFields = fieldChecks.filter((f) => !f.ok);
  const canPublish =
    (form.term?.trim().length ?? 0) > 0 &&
    missingFields.length === 0;

  const save = async (publish = false) => {
    if (!form.term?.trim()) return toast.error("Termo é obrigatório");
    if (publish && !canPublish) {
      return toast.error(
        `Não é possível publicar: ${missingFields.length} campo(s) obrigatório(s) pendentes.`,
      );
    }

    setSaving(true);
    const slug = (form.slug?.trim() || slugify(form.term));
    const payload: any = {
      term: form.term.trim(),
      slug,
      category: form.category?.trim() || null,
      language: form.language || "pt",
      definition: form.definition,
      interpretation: form.interpretation || null,
      practical_application: form.practical_application || null,
      bible_verses: form.bible_verses ?? [],
      catechism_references: form.catechism_references ?? [],
      magisterium_references: form.magisterium_references ?? [],
      saints_refs: form.saints_refs ?? [],
      fathers_refs: form.fathers_refs ?? [],
      prayer_refs: form.prayer_refs ?? [],
      journey_refs: form.journey_refs ?? [],
      nexus_refs: form.nexus_refs ?? [],
      status: publish ? "published" : (form.status || "draft"),
      published_at: publish ? new Date().toISOString() : (form.published_at ?? null),
    };

    let res;
    if (selectedId) {
      res = await supabase.from("glossary").update(payload).eq("id", selectedId).select().single();
    } else {
      res = await supabase.from("glossary").insert(payload).select().single();
    }
    setSaving(false);
    if (res.error) return toast.error("Erro ao salvar: " + res.error.message);
    toast.success(publish ? "Verbete publicado" : "Verbete salvo");
    const saved = res.data as GlossaryTerm;
    // limpa rascunho local após persistir
    try {
      localStorage.removeItem(DRAFT_KEY(selectedId));
      if (!selectedId) localStorage.removeItem(DRAFT_KEY(null));
    } catch { /* ignore */ }
    skipNextAutosave.current = true;
    setForm(saved);
    setSelectedId(saved.id);
    setAutosavedAt(null);
    void load();
  };

  const remove = async () => {
    if (!selectedId) return;
    if (!confirm("Excluir este verbete? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("glossary").delete().eq("id", selectedId);
    if (error) return toast.error("Erro ao excluir: " + error.message);
    try { localStorage.removeItem(DRAFT_KEY(selectedId)); } catch { /* ignore */ }
    toast.success("Verbete excluído");
    startNew();
    void load();
  };

  const nexusText = useMemo(() => {
    try { return JSON.stringify(form.nexus_refs ?? [], null, 2); }
    catch { return "[]"; }
  }, [form.nexus_refs]);

  const previewData: GlossaryPreviewData = useMemo(() => ({
    term: form.term ?? "",
    category: form.category ?? null,
    definition: form.definition ?? "",
    interpretation: form.interpretation ?? null,
    practical_application: form.practical_application ?? null,
    bible_verses: form.bible_verses ?? [],
    catechism_references: form.catechism_references ?? [],
    magisterium_references: form.magisterium_references ?? [],
    saints_refs: form.saints_refs ?? [],
    fathers_refs: form.fathers_refs ?? [],
    prayer_refs: form.prayer_refs ?? [],
    journey_refs: form.journey_refs ?? [],
    nexus_refs: (form.nexus_refs as any) ?? [],
  }), [form]);

  // Busca dentro do preview
  const previewSearch = useDocumentSearch(previewRef, previewQuery, previewData);

  const openInNewTab = () => {
    const slug = form.slug?.trim() || (form.term ? slugify(form.term) : "");
    if (!slug) return toast.error("Defina um termo/slug antes de abrir o preview.");
    window.open(`/glossario/${slug}?preview=1`, "_blank", "noopener,noreferrer");
  };

  const autosavedLabel = autosavedAt
    ? `Rascunho salvo às ${autosavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : "Alterações não salvas localmente";

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Helmet><title>Admin — Léxico Teológico</title></Helmet>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/admin" className="inline-flex items-center gap-1 hover:underline">
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <span>/</span><span>Léxico</span>
          </div>
          <h1 className="text-2xl font-semibold mt-1">Léxico Teológico</h1>
          <p className="text-sm text-muted-foreground">Criar, editar e publicar verbetes do glossário.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
            title={showPreview ? "Ocultar preview" : "Mostrar preview"}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? "Ocultar preview" : "Mostrar preview"}
          </Button>
          <Button variant="outline" onClick={openInNewTab} title="Abrir preview em nova aba">
            <ExternalLink className="h-4 w-4 mr-2" />Nova aba
          </Button>
          <Button onClick={startNew} variant="secondary"><Plus className="h-4 w-4 mr-2" />Novo verbete</Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showPreview ? "lg:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]" : "lg:grid-cols-[380px_1fr]"}`}>

        {/* Lista */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Verbetes ({items.length})</CardTitle>
            <Input
              placeholder="Buscar por termo, slug ou categoria…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent className="p-0 max-h-[70vh] overflow-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando…
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Termo</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      className={`cursor-pointer ${selectedId === row.id ? "bg-muted/60" : ""}`}
                      onClick={() => select(row)}
                    >
                      <TableCell>
                        <div className="font-medium">{row.term}</div>
                        <div className="text-xs text-muted-foreground">{row.slug ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[row.status].variant}>{STATUS_BADGE[row.status].label}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-6">Nenhum verbete.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">{selectedId ? "Editar verbete" : "Novo verbete"}</CardTitle>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {form.slug && (
                  <a
                    href={`/glossario/${form.slug}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:underline"
                  >
                    /glossario/{form.slug} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Save className="h-3 w-3" />{autosavedLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedId && (
                <Button variant="ghost" size="sm" onClick={remove} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />Excluir
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => save(false)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
              <Button
                size="sm"
                onClick={() => save(true)}
                disabled={saving || !canPublish}
                title={canPublish ? "Publicar verbete" : `${missingFields.length} campo(s) pendentes`}
              >
                <Send className="h-4 w-4 mr-1" />Publicar
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Checklist de publicação */}
            <div className={`rounded-md border p-3 text-sm ${canPublish ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
              <div className="flex items-center gap-2 font-medium">
                {canPublish
                  ? <><Check className="h-4 w-4 text-emerald-600" />Pronto para publicar</>
                  : <><AlertCircle className="h-4 w-4 text-amber-600" />{missingFields.length} de 11 campos pendentes</>}
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {fieldChecks.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-xs">
                    {f.ok
                      ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      : <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                    <span className={f.ok ? "text-muted-foreground" : "text-foreground"}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Termo *</Label>
                <Input
                  value={form.term ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    patch("term", v);
                    if (!selectedId && !form.slug) patch("slug", slugify(v));
                  }}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug ?? ""}
                  onChange={(e) => patch("slug", slugify(e.target.value))}
                  placeholder="ex.: graca"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={form.category ?? ""} onChange={(e) => patch("category", e.target.value)} placeholder="ex.: Dogmática" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status ?? "draft"} onValueChange={(v) => patch("status", v as Status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="review">Em revisão</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 11 seções */}
            <SectionText required label="1. Definição *" value={form.definition ?? ""} onChange={(v) => patch("definition", v)} rows={4} filled={fieldChecks[0].ok} />
            <SectionText required label="2. Interpretação *" value={form.interpretation ?? ""} onChange={(v) => patch("interpretation", v)} rows={5} filled={fieldChecks[1].ok} />
            <SectionText required label="3. Aplicação prática *" value={form.practical_application ?? ""} onChange={(v) => patch("practical_application", v)} rows={4} filled={fieldChecks[2].ok} />

            <SectionList required filled={fieldChecks[3].ok} label="4. Bíblia *" hint="Uma referência por linha (ex.: Jo 3,16)" value={form.bible_verses} onChange={(v) => patch("bible_verses", v)} />
            <SectionList required filled={fieldChecks[4].ok} label="5. Catecismo *" hint="Parágrafos do CIC (ex.: 1996, 1997)" value={form.catechism_references} onChange={(v) => patch("catechism_references", v)} />
            <SectionList required filled={fieldChecks[5].ok} label="6. Magistério *" hint="Documentos citados" value={form.magisterium_references} onChange={(v) => patch("magisterium_references", v)} />
            <SectionList required filled={fieldChecks[6].ok} label="7. Santos *" hint="Slugs ou nomes de santos" value={form.saints_refs} onChange={(v) => patch("saints_refs", v)} />
            <SectionList required filled={fieldChecks[7].ok} label="8. Padres da Igreja *" hint="Slugs de padres" value={form.fathers_refs} onChange={(v) => patch("fathers_refs", v)} />
            <SectionList required filled={fieldChecks[8].ok} label="9. Jornada *" hint="UUIDs de jornadas relacionadas" value={form.journey_refs} onChange={(v) => patch("journey_refs", v)} />
            <SectionList required filled={fieldChecks[9].ok} label="10. Oração *" hint="Slugs de orações" value={form.prayer_refs} onChange={(v) => patch("prayer_refs", v)} />

            <div>
              <Label className="flex items-center gap-2">
                11. Nexus (JSON) *
                {fieldChecks[10].ok
                  ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                  : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
              </Label>
              <Textarea
                className={`font-mono text-xs ${fieldChecks[10].ok ? "" : "border-amber-500/50"}`}
                rows={6}
                value={nexusText}
                onChange={(e) => {
                  try { patch("nexus_refs", JSON.parse(e.target.value)); }
                  catch { /* mantém edição livre */ }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Array JSON com relações extras. Ex.: <code>{`[{"type":"catechism-paragraph","id":"1996"}]`}</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview em tempo real */}
        {showPreview && (
          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Preview</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Espelha o reader público em tempo real.</p>
                </div>
                <Badge variant="outline" className="uppercase tracking-wider text-[10px]">Ao vivo</Badge>
              </div>
              <div className="mt-3 relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={previewQuery}
                  onChange={(e) => setPreviewQuery(e.target.value)}
                  placeholder="Buscar no preview…"
                  className="pl-7 pr-24 h-8 text-xs"
                  aria-label="Buscar no preview"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  {previewQuery.trim().length >= 2 && (
                    <span className="text-[10px] text-muted-foreground mr-1 tabular-nums">
                      {previewSearch.total > 0 ? `${previewSearch.current}/${previewSearch.total}` : "0"}
                    </span>
                  )}
                  <Button
                    type="button" size="icon" variant="ghost" className="h-6 w-6"
                    onClick={previewSearch.goPrev} disabled={previewSearch.total === 0}
                    aria-label="Ocorrência anterior"
                  ><ChevronUp className="h-3.5 w-3.5" /></Button>
                  <Button
                    type="button" size="icon" variant="ghost" className="h-6 w-6"
                    onClick={previewSearch.goNext} disabled={previewSearch.total === 0}
                    aria-label="Próxima ocorrência"
                  ><ChevronDown className="h-3.5 w-3.5" /></Button>
                  {previewQuery && (
                    <Button
                      type="button" size="icon" variant="ghost" className="h-6 w-6"
                      onClick={() => setPreviewQuery("")}
                      aria-label="Limpar busca"
                    ><X className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 max-h-[80vh] overflow-auto">
              <div ref={previewRef}>
                <GlossaryTermPreview data={previewData} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SectionText({
  label, value, onChange, rows = 4, filled, required,
}: { label: string; value: string; onChange: (v: string) => void; rows?: number; filled?: boolean; required?: boolean }) {
  return (
    <div>
      <Label className="flex items-center gap-2">
        {label}
        {required && (filled
          ? <Check className="h-3.5 w-3.5 text-emerald-600" />
          : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />)}
      </Label>
      <Textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={required && !filled ? "border-amber-500/50" : ""}
      />
    </div>
  );
}

function SectionList({
  label, hint, value, onChange, filled, required,
}: { label: string; hint?: string; value: string[] | null | undefined; onChange: (v: string[]) => void; filled?: boolean; required?: boolean }) {
  return (
    <div>
      <Label className="flex items-center gap-2">
        {label}
        {required && (filled
          ? <Check className="h-3.5 w-3.5 text-emerald-600" />
          : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />)}
      </Label>
      <Textarea
        rows={3}
        value={joinList(value)}
        onChange={(e) => onChange(parseList(e.target.value))}
        placeholder={hint}
        className={required && !filled ? "border-amber-500/50" : ""}
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
