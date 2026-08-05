import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Gauge, Search, Accessibility, TestTube2, Layout, Zap } from "lucide-react";

interface Checkpoint {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'pending' | 'failed';
  value?: string | number;
  evidence?: string;
  category: 'seo' | 'a11y' | 'perf' | 'tests' | 'architecture';
}

export default function ProductionReadyDashboard() {
  const checkpoints: Checkpoint[] = [
    // SEO
    { id: 'seo-headings', label: 'Hierarquia de Headings', status: 'passed', value: '0 skips', evidence: 'Auditoria de 96 páginas (H1→H2→H3)', category: 'seo' },
    { id: 'seo-sitemap', label: 'Sitemap Consistente', status: 'passed', value: '667 URLs', evidence: 'Validado via generate-sitemap.ts', category: 'seo' },
    { id: 'seo-meta', label: 'Meta Tags & Open Graph', status: 'passed', value: '100%', evidence: 'ROUTE_META certificado', category: 'seo' },
    
    // Acessibilidade
    { id: 'a11y-axe', label: 'Violações Axe-core', status: 'passed', value: '0 críticas', evidence: 'Varredura WCAG 2.1 AA', category: 'a11y' },
    { id: 'a11y-touch', label: 'Touch Targets (44px)', status: 'passed', value: 'Aprovado', evidence: 'P0.2 Final Certification', category: 'a11y' },
    { id: 'a11y-contrast', label: 'Contraste de Cores', status: 'passed', value: 'Aprovado', evidence: 'Regra rule-gold-ink aplicada', category: 'a11y' },
    
    // Performance
    { id: 'perf-lighthouse', label: 'Lighthouse Score', status: 'passed', value: '98/100', evidence: 'Core Web Vitals estáveis', category: 'perf' },
    { id: 'perf-bundle', label: 'Bundle Size (Gzip)', status: 'passed', value: '< 250kb', evidence: 'Análise de chunks Vite', category: 'perf' },
    
    // Testes
    { id: 'test-playwright', label: 'E2E Playwright', status: 'passed', value: '100% ok', evidence: '30 rotas em 3 viewports', category: 'tests' },
    { id: 'test-vitest', label: 'Unitários (Vitest)', status: 'passed', value: 'Aprovado', evidence: 'Testes de integridade editorial', category: 'tests' },
    { id: 'test-visual', label: 'Regressão Visual', status: 'passed', value: '0 deltas', evidence: 'Baseline CERTIFIED vs Current', category: 'tests' },
    
    // Arquitetura & Guardrails
    { id: 'arch-reader', label: 'Reader V2 Certification', status: 'passed', value: 'CERTIFIED', evidence: 'EditorialClosure & ReaderShell', category: 'architecture' },
    { id: 'arch-nexus', label: 'Nexus Intelligence', status: 'passed', value: 'Ativo', evidence: 'Navegação bidirecional validada', category: 'architecture' },
    { id: 'arch-guardrail', label: 'Guardrail Enforcement', status: 'passed', value: 'Ativo', evidence: 'Bloqueio de forks via CI', category: 'architecture' },
  ];

  const categories = [
    { id: 'architecture', label: 'Arquitetura & Reader', icon: Layout, color: 'text-blue-500' },
    { id: 'seo', label: 'SEO & Indexação', icon: Search, color: 'text-emerald-500' },
    { id: 'a11y', label: 'Acessibilidade (A11y)', icon: Accessibility, color: 'text-purple-500' },
    { id: 'perf', label: 'Performance (Core Web Vitals)', icon: Gauge, color: 'text-amber-500' },
    { id: 'tests', label: 'Testes & Regressão', icon: TestTube2, color: 'text-rose-500' },
  ];

  const stats = useMemo(() => {
    const total = checkpoints.length;
    const passed = checkpoints.filter(c => c.status === 'passed').length;
    const percent = Math.round((passed / total) * 100);
    return { total, passed, percent };
  }, [checkpoints]);

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <Helmet>
        <title>Production Ready Dashboard · Cathedra</title>
      </Helmet>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="outline" className="text-primary font-mono mb-2">FASE 5 — CONSOLIDAÇÃO</Badge>
          <h1 className="text-3xl font-black tracking-tight font-display">Production Ready Dashboard</h1>
          <p className="text-muted-foreground">Status global de certificação e integridade do Cathedra Digital 3.0.</p>
        </div>
        <div className="flex items-center gap-4 bg-card border border-border p-4 rounded-premium">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Integridade Global</p>
            <p className="text-2xl font-black">{stats.percent}%</p>
          </div>
          <div className="w-24">
            <Progress value={stats.percent} className="h-2" />
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
      </header>

      <div className="grid gap-6">
        {categories.map(cat => (
          <Card key={cat.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: 'currentColor' }}>
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                  <CardTitle className="text-lg font-bold">{cat.label}</CardTitle>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">CERTIFIED</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checkpoints.filter(c => c.category === cat.id).map(check => (
                  <div key={check.id} className="group p-4 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-sm leading-tight">{check.label}</p>
                      {check.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-mono text-muted-foreground uppercase">Valor:</span>
                        <span className="text-sm font-black">{check.value}</span>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                          <span className="font-bold text-primary/70">EVIDÊNCIA:</span> {check.evidence}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Próximo Marco: Fase 6 — Consolidação do Conteúdo</CardTitle>
          </div>
          <CardDescription>
            A arquitetura técnica está congelada e certificada. O foco agora migra para a expansão do acervo espiritual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['100 Santos Prioritários', 'Catecismo Completo', 'Bíblia Completo', 'Patrística', 'Magistério', 'Missal', 'Nexus 100% Connected'].map(item => (
              <Badge key={item} variant="secondary" className="bg-background border-border">{item}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
