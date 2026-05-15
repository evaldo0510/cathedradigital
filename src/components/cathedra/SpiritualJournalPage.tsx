import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    
    const { error } = await supabase
      .from('spiritual_journal')
      .upsert({
        user_id: user.id,
        content: content.trim(),
        mood,
        entry_date: today,
        updated_at: new Date().toISOString()
      });

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
    <div className="app-container section-spacing stack-spacing">
      <SEOHead title="Diário Espiritual - Reflexão e Oração" description="Guarde suas reflexões diárias e acompanhe seu crescimento espiritual." path="/diario" />
      
      <header className="premium-header">
        <div className="premium-tag mx-auto">
          <Icons.PenLine className="w-4 h-4 text-secondary" />
          <span>Diarium Spirituale</span>
        </div>
        <h1 className="font-display font-medium text-primary tracking-tighter">
          Diário Espiritual
        </h1>
        <p className="text-xl text-primary/60 italic font-serif leading-relaxed mx-auto max-w-2xl">
          "Examina, ó minha alma, o que fizeste hoje diante de Deus."
        </p>
      </header>

      {/* Entry Form */}
      <section className="max-w-4xl mx-auto w-full">
        <Card padding="lg" className="space-y-20">
          <div className="space-y-12">
            <h3 className="text-2xl font-serif italic text-primary/70 text-center">Como está sua alma hoje?</h3>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center gap-5 p-8 rounded-premium-sm border transition-all duration-700 ${
                    mood === m.id 
                      ? 'bg-primary border-primary text-primary-foreground shadow-premium scale-105' 
                      : 'bg-primary/[0.01] border-border/10 text-foreground/40 hover:border-primary/20 hover:bg-primary/[0.03]'
                  }`}
                >
                  <m.icon className="w-10 h-10" strokeWidth={1} />
                  <span className="text-premium-tiny font-bold uppercase tracking-[0.3em]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua reflexão, gratidão ou pedido de perdão..."
              className="min-h-[400px] rounded-premium border-none p-12 font-serif text-2xl md:text-3xl leading-relaxed focus-visible:ring-primary/5 bg-primary/[0.01] shadow-inner-soft resize-none placeholder:italic placeholder:opacity-30"
            />
            <div className="flex justify-center">
              <Button 
                onClick={saveEntry}
                disabled={isLoading || !content.trim()}
                variant="primary"
                className="px-20 h-16 rounded-full text-xs font-bold uppercase tracking-[0.3em]"
              >
                {isLoading ? 'Guardando...' : 'Guardar Reflexão'}
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* History */}
      <section className="space-y-16 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-14">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Memória da Alma
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>

        {isFetching ? (
          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-muted/10 animate-pulse rounded-premium border border-border/10" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-14">
            {entries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card variant="interactive" padding="lg" className="space-y-10 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/[0.02] border border-border/40 text-secondary flex items-center justify-center shadow-inner-soft group-hover:scale-105 transition-transform duration-700">
                        {MOODS.find(m => m.id === entry.mood)?.icon({ className: "w-8 h-8", strokeWidth: 1.25 }) || <Icons.Sun className="w-8 h-8" strokeWidth={1.25} />}
                      </div>
                      <div>
                        <p className="text-premium-tiny font-bold uppercase tracking-widest text-primary/30 mb-1">Registro de Graça</p>
                        <span className="text-lg font-serif font-bold text-primary opacity-80">
                          {format(new Date(entry.entry_date + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Icons.Quote className="w-16 h-16 text-primary/5 absolute right-10 top-10" strokeWidth={1} />
                  </div>
                  <p className="text-2xl md:text-3xl text-primary/80 font-serif italic leading-relaxed whitespace-pre-wrap pl-10 border-l-2 border-secondary/20">
                    "{entry.content}"
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-48 opacity-20 hover:opacity-40 transition-opacity duration-1000">
            <Icons.PenLine className="w-24 h-24 mx-auto mb-10 stroke-[0.5]" />
            <p className="font-serif italic text-2xl">Nenhuma reflexão guardada ainda.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default SpiritualJournalPage;