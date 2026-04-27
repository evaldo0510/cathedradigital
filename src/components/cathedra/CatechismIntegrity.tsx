import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

interface CacheEntry {
  id: string;
  paragraph: number;
  content: string;
  status: 'generated' | 'error_402' | 'error' | 'official' | 'static' | 'not_cached';
  last_error: string | null;
  retry_count: number;
}

const CatechismIntegrity: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error_402' | 'not_cached' | 'empty'>('all');

  const isAdmin = profile?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    
    // Get everything from cache
    const { data: cacheRes, error: cacheError } = await supabase
      .from('catechism_cache')
      .select('id, paragraph, content, status, last_error, retry_count')
      .order('paragraph', { ascending: true });

    // Get paragraph numbers from official
    const { data: officialRes, error: officialError } = await supabase
      .from('catechism_official')
      .select('paragraph');

    if (cacheError || officialError) {
      toast.error('Erro ao carregar dados de integridade');
    } else {
      const cachedParas = new Set((cacheRes || []).map(c => c.paragraph));
      const officialParas = new Set((officialRes || []).map(o => o.paragraph));
      
      const combinedData = [...(cacheRes || [])];
      
      // Calculate missing (not in cache and not in official)
      const missingCount = [];
      for (let i = 1; i <= 2865; i++) {
        if (!cachedParas.has(i) && !officialParas.has(i)) {
          missingCount.push(i);
          // Only add a few to the list to avoid performance issues
          if (combinedData.length < 500) {
            combinedData.push({
              id: `missing-${i}`,
              paragraph: i,
              content: '',
              status: 'not_cached',
              last_error: null,
              retry_count: 0
            });
          }
        }
      }
      
      setData(combinedData.sort((a, b) => a.paragraph - b.paragraph));
      setNotCachedCount(missingCount.length);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const reprocessParagraph = async (paragraph: number) => {
    setIsReprocessing(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('catechism-text', {
        body: { paragraph, action: 'reprocess' }
      });
      if (!error && (res?.status === 'generated' || res?.status === 'official')) {
        toast.success(`§${paragraph} reprocessado com sucesso`);
        loadData();
      } else {
        toast.error(`Falha ao reprocessar §${paragraph}`);
      }
    } catch (err) {
      toast.error('Erro de conexão com o servidor');
    } finally {
      setIsReprocessing(false);
    }
  };

  const filteredData = data.filter(item => {
    if (filter === 'all') return item.status === 'error_402' || !item.content || item.content.length < 50;
    if (filter === 'error_402') return item.status === 'error_402';
    if (filter === 'empty') return !item.content || item.content.length < 50;
    return true;
  });

  const stats = {
    error402: data.filter(i => i.status === 'error_402').length,
    empty: data.filter(i => !i.content || i.content.length < 50).length,
    totalIssues: data.filter(i => i.status === 'error_402' || !i.content || i.content.length < 50).length
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Icons.Lock className="w-16 h-16 text-destructive mb-4 opacity-20" />
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta página é para administradores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Integridade do Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Parágrafos sem conteúdo ou com erro de créditos</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => navigate('/catechism/debug')}
            className="px-4 py-2 rounded-xl border border-border text-xs font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-2"
          >
            <Icons.Settings className="w-3 h-3" /> Debug Geral
          </button>
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all disabled:opacity-50"
          >
            <Icons.RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total com Problemas</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.totalIssues}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Erro 402 (Créditos)</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.error402}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Sem Conteúdo</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.empty}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg p-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Todos</button>
            <button onClick={() => setFilter('error_402')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filter === 'error_402' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Erro 402</button>
            <button onClick={() => setFilter('empty')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filter === 'empty' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Vazios</button>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-black">
            {filteredData.length} itens encontrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4">§ Parágrafo</th>
                <th className="px-6 py-4">Problema</th>
                <th className="px-6 py-4">Status Atual</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground animate-pulse">Carregando dados de integridade...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">Nenhum parágrafo com problemas detectado.</td></tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary font-serif">§{item.paragraph}</td>
                    <td className="px-6 py-4">
                      {item.status === 'error_402' ? (
                        <span className="text-xs text-orange-600 font-medium">Falta de Créditos IA</span>
                      ) : (
                        <span className="text-xs text-destructive font-medium">Conteúdo Incompleto</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        disabled={isReprocessing}
                        onClick={() => reprocessParagraph(item.paragraph)}
                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all disabled:opacity-30"
                        title="Reprocessar agora"
                      >
                        <Icons.Zap className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CatechismIntegrity;
