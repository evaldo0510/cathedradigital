import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllFromStore, deleteFromStore, clearAllCaches } from '@/lib/offlineCache';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CacheItem {
  key: string;
  cachedAt: number;
  store: string;
}

const CacheManager: React.FC = () => {
  const [items, setItems] = useState<CacheItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bible' | 'catechism' | 'liturgy'>('all');

  const loadCache = async () => {
    setLoading(true);
    const bible = (await getAllFromStore('bible')).map(i => ({ ...i, store: 'bible' }));
    const catechism = (await getAllFromStore('catechism')).map(i => ({ ...i, store: 'catechism' }));
    const liturgy = (await getAllFromStore('liturgy')).map(i => ({ ...i, store: 'liturgy' }));
    
    setItems([...bible, ...catechism, ...liturgy] as CacheItem[]);
    setLoading(false);
  };

  useEffect(() => {
    loadCache();
  }, []);

  const handleDelete = async (store: string, key: string) => {
    await deleteFromStore(store, key);
    setItems(prev => prev.filter(i => !(i.store === store && i.key === key)));
    toast.success('Item removido do cache local');
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja limpar todo o cache local? Você precisará de internet para carregar estes textos novamente.')) {
      await clearAllCaches();
      setItems([]);
      toast.success('Cache local limpo com sucesso');
    }
  };

  const filteredItems = items.filter(i => filter === 'all' || i.store === filter);

  const getStoreIcon = (store: string) => {
    switch(store) {
      case 'bible': return <Icons.Bible className="w-4 h-4" />;
      case 'catechism': return <Icons.ShieldCheck className="w-4 h-4" />;
      case 'liturgy': return <Icons.Sun className="w-4 h-4" />;
      default: return <Icons.FileText className="w-4 h-4" />;
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
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SEOHead title="Gerenciar Cache Local" description="Gerencie os textos salvos offline no seu dispositivo." path="/cache-manager" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-foreground">Sanctuarium Offline</h1>
          <p className="text-muted-foreground">Gerencie a soberania dos seus dados e textos salvos localmente.</p>
        </div>
        <Button 
          variant="destructive" 
          size="sm" 
          className="rounded-xl h-11 px-6 font-bold"
          onClick={handleClearAll}
          disabled={items.length === 0}
        >
          <Icons.Trash className="w-4 h-4 mr-2" /> Limpar Tudo
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(['all', 'bible', 'catechism', 'liturgy'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {f === 'all' ? 'Todos os Itens' : getStoreLabel(f)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-3xl bg-muted/40 animate-pulse" />
          ))
        ) : filteredItems.length === 0 ? (
          <Card className="rounded-[2.5rem] border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="p-4 rounded-full bg-background border border-border shadow-inner">
                <Icons.Library className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium italic">Nenhum texto encontrado neste filtro.</p>
              <Button variant="outline" className="rounded-2xl" onClick={() => window.history.back()}>Voltar</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
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
                  <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-muted/50 text-primary group-hover:bg-primary group-hover:text-white transition-all`}>
                          {getStoreIcon(item.store)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{item.key.replace('p:', 'Parágrafo ')}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                            <span className="uppercase tracking-wider">{getStoreLabel(item.store)}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>Salvo {formatDistanceToNow(item.cachedAt, { addSuffix: true, locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(item.store, item.key)}
                        className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Remover do cache"
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="bg-secondary/5 rounded-[2.5rem] p-8 border border-secondary/20 space-y-4">
        <div className="flex items-center gap-3 text-secondary">
          <Icons.ShieldCheck className="w-5 h-5" />
          <h2 className="text-lg font-serif font-bold">Nota sobre Soberania de Dados</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O Cathedra utiliza o armazenamento local do seu navegador (IndexedDB) para garantir que você possa acessar os textos sagrados mesmo sem conexão. 
          Estes arquivos nunca saem do seu dispositivo e são criptografados pelo sistema operacional. 
          Limpar o cache aqui liberará espaço, mas exigirá uma nova conexão para baixar os conteúdos.
        </p>
      </div>
    </div>
  );
};

export default CacheManager;
