import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { EditorialHero, EditorialDivider } from '@/components/editorial/harmony';
import { Icons } from '@/constants';
import { runAcervoAuditory, AuditSummary } from '@/services/acervoAuditService';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Search, ShieldCheck } from 'lucide-react';

const AcervoAuditPage: React.FC = () => {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runAcervoAuditory().then(res => {
      setSummary(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-20 text-center italic opacity-50">Auditoria em curso...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Auditoria do Acervo Cathedra — Ecossistema Vivo</title>
      </Helmet>

      <EditorialHero align="center" density="minimal" className="bg-primary/5">
        <EditorialHero.Meta>Mission Control · Constituição Editorial</EditorialHero.Meta>
        <EditorialHero.Title>Constituição do Patrimônio</EditorialHero.Title>
        <EditorialHero.Subtitle>Certificação global de maturidade e fidelidade à Tradição.</EditorialHero.Subtitle>
      </EditorialHero>

      <main className="max-w-5xl mx-auto px-6 mt-12 space-y-12">
        {/* Score Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-8 rounded-premium text-center space-y-4 shadow-sm">
            <div className="text-4xl font-serif font-black text-primary">{summary?.healthScore}%</div>
            <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Índice de Saúde Global</div>
            <Progress value={summary?.healthScore} className="h-1" />
          </div>
          <div className="bg-card border border-border p-8 rounded-premium text-center space-y-4 shadow-sm">
            <div className="text-4xl font-serif font-black text-primary">{summary?.totalModules}</div>
            <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Módulos Catalogados</div>
            <Badge variant="outline" className="text-[10px] border-primary/20">100% Cobertura</Badge>
          </div>
          <div className="bg-card border border-border p-8 rounded-premium text-center space-y-4 shadow-sm">
            <div className="text-4xl font-serif font-black text-gold">{summary?.readerV2Count}</div>
            <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Módulos Reader V2</div>
            <div className="text-[10px] text-gold font-bold italic">Em Expansão</div>
          </div>
        </div>

        {/* Pilares da Auditoria */}
        <section className="space-y-6">
          <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Pilares de Certificação
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuditItem 
              label="Reader V2 (Certificação Visual)" 
              value={summary?.readerV2Count} 
              total={summary?.totalModules}
              status="progress"
            />
            <AuditItem 
              label="Nexus (Inteligência Teológica)" 
              value={summary?.nexusCount} 
              total={summary?.totalModules}
              status="progress"
            />
            <AuditItem 
              label="Editorial Closure (Fim de Linha Zero)" 
              value={summary?.editorialClosureCount} 
              total={summary?.totalModules}
              status="progress"
            />
             <AuditItem 
              label="Pesquisável via Logos" 
              value={summary?.logosSearchableCount} 
              total={summary?.totalModules}
              status="success"
            />
            <AuditItem 
              label="Descoberta na Biblioteca Monástica" 
              value={summary?.libraryDiscoveryCount} 
              total={summary?.totalModules}
              status="success"
            />
             <AuditItem 
              label="Módulos Órfãos (Risco de Inexistência)" 
              value={summary?.orphanCount} 
              total={summary?.totalModules}
              status="warning"
              reverse
            />
          </div>
        </section>

        <EditorialDivider variant="gold-fade" className="opacity-20" />

        {/* Cobertura do Patrimônio da Igreja */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Icons.Library className="w-4 h-4" /> Cobertura do Patrimônio
            </h2>
            <Badge variant="outline" className="text-[10px] border-gold/30 text-gold uppercase tracking-widest font-bold">Fase 10</Badge>
          </div>
          
          <div className="bg-card border border-border rounded-premium overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary/5 border-b border-border">
                <tr>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Estante</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px] text-right">Cobertura</th>
                  <th className="p-4 w-1/3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <CoverageRow label="Bíblia" percent={summary?.patrimonyCoverage.biblia || 0} />
                <CoverageRow label="Catecismo" percent={summary?.patrimonyCoverage.catecismo || 0} />
                <CoverageRow label="Maria" percent={summary?.patrimonyCoverage.maria || 0} />
                <CoverageRow label="Santos" percent={summary?.patrimonyCoverage.santos || 0} />
                <CoverageRow label="Patrística" percent={summary?.patrimonyCoverage.patristica || 0} status="progress" />
                <CoverageRow label="Magistério" percent={summary?.patrimonyCoverage.magisterio || 0} status="progress" />
                <CoverageRow label="Papas" percent={summary?.patrimonyCoverage.papas || 0} status="warning" />
                <CoverageRow label="Dogmas" percent={summary?.patrimonyCoverage.dogmas || 0} status="progress" />
                <CoverageRow label="Concílios" percent={summary?.patrimonyCoverage.concilios || 0} status="warning" />
                <CoverageRow label="Jornadas" percent={summary?.patrimonyCoverage.jornadas || 0} />
                <CoverageRow label="Orações" percent={summary?.patrimonyCoverage.oracoes || 0} />
                <CoverageRow label="Liturgia" percent={summary?.patrimonyCoverage.liturgia || 0} />
                <CoverageRow label="Logos IA" percent={summary?.patrimonyCoverage.logos || 0} />
                <CoverageRow label="Nexus Graph" percent={summary?.patrimonyCoverage.nexus || 0} />
                <CoverageRow label="Reader V2" percent={summary?.patrimonyCoverage.reader || 0} />
              </tbody>
            </table>
          </div>
        </section>

        <EditorialDivider variant="gold-fade" className="opacity-20" />

        <div className="p-8 bg-primary/5 rounded-premium border border-primary/10 text-center space-y-4">
           <Icons.Shield className="w-8 h-8 mx-auto text-primary/40" />
           <h3 className="text-xl font-serif font-bold italic">Fase 10.1: Constituição do Patrimônio</h3>
           <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed italic">
             A infraestrutura chegou à maturidade. Agora, o Cathedra opera sob uma Constituição Editorial rigorosa: 
             nenhum conteúdo entra sem 100% de conformidade com o Reader V2, Nexus, Logos e fidelidade documental.
           </p>
        </div>
      </main>
    </div>
  );
};

const CoverageRow = ({ label, percent, status = "success" }: { label: string, percent: number, status?: string }) => (
  <tr className="group hover:bg-primary/[0.02] transition-colors">
    <td className="p-4 font-serif font-bold text-primary/80">{label}</td>
    <td className="p-4 text-right font-mono font-bold">{percent}%</td>
    <td className="p-4">
      <Progress value={percent} className="h-1" />
    </td>
  </tr>
);

const AuditItem = ({ label, value, total, status, reverse = false }: any) => {
  const percent = Math.round((value / total) * 100);
  const isGood = reverse ? percent < 10 : percent > 80;
  
  return (
    <div className="bg-card border border-border/60 p-5 rounded-premium flex items-center justify-between group hover:border-primary/20 transition-all">
      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{label}</div>
        <div className="text-2xl font-serif font-bold text-primary/80">
          {value} <span className="text-sm font-normal text-muted-foreground">/ {total}</span>
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="text-xs font-serif italic text-muted-foreground">{percent}%</div>
        {status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
        {status === 'progress' && <Search className="w-5 h-5 text-blue-500 ml-auto opacity-50" />}
        {status === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500 ml-auto" />}
        {status === 'critical' && <AlertCircle className="w-5 h-5 text-rose-500 ml-auto" />}
      </div>
    </div>
  );
};

export default AcervoAuditPage;
