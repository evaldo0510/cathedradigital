import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Upload, RefreshCw, Filter, Loader2 } from "lucide-react";

// -------- Types --------
interface CoverageRow {
  book_abbr: string;
  book_name: string;
  testament: string | null;
  chapters_count: number;
  chapter: number;
  connections_count: number;
  is_empty: boolean;
}

interface Contribution {
  id: string;
  user_id: string | null;
  book_abbr: string;
  chapter: number;
  verse: number | null;
  connection_type: string;
  reference_title: string;
  reference_id: string | null;
  summary: string;
  contributor_notes: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface Connection {
  id: string;
  verse_id: string;
  book_abbr: string | null;
  chapter: number | null;
  verse: number | null;
  category: string;
  reference_title: string;
  reference_id: string | null;
  summary: string | null;
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  editor_notes: string | null;
}

interface ImportBatch {
  id: string;
  source: string;
  filename: string | null;
  total_rows: number;
  inserted_rows: number;
  skipped_rows: number;
  error_rows: number;
  errors: unknown;
  notes: string | null;
  created_at: string;
}

// -------- CSV / JSON parser --------
type ParsedRow = {
  book_abbr: string;
  chapter: number;
  verse?: number | null;
  category: string;
  reference_title: string;
  reference_id?: string | null;
  summary?: string | null;
};

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const iBook = idx("book_abbr");
  const iCh = idx("chapter");
  const iVs = idx("verse");
  const iCat = idx("category");
  const iRefT = idx("reference_title");
  const iRefI = idx("reference_id");
  const iSum = idx("summary");
  if (iBook < 0 || iCh < 0 || iCat < 0 || iRefT < 0) {
    throw new Error("CSV precisa das colunas: book_abbr, chapter, category, reference_title");
  }
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // CSV mínimo (sem aspas escapadas complexas)
    const cells = lines[i].split(",").map((c) => c.trim());
    const chapter = Number(cells[iCh]);
    if (!cells[iBook] || !Number.isFinite(chapter)) continue;
    rows.push({
      book_abbr: cells[iBook],
      chapter,
      verse: iVs >= 0 && cells[iVs] ? Number(cells[iVs]) : null,
      category: cells[iCat] || "cross_ref",
      reference_title: cells[iRefT] || "",
      reference_id: iRefI >= 0 ? cells[iRefI] || null : null,
      summary: iSum >= 0 ? cells[iSum] || null : null,
    });
  }
  return rows;
}

function parseJson(text: string): ParsedRow[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON deve ser um array de objetos");
  return data.map((d: Record<string, unknown>) => ({
    book_abbr: String(d.book_abbr),
    chapter: Number(d.chapter),
    verse: d.verse != null ? Number(d.verse) : null,
    category: String(d.category ?? "cross_ref"),
    reference_title: String(d.reference_title ?? ""),
    reference_id: d.reference_id != null ? String(d.reference_id) : null,
    summary: d.summary != null ? String(d.summary) : null,
  })).filter((r) => r.book_abbr && Number.isFinite(r.chapter) && r.reference_title);
}

