import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/cathedra/Button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HomeCard } from './HomeCard';
import { HomeButton } from './HomeButton';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  entry_date: string;
  created_at: string;
  is_reviewed: boolean;
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
  const [reflections, setReflections] = useState<any[]>([]);
  const [logosReflections, setLogosReflections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'journal' | 'reflections' | 'logos'>('journal');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [filterTrail, setFilterTrail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState<{ id: string, type: 'journal' | 'reflection' | 'logos', content: string } | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'reviewed' | 'unreviewed'>('all');

  const fetchEntries = async () => {
    if (!user) return;
    setIsFetching(true);
    
    try {
      const [journalRes, reflectionsRes, logosRes] = await Promise.all([
        supabase
          .from('spiritual_journal')
          .select('*')
          .eq('user_id', user.id)
          .order('entry_date', { ascending: false })
          .limit(30),
        supabase
          .from('user_notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('content_type', 'quiz_deepening')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('content_type', 'logos_reflection')
          .order('created_at', { ascending: false })
      ]);
      
      if (journalRes.data) setEntries(journalRes.data as JournalEntry[]);
      if (reflectionsRes.data) setReflections(reflectionsRes.data);
      if (logosRes.data) {
        setLogosReflections(logosRes.data.map(r => {
          let parsedMetadata = r.metadata;
          if (!parsedMetadata && r.note_text.startsWith('{')) {
            try {
              const fullData = JSON.parse(r.note_text);
              parsedMetadata = {
                prompt: fullData.prompt,
                tone: fullData.tone,
                timestamp: fullData.timestamp
              };
              // Note: r.note_text might need to be cleaned up if it was a full JSON string
              if (fullData.reflection) r.note_text = fullData.reflection;
            } catch (e) {
              console.error('Failed to parse legacy reflection:', e);
            }
          }
          return { ...r, parsed: parsedMetadata };
        }));
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setIsFetching(false);
    }
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

  const deleteEntry = async (id: string, type: 'journal' | 'reflection' | 'logos') => {
    if (!confirm('Deseja realmente apagar esta reflexão?')) return;
    
    try {
      const table = type === 'journal' ? 'spiritual_journal' : 'user_notes';
      const { error } = await supabase.from(table).delete().eq('id', id);
      
      if (error) throw error;
      toast.success('Reflexão removida.');
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao apagar reflexão');
      console.error(error);
    }
  };

  const updateEntry = async () => {
    if (!editingEntry || !editingEntry.content.trim()) return;
    
    setIsLoading(true);
    try {
      if (editingEntry.type === 'journal') {
        await supabase
          .from('spiritual_journal')
          .update({ content: editingEntry.content.trim(), updated_at: new Date().toISOString() })
          .eq('id', editingEntry.id);
      } else {
        await supabase
          .from('user_notes')
          .update({ note_text: editingEntry.content.trim(), updated_at: new Date().toISOString() })
          .eq('id', editingEntry.id);
      }
      toast.success('Reflexão atualizada.');
      setEditingEntry(null);
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao atualizar reflexão');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReview = async (id: string, type: 'journal' | 'reflection' | 'logos', currentStatus: boolean) => {
    try {
      const table = type === 'journal' ? 'spiritual_journal' : 'user_notes';
      const { error } = await supabase
        .from(table)
        .update({ is_reviewed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(!currentStatus ? 'Marcado como revisado.' : 'Marcado como não revisado.');
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao atualizar status de revisão');
      console.error(error);
    }
  };

  const sortedAndFilteredItems = (items: any[], searchFields: string[], dateField: string) => {
    let result = items;
    
    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(item => 
        searchFields.some(field => {
          const val = item[field];
          if (typeof val === 'string') return val.toLowerCase().includes(searchQuery.toLowerCase());
          return false;
        })
      );
    }

    // Apply review filter
    if (reviewFilter === 'reviewed') {
      result = result.filter(item => item.is_reviewed === true);
    } else if (reviewFilter === 'unreviewed') {
      result = result.filter(item => item.is_reviewed === false);
    }

    return [...result].sort((a, b) => {
      let valA = a[dateField];
      let valB = b[dateField];
      
      // Special case for logos timestamp
      if (dateField === 'timestamp' && a.parsed?.timestamp) valA = a.parsed.timestamp;
      if (dateField === 'timestamp' && b.parsed?.timestamp) valB = b.parsed.timestamp;
      
      const dateA = new Date(valA || a.created_at).getTime();
      const dateB = new Date(valB || b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  return (
    <div className="app-container py-12 md:py-24 space-y-16 md:space-y-32">
      <SEOHead title="Diário Espiritual - Reflexão e Oração" description="Guarde suas reflexões diárias e acompanhe seu crescimento espiritual." path="/diario" />
      
      <header className="text-center space-y-8 max-w-3xl mx-auto">
        <div className="premium-tag mx-auto">
          <Icons.PenLine className="w-4 h-4 text-secondary" />
          <span>Diarium Spirituale</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-display font-bold text-primary tracking-tightest">
          Diário Espiritual
        </h1>
        <p className="text-lg md:text-xl text-primary/60 italic font-serif leading-relaxed">
          "Examina, ó minha alma, o que fizeste hoje diante de Deus."
        </p>
      </header>

      {/* Entry Form */}
      <section className="max-w-4xl mx-auto w-full">
        <HomeCard padding="lg" className="space-y-16 bg-primary/[0.01]">
          <div className="space-y-8">
            <h3 className="text-2xl font-display font-bold text-primary text-center">Como está sua alma hoje?</h3>
            <div className="flex flex-wrap justify-center gap-8">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center gap-4 p-6 rounded-premium border transition-all duration-700 ${
                    mood === m.id 
                      ? 'bg-primary border-primary text-primary-foreground shadow-premium scale-105' 
                      : 'bg-primary/[0.02] border-border/10 text-foreground/40 hover:border-primary/20 hover:bg-primary/[0.05]'
                  }`}
                >
                  <m.icon className="w-8 h-8" />
                  <span className="text-premium-tiny font-bold uppercase tracking-widest">{m.label}</span>
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
      <section className="space-y-12 max-w-4xl mx-auto w-full pb-32">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-4xl mx-auto">
            <div className="relative flex-1 w-full">
              <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
              <input 
                type="text" 
                placeholder="Buscar reflexões..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-6 rounded-full bg-primary/[0.02] border border-primary/5 font-serif italic focus:outline-none focus:border-primary/20 transition-all text-primary/70"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-primary/[0.02] border border-primary/5 rounded-full p-1 h-14">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={cn(
                    "px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                    reviewFilter === 'all' ? "bg-primary text-primary-foreground shadow-sm" : "text-primary/40 hover:text-primary/60"
                  )}
                >
                  Todas
                </button>
                <button
                  onClick={() => setReviewFilter('unreviewed')}
                  className={cn(
                    "px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                    reviewFilter === 'unreviewed' ? "bg-primary text-primary-foreground shadow-sm" : "text-primary/40 hover:text-primary/60"
                  )}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setReviewFilter('reviewed')}
                  className={cn(
                    "px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                    reviewFilter === 'reviewed' ? "bg-primary text-primary-foreground shadow-sm" : "text-primary/40 hover:text-primary/60"
                  )}
                >
                  Revisadas
                </button>
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="h-14 px-8 rounded-full bg-primary/[0.02] border border-primary/5 text-primary/40 hover:text-primary hover:border-primary/20 transition-all flex items-center gap-3 whitespace-nowrap"
              >
                <Icons.ArrowUpDown className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigas'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-12 w-full">
            <div className="h-px flex-1 bg-border/30" />
            <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
              Memória da Alma
            </h2>
            <div className="h-px flex-1 bg-border/30" />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 p-1 bg-muted/30 rounded-full border border-border/10">
            <button 
              onClick={() => setActiveTab('journal')}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'journal' ? 'bg-primary text-primary-foreground shadow-premium' : 'text-primary/40 hover:text-primary/60'
              }`}
            >
              Diário
            </button>
            <button 
              onClick={() => setActiveTab('reflections')}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'reflections' ? 'bg-primary text-primary-foreground shadow-premium' : 'text-primary/40 hover:text-primary/60'
              }`}
            >
              Reflexões
            </button>
            <button 
              onClick={() => setActiveTab('logos')}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'logos' ? 'bg-primary text-primary-foreground shadow-premium' : 'text-primary/40 hover:text-primary/60'
              }`}
            >
              Logos
            </button>
          </div>
        </div>

        {isFetching ? (
          <div className="space-y-10">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-muted/10 animate-pulse rounded-premium border border-border/10" />
            ))}
          </div>
        ) : activeTab === 'journal' ? (
          sortedAndFilteredItems(entries, ['content'], 'created_at').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-12">
              {sortedAndFilteredItems(entries, ['content'], 'created_at').map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card p-10 md:p-14 rounded-premium border border-border/40 shadow-premium space-y-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-700 h-full"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-premium-sm bg-primary/5 text-secondary flex items-center justify-center">
                        {MOODS.find(m => m.id === entry.mood)?.icon({ className: "w-6 h-6" }) || <Icons.Sun className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-premium-tiny font-bold uppercase tracking-widest text-primary/40 mb-1">Registro de Graça</p>
                        <span className="text-sm font-serif font-bold text-primary">
                          {format(new Date(entry.created_at), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleReview(entry.id, 'journal', entry.is_reviewed)} 
                        className={cn("transition-colors", entry.is_reviewed ? "text-secondary" : "text-primary/10 hover:text-primary")}
                        title={entry.is_reviewed ? "Marcar como pendente" : "Marcar como revisado"}
                      >
                        <Icons.CheckCircle2 className={cn("w-5 h-5", entry.is_reviewed ? "fill-secondary/20" : "")} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingEntry({ id: entry.id, type: 'journal', content: entry.content })} className="text-primary/20 hover:text-primary transition-colors">
                        <Icons.PenLine className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id, 'journal')} className="text-primary/20 hover:text-red-500 transition-colors">
                        <Icons.Trash2 className="w-4 h-4" />
                      </Button>
                      <Icons.Quote className="w-10 h-10 text-primary/5" />
                    </div>
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
          )
        ) : activeTab === 'reflections' ? (
          sortedAndFilteredItems(reflections, ['note_text', 'content_id'], 'created_at').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-12">
              {sortedAndFilteredItems(reflections, ['note_text', 'content_id'], 'created_at').map((ref) => (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card p-10 md:p-14 rounded-premium border border-border/40 shadow-premium space-y-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-700 h-full"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-premium-sm bg-primary/5 text-primary flex items-center justify-center">
                        <Icons.Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-premium-tiny font-bold uppercase tracking-widest text-primary/40 mb-1">Aprofundamento do Quiz</p>
                        <span className="text-sm font-serif font-bold text-primary">
                          {format(new Date(ref.created_at), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <p className="text-[10px] text-primary/30 mt-1 uppercase tracking-tighter italic">{ref.content_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleReview(ref.id, 'reflection', ref.is_reviewed)} 
                        className={cn("transition-colors", ref.is_reviewed ? "text-secondary" : "text-primary/10 hover:text-primary")}
                        title={ref.is_reviewed ? "Marcar como pendente" : "Marcar como revisado"}
                      >
                        <Icons.CheckCircle2 className={cn("w-5 h-5", ref.is_reviewed ? "fill-secondary/20" : "")} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingEntry({ id: ref.id, type: 'reflection', content: ref.note_text })} className="text-primary/20 hover:text-primary transition-colors">
                        <Icons.PenLine className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteEntry(ref.id, 'reflection')} className="text-primary/20 hover:text-red-500 transition-colors">
                        <Icons.Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl text-primary/80 font-serif italic leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-primary/10">
                    "{ref.note_text}"
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 opacity-20 hover:opacity-40 transition-opacity duration-1000">
              <Icons.Sparkles className="w-16 h-16 mx-auto mb-6 stroke-1" />
              <p className="font-serif italic text-xl">Responda as perguntas no final do diagnóstico para vê-las aqui.</p>
            </div>
          )
        ) : (
          <div className="space-y-12">
            <div className="flex justify-center gap-4">
               {['contemplative', 'poetic', 'doctrinal', 'brief'].map(t => (
                 <button
                   key={t}
                   onClick={() => setFilterTrail(filterTrail === t ? null : t)}
                   className={cn(
                     "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                     filterTrail === t ? "bg-primary text-primary-foreground border-primary" : "border-primary/10 text-primary/40 hover:border-primary/30"
                   )}
                 >
                   {t}
                 </button>
               ))}
            </div>

            {sortedAndFilteredItems(logosReflections, ['note_text'], 'timestamp').length > 0 ? (
              <div className="grid grid-cols-1 gap-12">
                {sortedAndFilteredItems(logosReflections, ['note_text'], 'timestamp')
                  .filter(r => !filterTrail || r.parsed?.tone === filterTrail)
                  .map((ref) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card p-10 md:p-14 rounded-premium border border-border/40 shadow-premium space-y-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-premium-sm bg-primary/5 text-primary flex items-center justify-center">
                          <Icons.Compass className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-premium-tiny font-bold uppercase tracking-widest text-primary/40 mb-1">Mestre Logos</p>
                          <span className="text-sm font-serif font-bold text-primary">
                            {format(new Date(ref.parsed?.timestamp || ref.created_at), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleReview(ref.id, 'logos', ref.is_reviewed)} 
                          className={cn("transition-colors", ref.is_reviewed ? "text-secondary" : "text-primary/10 hover:text-primary")}
                          title={ref.is_reviewed ? "Marcar como pendente" : "Marcar como revisado"}
                        >
                          <Icons.CheckCircle2 className={cn("w-5 h-5", ref.is_reviewed ? "fill-secondary/20" : "")} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingEntry({ id: ref.id, type: 'logos', content: ref.note_text })} className="text-primary/20 hover:text-primary transition-colors">
                          <Icons.PenLine className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteEntry(ref.id, 'logos')} className="text-primary/20 hover:text-red-500 transition-colors">
                          <Icons.Trash2 className="w-4 h-4" />
                        </Button>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-secondary/10 text-secondary rounded-full">
                          {ref.parsed?.tone || 'contemplative'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {ref.parsed?.prompt && (
                        <p className="text-sm text-primary/40 italic font-serif leading-relaxed px-4 py-2 border-l border-primary/10">
                          "{ref.parsed.prompt}"
                        </p>
                      )}
                      <p className="text-xl text-primary/80 font-serif leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-secondary/20">
                        {ref.note_text}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-primary/5 flex justify-end">
                      <HomeButton 
                        variant="outline" 
                        size="sm" 
                        className="text-[9px] h-10 px-6"
                        onClick={() => {
                          const chatBtn = document.querySelector('button[aria-label*="Logos"]') as HTMLButtonElement;
                          if (chatBtn) chatBtn.click();
                        }}
                      >
                        Reabrir Diálogo
                      </HomeButton>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 opacity-20 hover:opacity-40 transition-opacity duration-1000">
                <Icons.Compass className="w-16 h-16 mx-auto mb-6 stroke-1" />
                <p className="font-serif italic text-xl">Inicie um diálogo com o Logos para guardar reflexões.</p>
              </div>
            )}
          </div>
        )}
      </section>

      <AnimatePresence>
        {editingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl p-10 rounded-premium border border-border/40 shadow-premium space-y-8"
            >
              <h3 className="text-2xl font-display font-bold text-primary">Editar Reflexão</h3>
              <Textarea
                value={editingEntry.content}
                onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                className="min-h-[250px] font-serif text-xl leading-relaxed bg-muted/10 border-none shadow-inner resize-none"
              />
              <div className="flex justify-end gap-6">
                <Button variant="outline" onClick={() => setEditingEntry(null)}>Cancelar</Button>
                <HomeButton 
                  onClick={updateEntry}
                  disabled={isLoading || !editingEntry.content.trim()}
                  variant="primary"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </HomeButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpiritualJournalPage;