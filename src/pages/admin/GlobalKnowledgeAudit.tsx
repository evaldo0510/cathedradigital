import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Target, Layers, Database, Search, GitBranch, Zap } from 'lucide-react';

interface ModuleAudit {
  id: string;
  label: string;
  readerV2: number; // 0-100%
  editorial: number;
  nexus: number;
  biblioteca: number;
  conteudo: number;
  multilingue: number;
}

export default function GlobalKnowledgeAudit() {
  const modules: ModuleAudit[] = [
    { id: 'biblia', label: 'Bíblia', readerV2: 100, editorial: 95, nexus: 82, biblioteca: 100, conteudo: 21, multilingue: 8 },
    { id: 'catecismo', label: 'Catecismo', readerV2: 100, editorial: 90, nexus: 85, biblioteca: 100, conteudo: 40, multilingue: 10 },
    { id: 'santos', label: 'Santos', readerV2: 100, editorial: 92, nexus: 80, biblioteca: 100, conteudo: 35, multilingue: 5 },
    { id: 'oracoes', label: 'Orações', readerV2: 100, editorial: 88, nexus: 75, biblioteca: 100, conteudo: 60, multilingue: 15 },
    { id: 'aparicoes', label: 'Aparições Marianas', readerV2: 100, editorial: 85, nexus: 80, biblioteca: 100, conteudo: 50, multilingue: 10 },
  ];

  const totalScore = useMemo(() => {
    const total = modules.reduce((acc, m) => acc + (m.readerV2 + m.editorial + m.nexus + m.biblioteca + m.conteudo + m.multilingue) / 6, 0);
    return Math.round(total / modules.length);
  }, [modules]);

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <Helmet><title>Auditoria Global de Conhecimento — Cathedra 3.0</title></Helmet>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="outline" className="text-primary font-mono mb-2">FASE 6 — AUDITORIA DE CONHECIMENTO</Badge>
          <h1 className="text-3xl font-black tracking-tight font-display">Global Knowledge Audit</h1>
        </div>
        <div className="flex items-center gap-4 bg-card border border-border p-4 rounded-premium">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progresso Total</p>
            <p className="text-2xl font-black">{totalScore}%</p>
          </div>
          <div className="w-24"><Progress value={totalScore} className="h-2" /></div>
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
      </header>

      <div className="grid gap-6">
        {modules.map(mod => (
          <Card key={mod.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">{mod.label}</CardTitle>
                <div className="flex gap-1">
                   {/* Mini barras de status */}
                   <div className="w-16 h-1 bg-muted"><div className="h-full bg-primary" style={{ width: `${mod.readerV2}%` }} /></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                {[
                  { label: 'Reader', val: mod.readerV2 },
                  { label: 'Editorial', val: mod.editorial },
                  { label: 'Nexus', val: mod.nexus },
                  { label: 'Biblioteca', val: mod.biblioteca },
                  { label: 'Conteúdo', val: mod.conteudo },
                  { label: 'Multilíngue', val: mod.multilingue },
                ].map(stat => (
                  <div key={stat.label} className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-black text-primary">{stat.val}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
