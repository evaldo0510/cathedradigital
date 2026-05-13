import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface HistoryListProps {
  history: any[] | undefined;
  isLoading: boolean;
  onNavigateToCatechism: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, isLoading, onNavigateToCatechism }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="p-6 animate-pulse bg-muted/20 h-24" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
        <Icons.History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-bold">Nenhum histórico encontrado</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">Comece a ler o Catecismo para acompanhar seu progresso aqui.</p>
        <Button variant="default" onClick={onNavigateToCatechism} className="mt-6">
          Começar a ler
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {history.map((item, index) => (
        <motion.div
          key={`${item.paragraph}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group border-border/50"
            onClick={() => navigate(`/catechism?p=${item.paragraph}`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                §{item.paragraph}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Icons.History className="w-3 h-3" /> Lido há
                  </div>
                  <div 
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-500/80 bg-green-500/5 px-2 py-0.5 rounded-full border border-green-500/10" 
                    title={`Sincronizado com sucesso em ${format(new Date(item.read_at), "dd/MM/yyyy HH:mm:ss")}`}
                  >
                    <Icons.Check className="w-2.5 h-2.5" /> Sincronizado {format(new Date(item.read_at), "HH:mm")}
                  </div>
                </div>
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
  );
};

export default HistoryList;
