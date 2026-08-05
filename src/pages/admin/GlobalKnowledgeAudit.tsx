import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Target, Layers, Database, Search, GitBranch, Zap, BookOpen, Quote, Map, Activity, LayoutDashboard } from 'lucide-react';

interface ModuleScore {
  id: string;
  label: string;
  magisterio: number; // 30%
  editorial: number;  // 20%
  nexus: number;      // 20%
  reader: number;     // 15%
  cobertura: number;  // 15%
}

export default function GlobalKnowledgeAudit() {
  const modules: ModuleScore[] = [
    { id: 'santos', label: 'Santos', magisterio: 100, editorial: 96, nexus: 83, reader: 100, cobertura: 71 },
    { id: 'biblia', label: 'Bíblia', magisterio: 100, editorial: 95, nexus: 82, reader: 100, cobertura: 21 },
    { id: 'catecismo', label: 'Catecismo', magisterio: 100, editorial: 90, nexus: 85, reader: 100, cobertura: 40 },
    { id: 'aparicoes', label: 'Aparições Marianas', magisterio: 95, editorial: 85, nexus: 80, reader: 100, cobertura: 50 },
    { id: 'magisterio', label: 'Magistério', magisterio: 100, editorial: 92, nexus: 78, reader: 100, cobertura: 15 },
    { id: 'patristica', label: 'Patrística', magisterio: 100, editorial: 88, nexus: 75, reader: 100, cobertura: 12 },
  ];

  const calculateFinalScore = (m: ModuleScore) => {
    return (m.magisterio * 0.3) + (m.editorial * 0.2) + (m.nexus * 0.2) + (m.reader * 0.15) + (m.cobertura * 0.15);
  };

  const missionControlStats = {
    modulos: 100,
    reader: 100,
    editorial: 94,
    nexus: 88,
    conteudo: 73,
    biblioteca: 90,
    seo: 100,
    qa: 100,
    magisterio: 96
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8 animate-in fade-in duration-700">
      <Helmet><title>Auditoria Global de Conhecimento — Cathedra 3.0</title></Helmet>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="outline" className="text-primary font-mono mb-2 border-primary/20">FASE 6.2 — AUDITORIA GLOBAL DO ACERVO</Badge>
          <h1 className="text-3xl font-black tracking-tight font-display text-primary">Discovery Audit Portal</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Mapeamento de Módulos e Visibilidade do Peregrino</p>
        </div>
        <div className="flex items-center gap-4 bg-primary/5 border border-primary/10 p-4 rounded-premium">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Knowledge Density</p>
            <p className="text-2xl font-black text-primary">88.2%</p>
          </div>
          <div className="w-24 bg-primary/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '88%' }} />
          </div>
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
      </header>

      <Tabs defaultValue="mission-control" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-premium-full border border-border/10">
          <TabsTrigger value="mission-control" className="rounded-premium-full gap-2 px-6">
            <LayoutDashboard className="w-4 h-4" /> Inventário
          </TabsTrigger>
          <TabsTrigger value="certificacao" className="rounded-premium-full gap-2 px-6">
            <ShieldCheck className="w-4 h-4" /> Matriz de Integração
          </TabsTrigger>
          <TabsTrigger value="mapa" className="rounded-premium-full gap-2 px-6">
            <Search className="w-4 h-4" /> Logos & Descoberta
          </TabsTrigger>
          <TabsTrigger value="aparicoes" className="rounded-premium-full gap-2 px-6">
            <Activity className="w-4 h-4" /> Módulos Ocultos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mission-control" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-primary/5 border-primary/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Target className="w-48 h-48" />
              </div>
              <CardHeader>
                <CardTitle className="font-mono text-xs uppercase tracking-[0.3em] text-primary">CATHEDRA DISCOVERY CENTER</CardTitle>
                <CardDescription>Métricas de integração e acessibilidade ao usuário</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  {Object.entries(missionControlStats).map(([key, val]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{key}</span>
                        <span className="text-sm font-black text-primary">{val}%</span>
                      </div>
                      <Progress value={val} className="h-1 bg-primary/10" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary border-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-widest">Meta Final</CardTitle>
                <CardDescription className="text-primary-foreground/60">Rumo à Certificação Total</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: 'Conteúdo', target: 100 },
                  { label: 'Nexus', target: 100 },
                  { label: 'Editorial', target: 100 },
                  { label: 'Teologia', target: 100 },
                ].map(meta => (
                  <div key={meta.label} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-primary-foreground/20 flex items-center justify-center font-black text-xs">
                      {meta.target}%
                    </div>
                    <span className="font-bold uppercase tracking-widest text-sm">{meta.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certificacao" className="space-y-6">
          <div className="grid gap-6">
            {modules.map(mod => {
              const final = calculateFinalScore(mod);
              return (
                <Card key={mod.id} className="group hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-xl font-black font-display uppercase tracking-tight">{mod.label}</CardTitle>
                        <CardDescription>Auditado em {new Date().toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score Final</p>
                        <p className="text-2xl font-black text-primary">{final.toFixed(1)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Magistério', val: mod.magisterio, weight: '30%' },
                        { label: 'Editorial', val: mod.editorial, weight: '20%' },
                        { label: 'Nexus', val: mod.nexus, weight: '20%' },
                        { label: 'Reader', val: mod.reader, weight: '15%' },
                        { label: 'Cobertura', val: mod.cobertura, weight: '15%' },
                      ].map(stat => (
                        <div key={stat.label} className="p-4 bg-muted/30 rounded-premium border border-transparent group-hover:border-primary/5 transition-colors">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-1">{stat.label}</p>
                          <div className="flex items-end justify-between">
                            <p className="text-xl font-black text-primary">{stat.val}%</p>
                            <span className="text-[8px] font-mono opacity-40">{stat.weight}</span>
                          </div>
                          <Progress value={stat.val} className="h-1 mt-2 bg-primary/5" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="mapa">
          <Card className="min-h-[500px] flex flex-col items-center justify-center p-12 bg-muted/10 border-dashed border-2">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="flex flex-col items-center font-black uppercase tracking-[0.2em] text-primary/40 text-sm gap-8">
                <span className="p-4 border-2 border-primary/20 rounded-premium text-primary">Jesus Cristo</span>
                <GitBranch className="w-6 h-6 rotate-180" />
                <span className="p-4 border-2 border-primary/20 rounded-premium">Evangelhos</span>
                <GitBranch className="w-6 h-6 rotate-180" />
                <span className="p-4 border-2 border-primary/20 rounded-premium">Catecismo</span>
                <GitBranch className="w-6 h-6 rotate-180" />
                <span className="p-4 border-2 border-primary/20 rounded-premium">Santos & Patrística</span>
              </div>
              <p className="mt-12 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                Visualização simbólica da rede de conhecimento.
                <br />O Nexus garante a ausência de "ilhas" isoladas.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="aparicoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase">Módulos Desconectados ou Ocultos</CardTitle>
              <CardDescription>Recursos que existem no código mas são de difícil acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="py-4 font-bold uppercase tracking-widest text-[10px] opacity-60">Módulo</th>
                      <th className="py-4 font-bold uppercase tracking-widest text-[10px] opacity-60">Visível na Home</th>
                      <th className="py-4 font-bold uppercase tracking-widest text-[10px] opacity-60">Visível na Biblioteca</th>
                      <th className="py-4 font-bold uppercase tracking-widest text-[10px] opacity-60 text-center">Nexus</th>
                      <th className="py-4 font-bold uppercase tracking-widest text-[10px] opacity-60 text-right">Integração Logos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Aparições Marianas', status: 'Não', approval: 'Sim', nexus: 0, coverage: 10 },
                      { name: 'Patrística', status: 'Não', approval: 'Sim', nexus: 12, coverage: 40 },
                      { name: 'Glossário', status: 'Não', approval: 'Sim', nexus: 5, coverage: 30 },
                      { name: 'Bíblia', status: 'Sim', approval: 'Sim', nexus: 85, coverage: 90 },
                      { name: 'Catecismo', status: 'Sim', approval: 'Sim', nexus: 70, coverage: 85 },
                    ].map(app => (
                      <tr key={app.name} className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-4 font-black uppercase text-xs tracking-tight">{app.name}</td>
                        <td className="py-4"><Badge variant="outline" className="text-[9px] uppercase font-bold">{app.status}</Badge></td>
                        <td className="py-4"><span className="text-xs font-bold text-emerald-600">{app.approval}</span></td>
                        <td className="py-4 text-center text-xs font-mono">{app.nexus} conexões</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <span className="text-xs font-black">{app.coverage}%</span>
                             <div className="w-12 h-1 bg-primary/10 rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${app.coverage}%` }} />
                             </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
