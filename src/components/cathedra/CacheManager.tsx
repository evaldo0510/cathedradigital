import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  getAllFromStore, 
  deleteFromStore, 
  clearAllCaches, 
  exportCache, 
  importCache, 
  preloadCatechism, 
  preloadBible,
  getCacheStats
} from '@/lib/offlineCache';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

interface CacheItem {
  key: string;
  cachedAt: number;
  store: string;
}

const CacheManager: React.FC = () => {
  const [items, setItems] = useState<CacheItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bible' | 'catechism' | 'liturgy'>('all');
  const [stats, setStats] = useState<any>(null);
  const [preloading, setPreloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preloadCount, setPreloadCount] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCache = async () => {
    setLoading(true);
    const bible = (await getAllFromStore('bible')).map(i => ({ ...i, store: 'bible' }));
    const catechism = (await getAllFromStore('catechism')).map(i => ({ ...i, store: 'catechism' }));
    const liturgy = (await getAllFromStore('liturgy')).map(i => ({ ...i, store: 'liturgy' }));
    
    setItems([...bible, ...catechism, ...liturgy] as CacheItem[]);
    const s = await getCacheStats();
    setStats(s);
    setLoading(false);
  };

  useEffect(() => {
    loadCache();
  }, []);

  const handleDelete = async (store: string, key: string) => {
    await deleteFromStore(store, key);
    setItems(prev => prev.filter(i => !(i.store === store && i.key === key)));
    const s = await getCacheStats();
    setStats(s);
    toast.success('Item removido do cache local');
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja limpar todo o cache local? Você precisará de internet para carregar estes textos novamente.')) {
      await clearAllCaches();
      setItems([]);
      setStats(null);
      toast.success('Cache local limpo com sucesso');
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportCache();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cathedra-cache-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Cache exportado com sucesso');
    } catch (e) {
      toast.error('Erro ao exportar cache');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        await importCache(json);
        toast.success('Cache importado com sucesso');
        loadCache();
      } catch (e) {
        toast.error('Erro ao importar cache. Verifique o arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handlePreload = async (type: 'bible' | 'catechism') => {
    setPreloading(true);
    setProgress(0);
    try {
      if (type === 'catechism') {
        // Start from last cached paragraph or paragraph 1
        const catechismItems = items.filter(i => i.store === 'catechism');
        const lastP = catechismItems.length > 0 
          ? Math.max(...catechismItems.map(i => parseInt(i.key.split(':')[1])))
          : 0;
        await preloadCatechism(lastP + 1, preloadCount, setProgress);
      } else {
        // Just preload first 10 chapters of Genesis for now, or something simple
        await preloadBible('Gn', 1, preloadCount, setProgress);
      }
      toast.success('Pré-carregamento concluído');
      loadCache();
    } catch (e) {
      toast.error('Erro durante pré-carregamento');
    } finally {
      setPreloading(false);
    }
  };

  const handleSyncNow = async () => {
    if (navigator.onLine) {
      toast.promise(loadCache(), {
        loading: 'Sincronizando com a nuvem...',
        success: 'Sincronização concluída',
        error: 'Erro ao sincronizar'
      });
    } else {
      toast.error('Você está offline. Conecte-se para sincronizar.');
    }
  };

  const filteredItems = items.filter(i => filter === 'all' || i.store === filter);

  const getStoreIcon = (store: string) => {
    switch(store) {
      case 'bible': return <Icons.Bible className="w-spacing-md h-spacing-md" />;
      case 'catechism': return <Icons.ShieldCheck className="w-spacing-md h-spacing-md" />;
      case 'liturgy': return <Icons.Sun className="w-spacing-md h-spacing-md" />;
      default: return <Icons.FileText className="w-spacing-md h-spacing-md" />;
    }
  };

  const getStoreLabel = (store: string) => {
    switch(store) {
      case 'bible': return 'Bíblia';
      case 'catechism': return 'Catecismo';
      case 'liturgy': return 'Liturgia';
      default: return store;
    }
  };

  return (
    <div className="max-w-spacing-4xl mx-auto py-spacing-xl px-spacing-md space-y-spacing-xl animate-in fade-in slide-in-from-bottom-spacing-md duration-700">
      <SEOHead title="Gerenciar Cache Local" description="Gerencie os textos salvos offline no seu dispositivo." path="/cache-manager" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-spacing-md">
        <div className="space-y-spacing-2xs">
          <h1 className="text-premium-3xl font-serif font-bold text-foreground">Sanctuarium Offline</h1>
          <p className="text-muted-foreground">Gerencie a soberania dos seus dados e textos salvos localmente.</p>
        </div>
        <div className="flex items-center gap-spacing-xs">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-premium-full h-spacing-xl px-spacing-lg font-bold"
            onClick={handleSyncNow}
          >
            <Icons.RotateCcw className="w-spacing-md h-spacing-md mr-spacing-xs" /> Sincronizar
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="rounded-premium-full h-spacing-xl px-spacing-lg font-bold"
            onClick={handleClearAll}
            disabled={items.length === 0}
          >
            <Icons.Trash className="w-spacing-md h-spacing-md mr-spacing-xs" /> Limpar Tudo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-md">
        <Card className="rounded-[2rem] bg-muted/20 border-border/40">
          <CardHeader className="pb-spacing-xs">
            <CardDescription className="text-premium-xs font-black uppercase tracking-widest flex items-center gap-spacing-xs">
              <Icons.Database className="w-spacing-sm h-spacing-sm" /> Status do Cache
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-premium-2xl font-serif font-bold text-foreground">{stats?.total || 0} Itens</div>
            <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">
              Última sincronização: {stats?.lastSync ? format(parseInt(stats.lastSync), "dd/MM 'às' HH:mm", { locale: ptBR }) : 'Nunca'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] bg-muted/20 border-border/40">
          <CardHeader className="pb-spacing-xs">
            <CardDescription className="text-premium-xs font-black uppercase tracking-widest flex items-center gap-spacing-xs">
              <Icons.Share2 className="w-spacing-sm h-spacing-sm" /> Portabilidade
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-spacing-xs">
            <Button variant="outline" size="sm" className="rounded-premium-full flex-1 h-spacing-xl text-premium-xs font-black uppercase" onClick={handleExport}>
              Exportar
            </Button>
            <Button variant="outline" size="sm" className="rounded-premium-full flex-1 h-spacing-xl text-premium-xs font-black uppercase" onClick={() => fileInputRef.current?.click()}>
              Importar
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] bg-muted/20 border-border/40">
          <CardHeader className="pb-spacing-xs">
            <CardDescription className="text-premium-xs font-black uppercase tracking-widest flex items-center gap-spacing-xs">
              <Icons.Download className="w-spacing-sm h-spacing-sm" /> Pré-carregar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-spacing-sm">
            <div className="flex items-center gap-spacing-xs">
              <Input 
                type="number" 
                value={preloadCount} 
                onChange={(e) => setPreloadCount(parseInt(e.target.value))}
                className="h-spacing-xl w-spacing-3xl text-premium-xs rounded-premium-full"
              />
              <span className="text-premium-xs font-bold text-muted-foreground uppercase">unid.</span>
            </div>
            <div className="flex gap-spacing-xs">
              <Button variant="secondary" size="sm" className="rounded-premium-full flex-1 h-spacing-xl text-premium-xs font-black uppercase" onClick={() => handlePreload('catechism')} disabled={preloading}>
                Catecismo
              </Button>
              <Button variant="secondary" size="sm" className="rounded-premium-full flex-1 h-spacing-xl text-premium-xs font-black uppercase" onClick={() => handlePreload('bible')} disabled={preloading}>
                Bíblia
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {preloading && (
        <div className="space-y-spacing-xs animate-in fade-in slide-in-from-top-spacing-xs">
          <div className="flex justify-between text-premium-xs font-black uppercase tracking-widest text-primary">
            <span>Pré-carregando conteúdo...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-spacing-2xs" />
        </div>
      )}

      <div className="flex items-center gap-spacing-xs overflow-x-auto pb-spacing-xs scrollbar-none">
        {(['all', 'bible', 'catechism', 'liturgy'] as const).map(f => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f 
                ? 'bg-primary text-primary-foreground shadow-premium' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {f === 'all' ? 'Todos os Itens' : getStoreLabel(f)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-spacing-md">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-spacing-4xl rounded-premium bg-muted/40 animate-pulse" />
          ))
        ) : filteredItems.length === 0 ? (
          <Card className="rounded-[2.5rem] border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-spacing-3xl space-y-spacing-md">
              <div className="p-spacing-md rounded-premium bg-background border border-border shadow-premium-md">
                <Icons.Library className="w-spacing-xl h-spacing-xl text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium italic">Nenhum texto encontrado neste filtro.</p>
              <Button variant="outline" className="rounded-premium-full" onClick={() => window.history.back()}>Voltar</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-spacing-sm">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div
                  key={`${item.store}-${item.key}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="rounded-premium border-border/40 shadow-premium-md overflow-hidden group hover:shadow-premium transition-all">
                    <CardContent className="p-spacing-md flex items-center justify-between gap-spacing-md">
                      <div className="flex items-center gap-spacing-md">
                        <div className={`p-spacing-sm rounded-premium-full bg-muted/50 text-primary group-hover:bg-primary group-hover:text-white transition-all`}>
                          {getStoreIcon(item.store)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-premium-sm text-foreground truncate">{item.key.replace('p:', 'Parágrafo ').replace(':', ' Cap. ')}</p>
                          <div className="flex items-center gap-spacing-xs text-premium-xs text-muted-foreground font-medium">
                            <span className="uppercase tracking-wider">{getStoreLabel(item.store)}</span>
                            <span className="w-spacing-2xs h-spacing-2xs rounded-premium-full bg-border" />
                            <span>Salvo {formatDistanceToNow(item.cachedAt, { addSuffix: true, locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleDelete(item.store, item.key)}
                        className="p-spacing-xs rounded-premium-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Remover do cache"
                      >
                        <Icons.X className="w-spacing-md h-spacing-md" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="bg-secondary/5 rounded-[2.5rem] p-spacing-xl border border-secondary/20 space-y-spacing-md">
        <div className="flex items-center gap-spacing-sm text-secondary">
          <Icons.ShieldCheck className="w-spacing-md h-spacing-md" />
          <h2 className="text-premium-lg font-serif font-bold">Nota sobre Soberania de Dados</h2>
        </div>
        <p className="text-premium-sm text-muted-foreground leading-relaxed">
          O Cathedra utiliza o armazenamento local do seu navegador (IndexedDB) para garantir que você possa acessar os textos sagrados mesmo sem conexão. 
          Estes arquivos nunca saem do seu dispositivo e podem ser exportados para portabilidade completa. 
          Limpar o cache aqui liberará espaço, mas exigirá uma nova conexão para baixar os conteúdos.
        </p>
      </div>
    </div>
  );
};

export default CacheManager;
