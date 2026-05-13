import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchNexusTagContent, type TagContent } from '@/lib/nexusContent';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { Loader2, AlertTriangle, CheckCircle, Search, FileWarning, Database, Sparkles, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ThemeAudit {
  id: string;
  name: string;
  slug: string;
  category: string;
  counts: {
    bible: number;
    catechism: number;
    magisterium: number;
    journey: number;
    total: number;
  };
  status: 'healthy' | 'warning' | 'critical';
}

const NexusAuditPage: React.FC = () => {
  const [isAuditing, setIsAuditng] = useState(false);
  const [results, setResults] = useState<ThemeAudit[]>([]);
  const [progress, setProgress] = useState(0);

  const { data: themes, isLoading: loadingThemes } = useQuery({
    queryKey: ['audit-themes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('themes').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const runAudit = async () => {
    if (!themes || isAuditing) return;
    setIsAuditng(true);
    setProgress(0);
    const auditResults: ThemeAudit[] = [];

    for (let i = 0; i < themes.length; i++) {
      const theme = themes[i];
      try {
        const { content } = await fetchNexusTagContent({ label: theme.name, slug: theme.slug, id: theme.id } as any);
        
        const counts = {
          bible: content.filter(c => c.type === 'bible').length,
          catechism: content.filter(c => c.type === 'catechism').length,
          magisterium: content.filter(c => c.type === 'magisterium').length,
          journey: content.filter(c => c.type === 'journey').length,
          total: content.length
        };

        let status: ThemeAudit['status'] = 'healthy';
        if (counts.total === 0) status = 'critical';
        else if (counts.total < 3) status = 'warning';

        auditResults.push({
          id: theme.id,
          name: theme.name,
          slug: theme.slug,
          category: theme.category,
          counts,
          status
        });
      } catch (err) {
        console.error(`Audit error for ${theme.name}:`, err);
      }
      setProgress(Math.round(((i + 1) / themes.length) * 100));
    }

    setResults(auditResults);
    setIsAuditng(false);
    toast.success('Auditoria concluída');
  };

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    return {
      total: results.length,
      critical: results.filter(r => r.status === 'critical').length,
      warning: results.filter(r => r.status === 'warning').length,
      healthy: results.filter(r => r.status === 'healthy').length,
    };
  }, [results]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-8 px-4">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary border border-primary/20">
          <Database className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Integrity</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Auditoria do Nexus</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">Verificação de cobertura de conteúdo e conexões teológicas por tema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total de Temas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-serif font-bold text-primary">{themes?.length || '--'}</p>
          </CardContent>
        </Card>
        
        {stats && (
          <>
            <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-green-600">Saudáveis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-serif font-bold text-green-600">{stats.healthy}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-600">Baixa Cobertura</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-serif font-bold text-amber-600">{stats.warning}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-red-600">Sem Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-serif font-bold text-red-600">{stats.critical}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary" /> Painel de Diagnóstico
          </h2>
          <Button 
            onClick={runAudit} 
            disabled={isAuditing || loadingThemes} 
            className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-primary/20"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Auditando {progress}%
              </>
            ) : (
              'Iniciar Auditoria Global'
            )}
          </Button>
        </div>

        {!isAuditing && results.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Icons.Zap className="w-12 h-12 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground font-serif italic">Clique no botão acima para analisar a integridade do Nexus.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-muted/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tema</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoria</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Bíblia</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Catecismo</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Total</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {results.sort((a, b) => {
                  const priority: Record<string, number> = { critical: 0, warning: 1, healthy: 2 };
                  return priority[a.status] - priority[b.status];
                }).map(item => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-bold text-foreground">{item.name}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">/{item.slug}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/5 text-primary/70">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-sm text-foreground/70">{item.counts.bible}</td>
                    <td className="p-4 text-center font-bold text-sm text-foreground/70">{item.counts.catechism}</td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-black ${item.counts.total === 0 ? 'text-red-500' : 'text-primary'}`}>
                        {item.counts.total}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {item.status === 'healthy' ? (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                      ) : item.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500 ml-auto" />
                      ) : (
                        <FileWarning className="w-5 h-5 text-red-500 ml-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-primary/10 bg-primary/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Dica de Melhoria</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-serif italic">
            Para temas com status "Crítico", adicione conteúdo na tabela `theme_contents` vinculando ao ID do tema, ou atualize a tabela `spiritual_contents` com a tag correspondente. O Nexus prioriza tags exatas ou sinônimos mapeados em `tagNormalization.ts`.
          </p>
        </Card>
        
        <Card className="rounded-3xl border-secondary/10 bg-secondary/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Icons.Star className="w-5 h-5 text-secondary" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Próximos Passos</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-serif italic">
            Sincronize o Catecismo local com o Nexus garantindo que as chaves em `CATECHISM_LOCAL_DATA` tenham tags que correspondam ao "slug" ou "nome" do tema. A auditoria acima valida tanto o banco de dados quanto os arquivos locais.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default NexusAuditPage;
