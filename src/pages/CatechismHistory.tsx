import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CatechismHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: history, isLoading } = useQuery({
    queryKey: ['catechism-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('catechism_paragraphs_read')
        .select('paragraph, read_at')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const goBack = () => navigate('/catechism');

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 min-h-screen">
      <SEOHead 
        title="Histórico de Leitura do Catecismo | Cathedra" 
        description="Visualize seus últimos parágrafos lidos e continue sua formação na fé."
        path="/catechism/history"
      />

      <div className="flex items-center gap-4">
        <button 
          onClick={goBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all"
        >
          <Icons.ArrowDown className="w-5 h-5 rotate-90" />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Histórico de Leitura</h1>
          <p className="text-muted-foreground">Seus últimos 50 parágrafos lidos no Catecismo.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6 animate-pulse bg-muted/20 h-24" />
          ))}
        </div>
      ) : history && history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item, index) => (
            <motion.div
              key={`${item.paragraph}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                onClick={() => navigate(`/catechism?p=${item.paragraph}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    §{item.paragraph}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Lido há</div>
                    <div className="text-sm font-medium truncate">
                      {formatDistanceToNow(new Date(item.read_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
          <Icons.History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold">Nenhum histórico encontrado</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Comece a ler o Catecismo para acompanhar seu progresso aqui.</p>
          <Button variant="default" onClick={goBack} className="mt-6">
            Começar a ler
          </Button>
        </div>
      )}
    </div>
  );
};

export default CatechismHistory;