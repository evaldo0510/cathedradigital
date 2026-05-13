import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchNexusTagContent, type TagContent } from '@/lib/nexusContent';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/constants';
import { 
  Loader2, AlertTriangle, CheckCircle, Search, FileWarning, 
  Database, Sparkles, Filter, Download, FileText, ExternalLink,
  ChevronDown, ChevronUp, Link as LinkIcon, Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  variations: string[];
}

const NexusAuditPage: React.FC = () => {
  const [isAuditing, setIsAuditng] = useState(false);
  const [results, setResults] = useState<ThemeAudit[]>([]);
  const [progress, setProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: themes, isLoading: loadingThemes } = useQuery({
    queryKey: ['audit-themes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('themes').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const categories = useMemo(() => {
    if (!themes) return [];
    return Array.from(new Set(themes.map(t => t.category)));
  }, [themes]);

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

        // Normalized variations
        const variations = [
          theme.slug,
          theme.slug.replace(/_/g, '-'),
          theme.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_'),
          theme.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
        ];

        auditResults.push({
          id: theme.id,
          name: theme.name,
          slug: theme.slug,
          category: theme.category,
          counts,
          status,
          variations: Array.from(new Set(variations))
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

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.slug.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [results, filterStatus, filterCategory, searchTerm]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    return {
      total: results.length,
      critical: results.filter(r => r.status === 'critical').length,
      warning: results.filter(r => r.status === 'warning').length,
      healthy: results.filter(r => r.status === 'healthy').length,
    };
  }, [results]);

  const exportCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = ['Tema', 'Slug', 'Categoria', 'Bíblia', 'Catecismo', 'Magistério', 'Jornada', 'Total', 'Status'];
    const rows = filteredResults.map(r => [
      r.name,
      r.slug,
      r.category,
      r.counts.bible,
      r.counts.catechism,
      r.counts.magisterium,
      r.counts.journey,
      r.counts.total,
      r.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `nexus_audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (filteredResults.length === 0) return;
    const doc = new jsPDF();
    doc.text('Relatório de Auditoria Nexus', 14, 15);
    
    const tableRows = filteredResults.map(r => [
      r.name,
      r.category,
      r.counts.bible,
      r.counts.catechism,
      r.counts.total,
      r.status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [['Tema', 'Categoria', 'Bíblia', 'Catecismo', 'Total', 'Status']],
      body: tableRows,
      startY: 20,
    });

    doc.save(`nexus_audit_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-8 px-4">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary border border-primary/20">
          <Database className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nexus Intelligence</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Auditoria do Nexus</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">Diagnóstico de cobertura e mapeamento de termos para conexões teológicas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total de Temas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-serif font-bold text-primary">{themes?.length || '--'}</p>
          </CardContent>
        </Card>
        
        {stats && (
          <>
            <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden shadow-sm hover:border-green-500/30 transition-colors cursor-pointer" onClick={() => setFilterStatus('healthy')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-green-600">Saudáveis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-serif font-bold text-green-600">{stats.healthy}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden shadow-sm hover:border-amber-500/30 transition-colors cursor-pointer" onClick={() => setFilterStatus('warning')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-600">Avisos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-serif font-bold text-amber-600">{stats.warning}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden shadow-sm hover:border-red-500/30 transition-colors cursor-pointer" onClick={() => setFilterStatus('critical')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-red-600">Críticos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-serif font-bold text-red-600">{stats.critical}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary" /> Painel de Auditoria
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {results.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                  <Download className="w-3.5 h-3.5 mr-2" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportPDF} className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                  <FileText className="w-3.5 h-3.5 mr-2" /> PDF
                </Button>
              </>
            )}
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
                'Recalcular Auditoria'
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input 
              placeholder="Buscar tema ou slug..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="h-10 px-3 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os Status</option>
            <option value="healthy">Saudável</option>
            <option value="warning">Aviso</option>
            <option value="critical">Crítico</option>
          </select>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 px-3 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center justify-end px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Mostrando {filteredResults.length} de {results.length}
            </p>
          </div>
        </div>

        {!isAuditing && results.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Icons.Zap className="w-12 h-12 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground font-serif italic">Clique em "Recalcular Auditoria" para analisar a integridade do Nexus.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-muted/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/40">
                    <th className="p-4 w-10"></th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tema</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoria</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Resultados</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredResults.sort((a, b) => {
                    const priority: Record<string, number> = { critical: 0, warning: 1, healthy: 2 };
                    return priority[a.status] - priority[b.status];
                  }).map(item => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`hover:bg-muted/20 transition-colors cursor-pointer ${expandedRow === item.id ? 'bg-muted/30' : ''}`}
                        onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                      >
                        <td className="p-4">
                          {expandedRow === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-foreground">{item.name}</p>
                          <p className="text-[9px] font-mono text-muted-foreground">/{item.slug}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/5 text-primary/70">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-[10px] space-y-0.5">
                              <span className="block text-muted-foreground">B: {item.counts.bible}</span>
                              <span className="block text-muted-foreground">C: {item.counts.catechism}</span>
                            </div>
                            <span className={`text-sm font-black w-8 ${item.counts.total === 0 ? 'text-red-500' : 'text-primary'}`}>
                              {item.counts.total}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {item.status === 'healthy' ? (
                            <div className="flex items-center justify-end gap-2 text-green-500">
                              <span className="text-[8px] font-black uppercase tracking-tighter hidden md:inline">Saudável</span>
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          ) : item.status === 'warning' ? (
                            <div className="flex items-center justify-end gap-2 text-amber-500">
                              <span className="text-[8px] font-black uppercase tracking-tighter hidden md:inline">Baixa Cobertura</span>
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2 text-red-500">
                              <span className="text-[8px] font-black uppercase tracking-tighter hidden md:inline">Sem Conteúdo</span>
                              <FileWarning className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                      </tr>
                      {expandedRow === item.id && (
                        <tr className="bg-muted/5">
                          <td colSpan={5} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <Sparkles className="w-3 h-3" /> Variações de Busca (Normalização)
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {item.variations.map(v => (
                                    <code key={v} className="text-[10px] bg-background border border-border px-2 py-1 rounded-md text-primary font-mono">
                                      {v}
                                    </code>
                                  ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground italic font-serif">
                                  O Nexus tenta encontrar conteúdo usando estas variações automaticamente. Se nenhuma retornar resultados, considere cadastrar um sinônimo manual.
                                </p>
                              </div>
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <LinkIcon className="w-3 h-3" /> Ações Corretivas
                                </h4>
                                <div className="flex flex-col gap-2">
                                  <Button variant="outline" size="sm" className="justify-start rounded-xl h-9 text-[10px] font-bold" onClick={() => window.open('/admin?tab=content', '_blank')}>
                                    <Plus className="w-3 h-3 mr-2 text-primary" /> Vincular Novo Conteúdo Teológico
                                  </Button>
                                  <Button variant="outline" size="sm" className="justify-start rounded-xl h-9 text-[10px] font-bold" onClick={() => window.open('/admin?tab=nexus', '_blank')}>
                                    <Sparkles className="w-3 h-3 mr-2 text-amber-500" /> Gerenciar Sinônimos para "{item.name}"
                                  </Button>
                                  <Button variant="ghost" size="sm" className="justify-start rounded-xl h-9 text-[10px] font-bold text-muted-foreground">
                                    <ExternalLink className="w-3 h-3 mr-2" /> Ver todos os {item.counts.total} resultados
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 pb-20">
        <Card className="rounded-3xl border-primary/10 bg-primary/5 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Lógica de Auditoria</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-serif italic">
            Status <span className="text-red-600 font-bold">Crítico</span>: Zero resultados encontrados em todas as bases (Bíblia, Catecismo, Magistério e Jornadas).<br />
            Status <span className="text-amber-600 font-bold">Aviso</span>: Menos de 3 conexões teológicas ativas para o tema.<br />
            Status <span className="text-green-600 font-bold">Saudável</span>: Cobertura ampla com 3 ou mais resultados.
          </p>
        </Card>
        
        <Card className="rounded-3xl border-secondary/10 bg-secondary/5 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Icons.Star className="w-5 h-5 text-secondary" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Normalização Hífen vs Sublinhado</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-serif italic">
            O Nexus unifica slugs usando <code className="bg-background px-1 rounded">_</code> (ex: espirito_santo). No entanto, o sistema de busca também valida variações com <code className="bg-background px-1 rounded">-</code> para garantir compatibilidade com diferentes fontes de dados.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default NexusAuditPage;
