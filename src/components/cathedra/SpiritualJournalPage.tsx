import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <SEOHead title="Diário Espiritual - Reflexão e Oração" description="Guarde suas reflexões diárias e acompanhe seu crescimento espiritual." path="/diario" />
      
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full">
          <Icons.PenLine className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-secondary/60">Diarium Spirituale</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#0F172A]">Diário Espiritual</h1>
        <p className="text-lg text-[#0F172A]/60 italic font-serif">"Examina, ó minha alma, o que fizeste hoje diante de Deus."</p>
      </header>

      {/* Entry Form */}
      <section className="bg-white border border-[#0F172A]/5 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-10">
        <div className="space-y-6">
          <h3 className="text-xl font-serif font-bold text-[#0F172A] text-center">Como está sua alma hoje?</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all ${
                  mood === m.id 
                    ? 'bg-primary border-primary text-white shadow-lg scale-110' 
                    : 'bg-[#F8F5EE] border-[#0F172A]/5 text-[#0F172A]/40 hover:border-primary/20'
                }`}
              >
                <m.icon className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva sua reflexão, gratidão ou pedido de perdão..."
            className="min-h-[200px] rounded-[2rem] border-[#0F172A]/10 p-8 font-serif text-lg leading-relaxed focus-visible:ring-primary/20 bg-[#F8F5EE]/30"
          />
          <div className="flex justify-center">
            <Button 
              onClick={saveEntry}
              disabled={isLoading || !content.trim()}
              className="px-12 py-6 rounded-full text-premium-tiny font-black uppercase tracking-widest shadow-xl active:scale-95"
            >
              {isLoading ? 'Salvando...' : 'Guardar Reflexão'}
            </Button>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-[#0F172A]/10" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/30">Reflexões Anteriores</h2>
          <div className="h-px flex-1 bg-[#0F172A]/10" />
        </div>

        {isFetching ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/50 animate-pulse rounded-[2rem] border border-[#0F172A]/5" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="grid gap-6">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] border border-[#0F172A]/5 shadow-sm space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/5 text-primary">
                      {MOODS.find(m => m.id === entry.mood)?.icon({ className: "w-4 h-4" }) || <Icons.Sun className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-serif font-bold text-[#0F172A]">
                      {format(new Date(entry.entry_date + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <Icons.Quote className="w-6 h-6 text-[#0F172A]/5" />
                </div>
                <p className="text-lg text-[#0F172A]/70 font-serif italic leading-relaxed whitespace-pre-wrap">
                  "{entry.content}"
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 opacity-30">
            <Icons.PenLine className="w-12 h-12 mx-auto mb-4" />
            <p className="font-serif italic text-lg">Nenhuma reflexão guardada ainda.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default SpiritualJournalPage;