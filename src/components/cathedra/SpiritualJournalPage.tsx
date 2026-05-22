import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HomeCard } from './HomeCard';
import { HomeButton } from './HomeButton';

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

const SpiritualJournalPage = () => {
  const { user } = useAuth();
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
    <div className="app-container py-12 md:py-24 space-y-16 md:space-y-32">
      <SEOHead title="Diário Espiritual - Reflexão e Oração" description="Guarde suas reflexões diárias e acompanhe seu crescimento espiritual." path="/diario" />
      
      <header className="text-center space-y-8 max-w-3xl mx-auto">
        <div className="premium-tag mx-auto">
          <Icons.PenLine className="w-4 h-4 text-secondary" />
          <span>Diarium Spirituale</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-display font-bold text-primary tracking-tight">
          Diário Espiritual
        </h1>
        <p className="text-lg md:text-xl text-primary/60 italic font-serif leading-relaxed">
          "Examina, ó minha alma, o que fizeste hoje diante de Deus."
        </p>
      </header>

      {/* Entry Form */}
      <section className="max-w-4xl mx-auto w-full">
        <HomeCard padding="lg" className="space-y-16">
          <div className="space-y-8">
            <h3 className="text-2xl font-display font-bold text-primary text-center">Como está sua alma hoje?</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all duration-700 ${
                    mood === m.id 
                      ? 'bg-primary border-primary text-primary-foreground shadow-premium scale-105' 
                      : 'bg-muted/30 border-border/10 text-foreground/40 hover:border-primary/20 hover:bg-muted/50'
                  }`}
                >
                  <m.icon className="w-8 h-8" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua reflexão, gratidão ou pedido de perdão..."
              className="min-h-[300px] rounded-premium border-border/20 p-8 md:p-12 font-serif text-xl md:text-2xl leading-relaxed focus-visible:ring-primary/10 bg-muted/10 border-none shadow-inner resize-none placeholder:italic placeholder:opacity-30"
            />
            <div className="flex justify-center">
              <HomeButton 
                onClick={saveEntry}
                disabled={isLoading || !content.trim()}
                variant="primary"
                className="px-16 h-14"
              >
                {isLoading ? 'Guardando...' : 'Guardar Reflexão'}
              </HomeButton>
            </div>
          </div>
        </HomeCard>
      </section>

      {/* History */}
      <section className="space-y-12 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap uppercase">
            Memória da Alma
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {isFetching ? (
          <div className="space-y-10">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-muted/10 animate-pulse rounded-premium border border-border/10" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-12">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-10 md:p-14 rounded-premium border border-border/40 shadow-premium space-y-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-700 h-full"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-secondary flex items-center justify-center">
                      {MOODS.find(m => m.id === entry.mood)?.icon({ className: "w-6 h-6" }) || <Icons.Sun className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-1">Registro de Graça</p>
                      <span className="text-sm font-serif font-bold text-primary">
                        {format(new Date(entry.entry_date + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Icons.Quote className="w-10 h-10 text-primary/5" />
                </div>
                <p className="text-xl md:text-2xl text-primary/80 font-serif italic leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-secondary/20">
                  "{entry.content}"
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 opacity-20 hover:opacity-40 transition-opacity duration-1000">
            <Icons.PenLine className="w-16 h-16 mx-auto mb-6 stroke-1" />
            <p className="font-serif italic text-xl">Nenhuma reflexão guardada ainda.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default SpiritualJournalPage;