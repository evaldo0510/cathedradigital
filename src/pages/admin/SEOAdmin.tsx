import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/cathedra/CathedraCard";
import { CathedraButton as Button } from "@/components/cathedra/CathedraButton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, PlayCircle, ShieldCheck, FileDown, Eye, EyeOff, Save, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AuditRow {
  id: string;
  url: string;
  score: number | null;
  findings: Array<{ type: string; severity: string; message: string }>;
  meta_tags: { title?: string; description?: string; canonical?: string; ogTitle?: string; ogImage?: string; twitterCard?: string; http_status?: number } | null;
  headings: { h1?: string[]; h2_count?: number } | null;
  links: { checked?: number; broken?: Array<{ url: string; status: number }> } | null;
  created_at: string;
}

interface ValidateResult {
  sitemap: {
    url: string;
    http_status: number;
    url_count: number;
    duplicate_count: number;
    invalid_xml: boolean;
    broken_sample: Array<{ url: string; status: number }>;
  };
  robots: {
    url: string;
    http_status: number;
    line_count: number;
    disallow_all: boolean;
    sitemap_directive: string | null;
  };
  checked_at: string;
}

function maskToken(t: string | null | undefined) {
  if (!t) return "";
  if (t.length <= 8) return "•".repeat(t.length);
  return `${t.slice(0, 4)}${"•".repeat(Math.max(4, t.length - 8))}${t.slice(-4)}`;
}

