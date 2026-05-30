import { Button } from '@/components/ui/button';
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
  const [notCachedCount, setNotCachedCount] = useState(0);
  const [startPara, setStartPara] = useState(1);
  const [endPara, setEndPara] = useState(2865);
  const [batchSize, setBatchSize] = useState(10);

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
      
      const combinedData: CacheEntry[] = [...(cacheRes as CacheEntry[] || [])];
      
      // Calculate missing (not in cache and not in official)
      let missing = 0;
      for (let i = 1; i <= 2865; i++) {
        if (!cachedParas.has(i) && !officialParas.has(i)) {
          missing++;
          // Only add a few to the list to avoid performance issues
          if (combinedData.length < 1000) {
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
      setNotCachedCount(missing);
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
    if (filter === 'all') return item.status === 'error_402' || item.status === 'error' || item.status === 'not_cached' || !item.content || item.content.length < 50;
    if (filter === 'error_402') return item.status === 'error_402' || (item.status === 'error' && (item.last_error?.includes('402') || item.last_error?.includes('Créditos')));
    if (filter === 'not_cached') return item.status === 'not_cached';
    if (filter === 'empty') return item.status !== 'not_cached' && (!item.content || item.content.length < 50);
    return true;
  });

  const stats = {
    error402: data.filter(i => i.status === 'error_402' || (i.status === 'error' && (i.last_error?.includes('402') || i.last_error?.includes('Créditos')))).length,
    empty: data.filter(i => i.status !== 'not_cached' && i.status !== 'error_402' && (!i.content || i.content.length < 50)).length,
    notCached: notCachedCount,
    totalIssues: data.filter(i => i.status === 'error_402' || i.status === 'error' || i.status === 'not_cached' || !i.content || i.content.length < 50).length
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-xl">
        <Icons.Lock className="w-3xl h-3xl text-destructive mb-md opacity-20" />
        <h2 className="text-xl font-bold mb-xs">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta página é para administradores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-lg space-y-xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Integridade do Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Parágrafos sem conteúdo ou com erro de créditos</p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
           <Button 
            onClick={() => navigate('/catechism/debug')}
            className="px-md py-xs rounded-full border border-border text-xs font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-xs"
          >
            <Icons.Settings className="w-sm h-sm" /> Debug Geral
          </Button>

          <Button 
            onClick={() => navigate('/catechism/verify')}
            className="px-md py-xs rounded-full border border-border text-xs font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-xs"
          >
            <Icons.CheckCircle className="w-sm h-sm" /> Verificação de Seções
          </Button>

          
          <div className="flex items-center gap-xs bg-muted/50 p-2xs rounded-premium border border-border">
            <div className="flex items-center gap-2xs">
              <span className="text-xs font-bold text-muted-foreground uppercase px-2xs">De:</span>
              <input 
                type="number" 
                value={startPara} 
                onChange={e => setStartPara(Number(e.target.value))}
                className="w-3xl h-xl bg-background border border-border rounded-full text-xs font-bold text-center"
              />
            </div>
            <div className="flex items-center gap-2xs">
              <span className="text-xs font-bold text-muted-foreground uppercase px-2xs">Até:</span>
              <input 
                type="number" 
                value={endPara} 
                onChange={e => setEndPara(Number(e.target.value))}
                className="w-3xl h-xl bg-background border border-border rounded-full text-xs font-bold text-center"
              />
            </div>
            <div className="flex items-center gap-2xs ml-xs border-l border-border pl-xs">
              <span className="text-xs font-bold text-muted-foreground uppercase px-2xs">Lote:</span>
              <input 
                type="number" 
                value={batchSize} 
                onChange={e => setBatchSize(Number(e.target.value))}
                className="w-2xl h-xl bg-background border border-border rounded-full text-xs font-bold text-center"
              />
            </div>
            <Button 
              onClick={async () => {
                const missing = [];
                const cachedParas = new Set(data.map(d => d.paragraph));
                for(let i = startPara; i <= endPara; i++) {
                  if(!cachedParas.has(i)) missing.push(i);
                  if(missing.length >= batchSize) break;
                }
                if(missing.length === 0) {
                  toast.success('Nenhum gap detectado no intervalo!');
                  return;
                }
                toast.info(`Processando lote de ${missing.length} parágrafos...`);
                let successCount = 0;
                for(const p of missing) {
                  try {
                    const { data: res, error } = await supabase.functions.invoke('catechism-text', {
                      body: { paragraph: p, action: 'reprocess' }
                    });
                    if (!error && (res?.status === 'generated' || res?.status === 'official')) {
                      successCount++;
                    } else if (res?.status === 'error_402' || (res?.error && res.error.includes('402'))) {
                      toast.error(`Lote interrompido: créditos esgotados.`);
                      break;
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }
                toast.success(`Lote finalizado: ${successCount} parágrafos recuperados.`);
                loadData();
              }}
              disabled={isReprocessing}
              className="ml-xs px-md h-xl rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-xs shadow-md disabled:opacity-50"
            >
              <Icons.Zap className="w-sm h-sm" /> Iniciar
            </Button>
          </div>

          <Button 
            onClick={loadData}
            disabled={loading}
            className="p-xs rounded-full bg-card border border-border hover:bg-primary/10 transition-all disabled:opacity-50 ml-auto"
            title="Recarregar dados"
          >
            <Icons.RotateCcw className={`w-md h-md ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-card border border-border rounded-premium p-md">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nunca Acessados</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.notCached}</div>
        </div>
        <div className="bg-card border border-border rounded-premium p-md">
          <span className="text-xs font-black uppercase tracking-widest text-orange-500">Erro 402 (Créditos)</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.error402}</div>
        </div>
        <div className="bg-card border border-border rounded-premium p-md">
          <span className="text-xs font-black uppercase tracking-widest text-destructive">Incompletos</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.empty}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-premium overflow-hidden shadow-md">
        <div className="p-md border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-xs bg-background/50 border border-border rounded-premium p-2xs">
            <Button onClick={() => setFilter('all')} className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Todos</Button>
            <Button onClick={() => setFilter('not_cached')} className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${filter === 'not_cached' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Não Cacheado</Button>
            <Button onClick={() => setFilter('error_402')} className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${filter === 'error_402' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Erro 402</Button>
            <Button onClick={() => setFilter('empty')} className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${filter === 'empty' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Incompletos</Button>
          </div>
          <span className="text-xs text-muted-foreground uppercase font-black">
            {filteredData.length} itens encontrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-lg py-md">§ Parágrafo</th>
                <th className="px-lg py-md">Problema</th>
                <th className="px-lg py-md">Status Atual</th>
                <th className="px-lg py-md text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-lg py-2xl text-center text-muted-foreground animate-pulse">Carregando dados de integridade...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={4} className="px-lg py-2xl text-center text-muted-foreground italic">Nenhum parágrafo com problemas detectado.</td></tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-lg py-md font-bold text-primary font-serif">§{item.paragraph}</td>
                    <td className="px-lg py-md">
                      {item.status === 'error_402' || (item.status === 'error' && (item.last_error?.includes('402') || item.last_error?.includes('Créditos'))) ? (
                        <span className="text-xs text-orange-600 font-medium">Falta de Créditos IA</span>
                      ) : item.status === 'not_cached' ? (
                        <span className="text-xs text-blue-500 font-medium">Nunca Acessado / Sem Cache</span>
                      ) : (
                        <span className="text-xs text-destructive font-medium">Erro na Geração / Incompleto</span>
                      )}
                    </td>
                    <td className="px-lg py-md">
                      <span className="text-xs font-black uppercase tracking-widest px-xs py-3xs rounded-full bg-muted text-muted-foreground">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-lg py-md text-right">
                      <Button 
                        disabled={isReprocessing}
                        onClick={() => reprocessParagraph(item.paragraph)}
                        className="p-xs rounded-full hover:bg-primary/10 text-primary transition-all disabled:opacity-30"
                        title="Reprocessar agora"
                      >
                        <Icons.Zap className="w-md h-md" />
                      </Button>
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