/**
 * Cathedra Mission Control — sala de controle do ecossistema editorial.
 *
 * Lê os manifestos registrados no Editorial Engine e mostra, por entidade,
 * ICE, Nexus, tier e status do gate. Entidades ainda não plugadas aparecem
 * como placeholders "Não configurado" até seu manifesto ganhar `ready: true`.
 */
import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, ArrowRight, Lock, ShieldCheck, Trophy, PieChart, Activity, Mail } from "lucide-react";
import { IACalculator } from "@/components/admin/IACalculator";
import { IAMetricsDashboard } from "@/components/admin/IAMetricsDashboard";
import { LandingAnalyticsDashboard } from "@/components/admin/LandingAnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsDashboard } from "@/components/admin/LeadsDashboard";
import { editorialRegistry } from "@/lib/editorial-engine/manifests";
import { useEditorialSummary } from "@/lib/editorial-engine/useEditorialAudit";
import { iceTierLabel } from "@/lib/editorial-engine/ice";
import type { EntityManifest } from "@/lib/editorial-engine/types";

function tierClasses(tier: string) {
  switch (tier) {
    case "gold":   return { text: "text-emerald-700", bar: "bg-emerald-500",  border: "border-l-emerald-500" };
    case "silver": return { text: "text-sky-700",     bar: "bg-sky-500",      border: "border-l-sky-500" };
    case "bronze": return { text: "text-amber-700",   bar: "bg-amber-500",    border: "border-l-amber-500" };
    default:       return { text: "text-red-700",     bar: "bg-red-500",      border: "border-l-red-500" };
  }
}

function statusLabel(s: { frozen: boolean; ice: number; gatePassing: number; gateTotal: number; ready: boolean }): string {
  if (!s.ready) return "Não configurado";
  if (s.gateTotal === 0) return "Aguardando primeira auditoria";
  if (s.frozen) return "Pronto para Certificação";
  if (s.ice >= 85) return "Em progresso · Prata";
  if (s.ice >= 70) return "Em progresso · Bronze";
  return "Fase Fundação";
}

function EntityRow({ manifest }: { manifest: EntityManifest }) {
  const s = useEditorialSummary(manifest);
  const t = tierClasses(s.tier);
  const status = statusLabel({ ...s, ready: manifest.ready });
  const pct = Math.round(s.ice);

  return (
    <Card className={`border-l-4 ${manifest.ready ? t.border : "border-l-muted"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-lg leading-none">{manifest.label}</h3>
              {manifest.ready ? (
                <Badge variant="outline" className={`text-[10px] ${t.text}`}>
                  {iceTierLabel(s.tier)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Placeholder</Badge>
              )}
              {s.frozen && (
                <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-[10px] text-amber-700">
                  <Trophy className="mr-1 h-2.5 w-2.5" /> Certificável
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{status}</p>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">ICE</span>
                <span className={`font-semibold tabular-nums ${manifest.ready ? t.text : "text-muted-foreground"}`}>
                  {manifest.ready && s.snapshot ? `${pct}%` : "—"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full transition-all ${t.bar}`} style={{ width: manifest.ready ? `${pct}%` : "0%" }} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-3 text-[11px]">
              <Stat label="Editorial" value={manifest.ready && s.snapshot ? `${Math.round(s.editorial)}%` : "—"} />
              <Stat label="Nexus"     value={manifest.ready && s.snapshot ? `${Math.round(s.nexus)}%` : "—"} />
              <Stat label="Gate"      value={manifest.ready && s.gateTotal > 0 ? `${s.gatePassing}/${s.gateTotal}` : "—"} />
              <Stat label="Freeze"    value={manifest.ready ? `${s.freezePassCount}/${s.freezeTotalCount}` : "—"} />
            </div>
          </div>

          {manifest.ready ? (
            <div className="flex gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link to={manifest.auditRoute}>Abrir <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
              {(["glossary", "prayers", "catechism"] as const).includes(manifest.id as any) && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/admin/editorial-bulk?entity=${manifest.id}`}>Bulk IA</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" /> Aguardando manifesto
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** Painel agregado do "Sistema" — média ponderada de todas as entidades prontas. */
function SystemPanel() {
  const summaries = editorialRegistry.map(m => ({ m, s: useEditorialSummary(m) }));
  const ready = summaries.filter(x => x.m.ready && x.s.snapshot);
  const totalWeight = ready.reduce((s, x) => s + x.m.weight, 0);
  const weightedIce = totalWeight
    ? Math.round(ready.reduce((s, x) => s + x.s.ice * x.m.weight, 0) / totalWeight)
    : 0;
  const readyCount = ready.length;
  const totalCount = editorialRegistry.length;
  const allFrozen = ready.length > 0 && ready.every(x => x.s.frozen);

  const systemStatus = allFrozen
    ? "Pronto para Certificação"
    : readyCount < totalCount
      ? "Expansão em andamento"
      : weightedIce >= 85
        ? "Em consolidação"
        : "Em construção";

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Sistema · Cathedra
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ICE global (ponderado)</p>
            <p className="font-serif text-3xl tabular-nums">{weightedIce}%</p>
            <Progress value={weightedIce} className="mt-2 h-1.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Módulos plugados</p>
            <p className="font-serif text-3xl tabular-nums">{readyCount}/{totalCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Certificáveis</p>
            <p className="font-serif text-3xl tabular-nums">{ready.filter(x => x.s.frozen).length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
            <p className="text-sm font-semibold pt-1">{systemStatus}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MissionControl() {
  const entities = useMemo(() => editorialRegistry, []);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Helmet>
        <title>Cathedra Mission Control · Editorial Engine</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-2xl leading-none">Cathedra Mission Control</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sala de controle do ecossistema editorial · agregando todos os módulos plugados no Editorial Engine.
          </p>
        </div>
      </div>

      <Tabs defaultValue="knowledge" className="mb-8">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Editorial
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Leads
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" /> Custos IA
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="knowledge" className="space-y-8">
          <SystemPanel />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {entities.map(m => (
              <EntityRow key={m.id} manifest={m} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-8">
          <LeadsDashboard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <LandingAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="costs" className="space-y-8">
          <IAMetricsDashboard />
          <IACalculator />
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-[11px] text-muted-foreground">
        Módulos com selo <b>Placeholder</b> aguardam registro do manifesto no Editorial Engine
        (`src/lib/editorial-engine/manifests/`). Ganhar o selo <b>Ouro</b> ({">= 95% ICE"}) e
        os 5 critérios do gate torna a entidade <b>Certificável</b>.
      </p>
    </div>
  );
}
