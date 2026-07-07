import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/cathedra/CathedraCard";
import { Badge } from "@/components/ui/badge";
import { CathedraButton as Button } from "@/components/cathedra/CathedraButton";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, ExternalLink } from "lucide-react";

type CheckStatus = "pass" | "warn" | "fail";
interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}
interface Report {
  generated_at: string;
  project_domain: string;
  summary: { pass: number; warn: number; fail: number };
  checks: Check[];
}

const STATUS_STYLES: Record<CheckStatus, { icon: typeof CheckCircle2; className: string; label: string }> = {
  pass: { icon: CheckCircle2, className: "text-emerald-600", label: "OK" },
  warn: { icon: AlertTriangle, className: "text-amber-600", label: "Atenção" },
  fail: { icon: XCircle, className: "text-destructive", label: "Falha" },
};

export default function SEOStatusPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/seo-checklist-report.json?ts=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: Report = await res.json();
      setReport(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar relatório");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">SEO Status</h1>
          <p className="text-muted-foreground mt-1">
            Resultado do checklist automático executado no build (sitemap, robots, llms.txt, metadata).
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Recarregar
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Não foi possível carregar o relatório: {error}. Execute <code className="text-xs bg-muted px-1 rounded">bun run scripts/seo-checklist.ts</code> ou rode um novo build.
            </p>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>OK</CardDescription></CardHeader>
              <CardContent><span className="text-3xl font-bold text-emerald-600">{report.summary.pass}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Atenção</CardDescription></CardHeader>
              <CardContent><span className="text-3xl font-bold text-amber-600">{report.summary.warn}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Falhas</CardDescription></CardHeader>
              <CardContent><span className="text-3xl font-bold text-destructive">{report.summary.fail}</span></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Checks ({report.checks.length})</CardTitle>
              <CardDescription>
                Gerado em {new Date(report.generated_at).toLocaleString("pt-BR")} · Base: {report.project_domain}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.checks.map((c) => {
                const s = STATUS_STYLES[c.status];
                const Icon = s.icon;
                return (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${s.className}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{c.label}</span>
                        <Badge variant="outline" className="text-xs">{c.id}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 break-words">{c.detail}</p>
                    </div>
                    <Badge variant={c.status === "pass" ? "secondary" : c.status === "warn" ? "outline" : "destructive"}>
                      {s.label}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scanner Lovable</CardTitle>
              <CardDescription>
                Findings do scanner externo são listados no painel "SEO & AI search" da Lovable (não acessíveis em runtime).
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Para reavaliar findings, peça no chat "rodar revisão SEO" ou clique em Rescan no painel SEO.</p>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Abrir Google Search Console <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