export default function SEOAdmin() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidateResult | null>(null);

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [gscToken, setGscToken] = useState<string>("");
  const [gscInput, setGscInput] = useState<string>("");
  const [showToken, setShowToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);

  const loadAudits = async () => {
    const { data, error } = await supabase
      .from("seo_audits")
      .select("id,url,score,findings,meta_tags,headings,links,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) { toast.error("Falha ao carregar auditorias: " + error.message); return; }
    setAudits((data || []) as unknown as AuditRow[]);
  };

  const loadSettings = async () => {
    const { data, error } = await supabase.from("seo_settings").select("id,gsc_verification_code").limit(1).maybeSingle();
    if (error) { toast.error("Falha ao carregar settings: " + error.message); return; }
    if (data) { setSettingsId(data.id); setGscToken(data.gsc_verification_code || ""); }
  };

  useEffect(() => {
    (async () => { setLoading(true); await Promise.all([loadAudits(), loadSettings()]); setLoading(false); })();
  }, []);

  const summary = useMemo(() => {
    if (!audits.length) return null;
    const byUrl = new Map<string, AuditRow>();
    for (const a of audits) if (!byUrl.has(a.url)) byUrl.set(a.url, a);
    const latest = [...byUrl.values()];
    const avg = Math.round(latest.reduce((s, a) => s + (a.score ?? 0), 0) / latest.length);
    const withProblems = latest.filter(a => (a.findings?.length || 0) > 0).length;
    return { total: latest.length, avg, withProblems, lastAt: audits[0]?.created_at };
  }, [audits]);

  const topProblems = useMemo(() => {
    const byUrl = new Map<string, AuditRow>();
    for (const a of audits) if (!byUrl.has(a.url)) byUrl.set(a.url, a);
    return [...byUrl.values()]
      .filter(a => (a.findings?.length || 0) > 0)
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
      .slice(0, 15);
  }, [audits]);

  const checklist = useMemo(() => {
    const byUrl = new Map<string, AuditRow>();
    for (const a of audits) if (!byUrl.has(a.url)) byUrl.set(a.url, a);
    return [...byUrl.values()].map(a => {
      const t = a.meta_tags?.title || "";
      const d = a.meta_tags?.description || "";
      const h1 = a.headings?.h1 || [];
      const canonical = a.meta_tags?.canonical || "";
      const broken = a.links?.broken || [];
      const checks = {
        title: !!t && t.length >= 20 && t.length <= 65,
        description: !!d && d.length >= 50 && d.length <= 165,
        heading: h1.length === 1,
        canonical: !!canonical,
        links: broken.length === 0,
      };
      const failed = Object.values(checks).filter(v => !v).length;
      return { row: a, checks, failed, broken };
    }).sort((a, b) => b.failed - a.failed);
  }, [audits]);



  const runAudit = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-audit-run", { body: {} });
      if (error) throw error;
      toast.success(`Auditoria concluída (${data?.audited ?? 0} URLs).`);
      await loadAudits();
    } catch (e) {
      toast.error("Falha na auditoria: " + (e instanceof Error ? e.message : String(e)));
    } finally { setRunning(false); }
  };

  const runValidate = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-validate-assets", { body: {} });
      if (error) throw error;
      setValidation(data as ValidateResult);
      toast.success("Sitemap e robots validados.");
    } catch (e) {
      toast.error("Falha na validação: " + (e instanceof Error ? e.message : String(e)));
    } finally { setValidating(false); }
  };

  const saveToken = async () => {
    if (!gscInput.trim()) { toast.error("Cole o token antes de salvar."); return; }
    setSavingToken(true);
    try {
      if (settingsId) {
        const { error } = await supabase.from("seo_settings").update({ gsc_verification_code: gscInput.trim() }).eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("seo_settings").insert({ gsc_verification_code: gscInput.trim() }).select("id").single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      setGscToken(gscInput.trim());
      setGscInput("");
      toast.success("Token GSC salvo.");
    } catch (e) {
      toast.error("Falha ao salvar token: " + (e instanceof Error ? e.message : String(e)));
    } finally { setSavingToken(false); }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Relatório SEO — Cathedra Digital", 14, 18);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 24);
    doc.setTextColor(0);

    let y = 34;
    doc.setFontSize(12); doc.text("Sitemap & Robots", 14, y); y += 6;
    doc.setFontSize(10);
    if (validation) {
      const s = validation.sitemap, r = validation.robots;
      const rows = [
        ["sitemap.xml URL", s.url],
        ["HTTP status", String(s.http_status)],
        ["URLs no sitemap", String(s.url_count)],
        ["Duplicadas", String(s.duplicate_count)],
        ["XML inválido", s.invalid_xml ? "sim" : "não"],
        ["Amostra quebrada", String(s.broken_sample.length)],
        ["robots.txt HTTP", String(r.http_status)],
        ["Linhas robots", String(r.line_count)],
        ["Bloqueia tudo?", r.disallow_all ? "sim" : "não"],
        ["Diretiva Sitemap", r.sitemap_directive || "—"],
      ];
      autoTable(doc, { startY: y, head: [["Métrica", "Valor"]], body: rows, styles: { fontSize: 9 } });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.text("Rode 'Validar sitemap/robots' antes de exportar para incluir esses dados.", 14, y); y += 10;
    }

    doc.setFontSize(12); doc.text("Resumo das auditorias", 14, y); y += 4;
    if (summary) {
      autoTable(doc, {
        startY: y + 2,
        head: [["URLs auditadas", "Score médio", "Com problemas", "Última auditoria"]],
        body: [[String(summary.total), String(summary.avg), String(summary.withProblems), new Date(summary.lastAt!).toLocaleString("pt-BR")]],
        styles: { fontSize: 9 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    doc.setFontSize(12); doc.text("Principais URLs com problemas", 14, y);
    autoTable(doc, {
      startY: y + 2,
      head: [["URL", "Score", "Findings"]],
      body: topProblems.map(a => [a.url, String(a.score ?? "—"), a.findings.map(f => `[${f.severity}] ${f.type}`).join("\n")]),
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 15 }, 2: { cellWidth: 80 } },
    });

    doc.save(`relatorio-seo-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">SEO — Painel</h1>
          <p className="text-muted-foreground mt-1">Sitemap, robots, auditorias e verificação Search Console.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={runValidate} variant="outline" disabled={validating}>
            <ShieldCheck className={`h-4 w-4 mr-2 ${validating ? "animate-spin" : ""}`} />
            Validar sitemap/robots
          </Button>
          <Button onClick={runAudit} disabled={running}>
            <PlayCircle className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
            Rodar auditoria
          </Button>
          <Button onClick={exportPdf} variant="outline">
            <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>URLs auditadas</CardDescription></CardHeader>
          <CardContent><span className="text-3xl font-bold">{summary?.total ?? 0}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Score médio</CardDescription></CardHeader>
          <CardContent><span className="text-3xl font-bold">{summary?.avg ?? "—"}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Com problemas</CardDescription></CardHeader>
          <CardContent><span className="text-3xl font-bold text-amber-600">{summary?.withProblems ?? 0}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>URLs no sitemap</CardDescription></CardHeader>
          <CardContent><span className="text-3xl font-bold">{validation?.sitemap.url_count ?? "—"}</span></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificação Google Search Console</CardTitle>
          <CardDescription>Salvo em <code>seo_settings.gsc_verification_code</code> e injetado no &lt;head&gt;. Exibido mascarado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Token atual</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                {gscToken ? (showToken ? gscToken : maskToken(gscToken)) : <span className="text-muted-foreground">— não configurado —</span>}
              </code>
              {gscToken && (
                <Button variant="ghost" size="sm" onClick={() => setShowToken(v => !v)}>
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="gsc-input" className="text-xs text-muted-foreground">Novo token (conteúdo do meta google-site-verification)</Label>
            <div className="flex gap-2 mt-1">
              <Input id="gsc-input" type="password" placeholder="ex: abcDEF123..." value={gscInput} onChange={e => setGscInput(e.target.value)} autoComplete="off" />
              <Button onClick={saveToken} disabled={savingToken}>
                <Save className="h-4 w-4 mr-2" /> Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {validation && (
        <Card>
          <CardHeader>
            <CardTitle>Sitemap & Robots</CardTitle>
            <CardDescription>Validado em {new Date(validation.checked_at).toLocaleString("pt-BR")}</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                {validation.sitemap.http_status === 200 && !validation.sitemap.invalid_xml ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                sitemap.xml
              </div>
              <div>URL: <a className="text-primary hover:underline break-all" href={validation.sitemap.url} target="_blank" rel="noopener noreferrer">{validation.sitemap.url}</a></div>
              <div>HTTP: {validation.sitemap.http_status}</div>
              <div>URLs: {validation.sitemap.url_count} · Duplicadas: {validation.sitemap.duplicate_count}</div>
              {validation.sitemap.invalid_xml && <div className="text-destructive">XML inválido</div>}
              {validation.sitemap.broken_sample.length > 0 && (
                <div className="text-amber-600 flex items-start gap-1"><AlertTriangle className="h-4 w-4 mt-0.5" /> {validation.sitemap.broken_sample.length} URL(s) da amostra retornaram erro</div>
              )}
            </div>
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                {validation.robots.http_status === 200 && !validation.robots.disallow_all ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                robots.txt
              </div>
              <div>URL: <a className="text-primary hover:underline break-all" href={validation.robots.url} target="_blank" rel="noopener noreferrer">{validation.robots.url}</a></div>
              <div>HTTP: {validation.robots.http_status} · Linhas: {validation.robots.line_count}</div>
              {validation.robots.disallow_all && <div className="text-destructive">Bloqueia todos os crawlers!</div>}
              <div>Sitemap directive: <code className="text-xs">{validation.robots.sitemap_directive || "—"}</code></div>
            </div>
            <p className="md:col-span-2 text-xs text-muted-foreground border-t pt-3">
              Regeneração real do <code>sitemap.xml</code> acontece no build (<code>scripts/generate-sitemap.ts</code>). Este botão valida o arquivo servido em produção.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Checklist on-page por página</CardTitle>
          <CardDescription>Title, description, heading (H1), canonical e links quebrados. Páginas com qualquer falha ficam marcadas como "precisa de ajuste".</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Carregando…</div>
          ) : checklist.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma auditoria ainda. Rode uma acima.</div>
          ) : (
            <div className="space-y-2">
              {checklist.map(({ row, checks, failed, broken }) => {
                const Item = ({ ok, label }: { ok: boolean; label: string }) => (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${ok ? "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900" : "text-destructive border-destructive/30 bg-destructive/5"}`}>
                    {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {label}
                  </span>
                );
                return (
                  <div key={row.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all">{row.url}</a>
                      {failed > 0
                        ? <Badge variant="destructive">precisa de ajuste ({failed})</Badge>
                        : <Badge variant="secondary">OK</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Item ok={checks.title} label="title" />
                      <Item ok={checks.description} label="description" />
                      <Item ok={checks.heading} label="H1" />
                      <Item ok={checks.canonical} label="canonical" />
                      <Item ok={checks.links} label={`links${broken.length ? ` (${broken.length} quebrados)` : ""}`} />
                    </div>
                    {broken.length > 0 && (
                      <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {broken.slice(0, 5).map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Badge variant="outline" className="text-[10px] shrink-0">{b.status || "erro"}</Badge>
                            <span className="break-all">{b.url}</span>
                          </li>
                        ))}
                        {broken.length > 5 && <li className="text-[11px]">+ {broken.length - 5} outros</li>}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>

        <CardHeader>
          <CardTitle>Principais URLs com problemas</CardTitle>
          <CardDescription>Baseado na última auditoria salva em <code>seo_audits</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Carregando…</div>
          ) : topProblems.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma auditoria com problemas. Rode uma nova.</div>
          ) : (
            <div className="space-y-2">
              {topProblems.map(a => (
                <div key={a.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all">{a.url}</a>
                    <div className="flex items-center gap-2">
                      <Badge variant={((a.score ?? 0) >= 80) ? "secondary" : ((a.score ?? 0) >= 50) ? "outline" : "destructive"}>score {a.score ?? "—"}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                    {a.findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">{f.severity}</Badge>
                        <span>{f.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
