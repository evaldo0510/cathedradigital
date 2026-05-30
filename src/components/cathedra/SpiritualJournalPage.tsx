import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CathedraCard } from './CathedraCard';
import { HomeButton } from './HomeButton';
import StudyJournal from './StudyJournal';

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  entry_date: string;
  created_at: string;
}

const MOODS = [
  { id: 'peace', icon: Icons.Sun, label: 'Paz' },
  { id: 'gratitude', icon: Icons.Heart, label: 'Gratidão' },
  { id: 'contrition', icon: Icons.Flame, label: 'Contrição' },
  { id: 'hope', icon: Icons.Sparkles, label: 'Esperança' },
  { id: 'struggle', icon: Icons.ShieldQuestion, label: 'Luta' },
];

type JournalTab = 'reflection' | 'study' | 'relatio';

const SpiritualJournalPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<JournalTab>('reflection');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('peace');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchEntries = async () => {
    if (!user) return;
    setIsFetching(true);
    const { data, error } = await supabase
      .from('spiritual_journal')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(30);
    
    if (error) {
      console.error('Error fetching journal:', error);
    } else {
      setEntries(data as JournalEntry[]);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const saveEntry = async () => {
    if (!user || !content.trim()) return;
    
    setIsLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('spiritual_journal')
      .upsert({
        user_id: user.id,
        content: content.trim(),
        mood,
        entry_date: today,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao salvar reflexão');
      console.error(error);
    } else {
      toast.success('Reflexão guardada no coração!');
      setContent('');
      fetchEntries();
    }
    setIsLoading(false);
  };

  return (
    <div className="app-container py-spacing-2xl md:py-spacing-4xl space-y-spacing-3xl md:space-y-spacing-4xl">
      <SEOHead title="Diário Espiritual - Reflexão e Oração" description="Guarde suas reflexões diárias e acompanhe seu crescimento espiritual." path="/diario" />
      
      <header className="text-center space-y-spacing-xl max-w-spacing-3xl mx-auto">
        <div className="premium-tag mx-auto">
          <Icons.PenLine className="w-spacing-md h-spacing-md text-secondary" />
          <span>Diarium Spirituale</span>
        </div>
        <h1 className="text-premium-4xl md:text-7xl font-display font-bold text-primary tracking-tight">
          Diário Espiritual
        </h1>
        <p className="text-premium-lg md:text-premium-xl text-primary/60 italic font-serif leading-relaxed">
          "Examina, ó minha alma, o que fizeste hoje diante de Deus."
        </p>
      </header>

      <div className="flex justify-center">
        <div className="inline-flex bg-muted/20 p-spacing-xs rounded-premium-full border border-border/10 backdrop-blur-sm">
          <Button
            variant={activeTab === 'reflection' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('reflection')}
            className={`rounded-premium-full px-spacing-xl py-spacing-lg h-spacing-2xl text-premium-sm font-bold transition-all ${activeTab === 'reflection' ? 'shadow-premium scale-105' : ''}`}
          >
            <Icons.Sun className="w-spacing-md h-spacing-md mr-spacing-xs" /> Reflexão Diária
          </Button>
          <Button
            variant={activeTab === 'study' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('study')}
            className={`rounded-premium-full px-spacing-xl py-spacing-lg h-spacing-2xl text-premium-sm font-bold transition-all ${activeTab === 'study' ? 'shadow-premium scale-105' : ''}`}
          >
            <Icons.BookOpen className="w-spacing-md h-spacing-md mr-spacing-xs" /> Estudo e Leitura
          </Button>
          <Button
            variant={activeTab === 'relatio' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('relatio')}
            className={`rounded-premium-full px-spacing-xl py-spacing-lg h-spacing-2xl text-premium-sm font-bold transition-all ${activeTab === 'relatio' ? 'shadow-premium scale-105' : ''}`}
          >
            <Icons.Sparkles className="w-spacing-md h-spacing-md mr-spacing-xs" /> Conexões Salvas
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'reflection' && (
          <motion.div
            key="reflection"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-spacing-3xl md:space-y-spacing-4xl"
          >
            {/* Entry Form */}
            <section className="max-w-spacing-4xl mx-auto w-full">
              <CathedraCard padding="lg" className="space-y-spacing-3xl">
                <div className="space-y-spacing-xl">
                  <h3 className="text-premium-2xl font-display font-bold text-primary text-center">Como está sua alma hoje?</h3>
                  <div className="flex flex-wrap justify-center gap-spacing-lg">
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMood(m.id)}
                        className={`flex flex-col items-center gap-spacing-md p-spacing-lg rounded-premium border transition-all duration-700 ${
                          mood === m.id 
                            ? 'bg-primary border-primary text-primary-foreground shadow-premium scale-105' 
                            : 'bg-muted/30 border-border/10 text-foreground/40 hover:border-primary/20 hover:bg-muted/50'
                        }`}
                      >
                        <m.icon className="w-spacing-xl h-spacing-xl" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-spacing-xl">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva sua reflexão, gratidão ou pedido de perdão..."
                    className="min-h-[300px] rounded-premium border-border/20 p-spacing-xl md:p-spacing-2xl font-serif text-premium-xl md:text-premium-2xl leading-relaxed focus-visible:ring-primary/10 bg-muted/10 border-none shadow-premium-md resize-none placeholder:italic placeholder:opacity-30"
                  />
                  <div className="flex justify-center">
                    <HomeButton 
                      onClick={saveEntry}
                      disabled={isLoading || !content.trim()}
                      variant="primary"
                      className="px-spacing-3xl h-spacing-2xl"
                    >
                      {isLoading ? 'Guardando...' : 'Guardar Reflexão'}
                    </HomeButton>
                  </div>
                </div>
              </CathedraCard>
            </section>

            {/* History */}
            <section className="space-y-spacing-2xl max-w-spacing-4xl mx-auto w-full">
              <div className="flex items-center gap-spacing-xl">
                <div className="h-px flex-1 bg-border/40" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.6em] text-primary/60 whitespace-nowrap uppercase">
                  Memória da Alma
                </h2>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              {isFetching ? (
                <div className="space-y-spacing-xl">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-spacing-4xl bg-muted/10 animate-pulse rounded-premium border border-border/10" />
                  ))}
                </div>
              ) : entries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-spacing-2xl">
                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card p-spacing-xl md:p-spacing-2xl rounded-premium border border-border/40 shadow-premium space-y-spacing-xl relative overflow-hidden group hover:border-primary/20 transition-all duration-700 h-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-spacing-md">
                          <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 text-secondary flex items-center justify-center">
                            {MOODS.find(m => m.id === entry.mood)?.icon({ className: "w-spacing-lg h-spacing-lg" }) || <Icons.Sun className="w-spacing-lg h-spacing-lg" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-spacing-2xs">Registro de Graça</p>
                            <span className="text-premium-sm font-serif font-bold text-primary">
                              {format(new Date(entry.entry_date + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <Icons.Quote className="w-spacing-xl h-spacing-xl text-primary/5" />
                      </div>
                      <p className="text-premium-xl md:text-premium-2xl text-primary/80 font-serif italic leading-relaxed whitespace-pre-wrap pl-spacing-lg border-l-2 border-secondary/20">
                        "{entry.content}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-spacing-4xl opacity-20 hover:opacity-40 transition-opacity duration-1000">
                  <Icons.PenLine className="w-spacing-3xl h-spacing-3xl mx-auto mb-spacing-lg stroke-1" />
                  <p className="font-serif italic text-premium-xl">Nenhuma reflexão guardada ainda.</p>
                </div>
              )}
            </section>
          </motion.div>
        )}

        {activeTab === 'study' && (
          <motion.div
            key="study"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-6xl mx-auto w-full"
          >
            <StudyJournal />
          </motion.div>
        )}

        {activeTab === 'relatio' && (
          <motion.div
            key="relatio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-spacing-4xl mx-auto w-full space-y-spacing-2xl"
          >
            <div className="flex items-center gap-spacing-xl">
              <div className="h-px flex-1 bg-border/40" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.6em] text-primary/60 whitespace-nowrap">
                Relatio Favoritos
              </h2>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            <RelatioFavoritesList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RelatioFavoritesList = () => {
  const { favorites, removeFavorite } = useFavorites();
  const relatioFavs = favorites.filter(f => f.type === 'relatio');

  if (relatioFavs.length === 0) {
    return (
      <div className="text-center py-spacing-3xl opacity-30">
        <Icons.Sparkles className="w-spacing-2xl h-spacing-2xl mx-auto mb-spacing-md stroke-1" />
        <p className="font-serif italic text-premium-lg">Nenhuma conexão salva ainda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-spacing-lg">
      {relatioFavs.map((fav) => (
        <motion.div
          key={fav.id}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card p-spacing-lg rounded-premium border border-border/40 hover:border-primary/20 transition-all group relative"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-spacing-xs">
              <div className="flex items-center gap-spacing-xs">
                <div className="w-spacing-lg h-spacing-lg rounded-premium-full bg-primary/10 flex items-center justify-center">
                  <Icons.Sparkles className="w-spacing-sm h-spacing-sm text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Relatio</span>
                <span className="text-[10px] text-muted-foreground opacity-40">
                  {format(new Date(fav.timestamp), "d 'de' MMM", { locale: ptBR })}
                </span>
              </div>
              <h3 className="text-premium-lg font-serif font-bold text-primary">{fav.title}</h3>
              <p className="text-premium-sm text-muted-foreground italic line-clamp-spacing-xs">"{fav.content}"</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFavorite(fav.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Icons.Trash className="w-spacing-md h-spacing-md" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SpiritualJournalPage;
