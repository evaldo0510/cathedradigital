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

      <EditorialHero align="center" density="dense" className="bg-primary/5">
        <EditorialHero.Meta>Mission Control · Auditoria Global</EditorialHero.Meta>
        <EditorialHero.Title>Saúde do Acervo Cathedra</EditorialHero.Title>
        <EditorialHero.Subtitle>Monitoramento técnico da unificação da Biblioteca Monástica.</EditorialHero.Subtitle>
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
              status="critical"
            />
            <AuditItem 
              label="Editorial Closure (Fim de Linha Zero)" 
              value={summary?.editorialClosureCount} 
              total={summary?.totalModules}
              status="critical"
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
              status="progress"
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

        <div className="p-8 bg-primary/5 rounded-premium border border-primary/10 text-center space-y-4">
           <Icons.Shield className="w-8 h-8 mx-auto text-primary/40" />
           <h3 className="text-xl font-serif font-bold italic">Próximo Passo: O Acervo Único</h3>
           <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed italic">
             O Cathedra deixou de ser uma coleção de ferramentas para se tornar um <strong>Ecossistema Vivo</strong>. 
             A auditoria agora foca na eliminação total de módulos órfãos através das novas <strong>Estantes do Mosteiro</strong>.
           </p>
        </div>
      </main>
    </div>
  );
};

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