// -------- Component --------
export default function NexusAdmin() {
  const [tab, setTab] = useState("overview");

  // Coverage
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const [testamentFilter, setTestamentFilter] = useState<string>("all");

  // Contributions
  const [contribs, setContribs] = useState<Contribution[]>([]);
  const [contribsLoading, setContribsLoading] = useState(false);
  const [contribStatus, setContribStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [reviewerNotes, setReviewerNotes] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  // Connections (log)
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Import
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [importFilename, setImportFilename] = useState<string>("");
  const [importNotes, setImportNotes] = useState("");
  const [importing, setImporting] = useState(false);
  const [batches, setBatches] = useState<ImportBatch[]>([]);

  // ---------- Loaders ----------
  const loadCoverage = useCallback(async () => {
    setCoverageLoading(true);
    const { data, error } = await supabase
      .from("nexus_chapter_coverage")
      .select("*")
      .order("book_abbr", { ascending: true })
      .order("chapter", { ascending: true })
      .limit(2000);
    if (error) toast.error("Falha ao carregar cobertura: " + error.message);
    else setCoverage((data ?? []) as CoverageRow[]);
    setCoverageLoading(false);
  }, []);

  const loadContribs = useCallback(async () => {
    setContribsLoading(true);
    const { data, error } = await supabase
      .from("nexus_contributions")
      .select("*")
      .eq("status", contribStatus)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Falha ao carregar sugestões: " + error.message);
    else setContribs((data ?? []) as Contribution[]);
    setContribsLoading(false);
  }, [contribStatus]);

  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    let q = supabase
      .from("bible_connections")
      .select("id,verse_id,book_abbr,chapter,verse,category,reference_title,reference_id,summary,source,created_by,created_at,updated_at,editor_notes")
      .order("created_at", { ascending: false })
      .limit(100);
    if (sourceFilter !== "all") q = q.eq("source", sourceFilter);
    const { data, error } = await q;
    if (error) toast.error("Falha ao carregar conexões: " + error.message);
    else setConnections((data ?? []) as Connection[]);
    setConnectionsLoading(false);
  }, [sourceFilter]);

  const loadBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from("nexus_import_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) toast.error("Falha ao carregar lotes: " + error.message);
    else setBatches((data ?? []) as ImportBatch[]);
  }, []);

  useEffect(() => { loadCoverage(); loadBatches(); }, [loadCoverage, loadBatches]);
  useEffect(() => { if (tab === "review") loadContribs(); }, [tab, loadContribs]);
  useEffect(() => { if (tab === "log") loadConnections(); }, [tab, loadConnections]);

  // ---------- Derived ----------
  const stats = useMemo(() => {
    const totalChapters = coverage.length;
    const emptyChapters = coverage.filter((r) => r.is_empty).length;
    const coveredChapters = totalChapters - emptyChapters;
    const totalConnections = coverage.reduce((s, r) => s + r.connections_count, 0);
    const percent = totalChapters === 0 ? 0 : Math.round((coveredChapters / totalChapters) * 100);
    return { totalChapters, emptyChapters, coveredChapters, totalConnections, percent };
  }, [coverage]);

  const coverageFiltered = useMemo(() => {
    return coverage.filter((r) => {
      if (onlyEmpty && !r.is_empty) return false;
      if (testamentFilter !== "all" && r.testament !== testamentFilter) return false;
      return true;
    });
  }, [coverage, onlyEmpty, testamentFilter]);

  // ---------- Actions ----------
  const approve = async (id: string) => {
    setActingId(id);
    const { error } = await supabase.rpc("approve_nexus_contribution", {
      _contribution_id: id,
      _reviewer_notes: reviewerNotes[id] ?? null,
    });
    if (error) toast.error("Erro ao aprovar: " + error.message);
    else { toast.success("Contribuição aprovada e publicada"); await loadContribs(); await loadCoverage(); }
    setActingId(null);
  };

  const reject = async (id: string) => {
    setActingId(id);
    const { error } = await supabase.rpc("reject_nexus_contribution", {
      _contribution_id: id,
      _reviewer_notes: reviewerNotes[id] ?? null,
    });
    if (error) toast.error("Erro ao rejeitar: " + error.message);
    else { toast.success("Contribuição rejeitada"); await loadContribs(); }
    setActingId(null);
  };

  const runImport = async () => {
    if (!importText.trim()) { toast.error("Cole o conteúdo do arquivo antes de importar"); return; }
    setImporting(true);
    const errors: Array<{ row: number; error: string }> = [];
    let rows: ParsedRow[] = [];
    try {
      rows = importFormat === "csv" ? parseCsv(importText) : parseJson(importText);
    } catch (e) {
      toast.error("Falha ao parsear: " + (e as Error).message);
      setImporting(false); return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;

    // 1) Cria lote
    const { data: batchRow, error: batchErr } = await supabase
      .from("nexus_import_batches")
      .insert({
        source: importFormat,
        filename: importFilename || null,
        total_rows: rows.length,
        inserted_rows: 0, skipped_rows: 0, error_rows: 0,
        notes: importNotes || null,
        created_by: uid,
      })
      .select().single();
    if (batchErr || !batchRow) {
      toast.error("Falha ao criar lote: " + (batchErr?.message ?? "sem retorno"));
      setImporting(false); return;
    }

    // 2) Insere em chunks
    let inserted = 0, skipped = 0;
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize).map((r, j) => ({
        verse_id: `${r.book_abbr}-${r.chapter}-${r.verse ?? 1}`,
        book_abbr: r.book_abbr,
        chapter: r.chapter,
        verse: r.verse ?? null,
        category: r.category,
        reference_title: r.reference_title,
        reference_id: r.reference_id ?? null,
        summary: r.summary ?? null,
        source: importFormat,
        source_batch_id: batchRow.id,
        created_by: uid,
        updated_by: uid,
      }));
      const { error, count } = await supabase
        .from("bible_connections")
        .insert(chunk, { count: "exact" });
      if (error) {
        errors.push({ row: i, error: error.message });
        skipped += chunk.length;
      } else {
        inserted += count ?? chunk.length;
      }
    }

    await supabase.from("nexus_import_batches").update({
      inserted_rows: inserted,
      skipped_rows: skipped,
      error_rows: errors.length,
      errors: errors.length ? errors : null,
    }).eq("id", batchRow.id);

    toast.success(`Import concluído: ${inserted} inseridos · ${skipped} pulados · ${errors.length} erros`);
    setImportText("");
    setImportFilename("");
    setImportNotes("");
    setImporting(false);
    await loadBatches();
    await loadCoverage();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    setImportText(txt);
    setImportFilename(f.name);
    setImportFormat(f.name.toLowerCase().endsWith(".json") ? "json" : "csv");
  };

  // ---------- Render ----------
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Helmet>
        <title>Admin · Nexus Theologicus | Cathedra</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="mb-8">
        <h1 className="font-display text-3xl text-primary mb-1">Nexus Theologicus · Admin</h1>
        <p className="text-sm text-primary/60">
          Cobertura de conexões Bíblia ↔ Catecismo, revisão de sugestões e importação de dados oficiais.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-primary/50">Capítulos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{stats.totalChapters}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-primary/50">Com Nexus</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-emerald-600">{stats.coveredChapters}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-primary/50">Sem Nexus</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-amber-600">{stats.emptyChapters}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-primary/50">Total conexões</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{stats.totalConnections}</div></CardContent></Card>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2 text-xs text-primary/60">
          <span>Cobertura global</span><span>{stats.percent}%</span>
        </div>
        <Progress value={stats.percent} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Cobertura</TabsTrigger>
          <TabsTrigger value="review">Sugestões</TabsTrigger>
          <TabsTrigger value="import">Importar CSV/JSON</TabsTrigger>
          <TabsTrigger value="log">Log de conexões</TabsTrigger>
        </TabsList>

        {/* ---------- Coverage ---------- */}
        <TabsContent value="overview" className="mt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button size="sm" variant={onlyEmpty ? "default" : "outline"} onClick={() => setOnlyEmpty((v) => !v)}>
              <Filter className="w-4 h-4 mr-2" /> {onlyEmpty ? "Apenas vazios" : "Todos"}
            </Button>
            <select className="text-sm rounded-md border px-3 py-1.5 bg-background"
              value={testamentFilter} onChange={(e) => setTestamentFilter(e.target.value)}>
              <option value="all">Ambos testamentos</option>
              <option value="AT">Antigo Testamento</option>
              <option value="NT">Novo Testamento</option>
            </select>
            <Button size="sm" variant="ghost" onClick={loadCoverage}>
              <RefreshCw className={`w-4 h-4 mr-2 ${coverageLoading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <span className="text-xs text-primary/50 ml-auto">
              Exibindo {coverageFiltered.length} capítulos
            </span>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Livro</TableHead>
                      <TableHead className="w-20">Cap.</TableHead>
                      <TableHead className="w-28">Conexões</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverageFiltered.map((r) => (
                      <TableRow key={`${r.book_abbr}-${r.chapter}`}>
                        <TableCell className="font-medium">{r.book_name} <span className="text-primary/40 text-xs">({r.book_abbr})</span></TableCell>
                        <TableCell>{r.chapter}</TableCell>
                        <TableCell>{r.connections_count}</TableCell>
                        <TableCell>
                          {r.is_empty
                            ? <Badge variant="outline" className="text-amber-700 border-amber-500/40">vazio</Badge>
                            : <Badge className="bg-emerald-600/10 text-emerald-700">ok</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!coverageLoading && coverageFiltered.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-primary/50">Nenhum capítulo neste filtro.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Review ---------- */}
        <TabsContent value="review" className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            {(["pending", "approved", "rejected"] as const).map((s) => (
              <Button key={s} size="sm" variant={contribStatus === s ? "default" : "outline"} onClick={() => setContribStatus(s)}>
                {s === "pending" ? "Pendentes" : s === "approved" ? "Aprovadas" : "Rejeitadas"}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={loadContribs} className="ml-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${contribsLoading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          </div>
          <div className="space-y-3">
            {contribs.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{c.reference_title}</CardTitle>
                      <div className="text-xs text-primary/60 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>📖 {c.book_abbr} {c.chapter}{c.verse ? `:${c.verse}` : ""}</span>
                        <span>🏷 {c.connection_type}</span>
                        {c.reference_id && <span>🔗 {c.reference_id}</span>}
                        <span>⏱ {new Date(c.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-primary/80">{c.summary}</p>
                  {c.contributor_notes && (
                    <p className="text-xs text-primary/60 italic">Nota do contribuidor: {c.contributor_notes}</p>
                  )}
                  {contribStatus === "pending" && (
                    <div className="pt-2 border-t space-y-2">
                      <Label htmlFor={`rn-${c.id}`} className="text-xs">Notas do revisor (opcional)</Label>
                      <Textarea id={`rn-${c.id}`} rows={2}
                        value={reviewerNotes[c.id] ?? ""}
                        onChange={(e) => setReviewerNotes((s) => ({ ...s, [c.id]: e.target.value }))} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approve(c.id)} disabled={actingId === c.id}>
                          {actingId === c.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          Aprovar e publicar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reject(c.id)} disabled={actingId === c.id}>
                          <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}
                  {c.reviewer_notes && contribStatus !== "pending" && (
                    <p className="text-xs text-primary/60 pt-2 border-t">Revisor: {c.reviewer_notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {!contribsLoading && contribs.length === 0 && (
              <p className="text-center text-sm text-primary/50 py-8">Nenhuma sugestão neste filtro.</p>
            )}
          </div>
        </TabsContent>

        {/* ---------- Import ---------- */}
        <TabsContent value="import" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Importar conexões oficiais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-primary/60">
                Formato CSV com cabeçalho: <code>book_abbr,chapter,verse,category,reference_title,reference_id,summary</code>.
                JSON: array de objetos com as mesmas chaves.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile}
                  className="text-sm" />
                <select className="text-sm rounded-md border px-3 py-1.5 bg-background"
                  value={importFormat} onChange={(e) => setImportFormat(e.target.value as "csv" | "json")}>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
                {importFilename && <span className="text-xs text-primary/60">📎 {importFilename}</span>}
              </div>
              <div>
                <Label htmlFor="import-text" className="text-xs">Conteúdo</Label>
                <Textarea id="import-text" rows={10} className="font-mono text-xs"
                  placeholder={importFormat === "csv"
                    ? "book_abbr,chapter,verse,category,reference_title,reference_id,summary\nJo,3,16,catechism,CIC §458,458,Deus amou o mundo..."
                    : '[\n  { "book_abbr": "Jo", "chapter": 3, "verse": 16, "category": "catechism", "reference_title": "CIC §458", "reference_id": "458", "summary": "..." }\n]'}
                  value={importText} onChange={(e) => setImportText(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="import-notes" className="text-xs">Notas do lote (opcional)</Label>
                <Input id="import-notes" value={importNotes} onChange={(e) => setImportNotes(e.target.value)}
                  placeholder="Ex: Índice oficial CIC-Escritura, edição 2ª típica" />
              </div>
              <Button onClick={runImport} disabled={importing || !importText.trim()}>
                {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Executar import
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Últimos lotes</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Inseridos</TableHead>
                    <TableHead className="text-right">Pulados</TableHead>
                    <TableHead className="text-right">Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="text-xs">{new Date(b.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell><Badge variant="outline">{b.source}</Badge></TableCell>
                      <TableCell className="text-xs">{b.filename ?? "—"}</TableCell>
                      <TableCell className="text-right">{b.total_rows}</TableCell>
                      <TableCell className="text-right text-emerald-600">{b.inserted_rows}</TableCell>
                      <TableCell className="text-right text-amber-600">{b.skipped_rows}</TableCell>
                      <TableCell className="text-right text-red-600">{b.error_rows}</TableCell>
                    </TableRow>
                  ))}
                  {batches.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-6 text-primary/50 text-sm">Nenhum lote ainda.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Log ---------- */}
        <TabsContent value="log" className="mt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select className="text-sm rounded-md border px-3 py-1.5 bg-background"
              value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="all">Todas as origens</option>
              <option value="manual">Manual</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="seed">Seed</option>
              <option value="contribution">Contribuição</option>
              <option value="official">Oficial</option>
              <option value="ai">AI</option>
            </select>
            <Button size="sm" variant="ghost" onClick={loadConnections}>
              <RefreshCw className={`w-4 h-4 mr-2 ${connectionsLoading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Referência</TableHead>
                      <TableHead>Passagem</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Criado por</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connections.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium max-w-xs truncate">{c.reference_title}</TableCell>
                        <TableCell className="text-xs">{c.book_abbr ?? c.verse_id}{c.chapter ? ` ${c.chapter}` : ""}{c.verse ? `:${c.verse}` : ""}</TableCell>
                        <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                        <TableCell><Badge>{c.source}</Badge></TableCell>
                        <TableCell className="text-xs text-primary/60 font-mono">{c.created_by?.slice(0, 8) ?? "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                    {!connectionsLoading && connections.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-primary/50">Nenhuma conexão nesta origem.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
